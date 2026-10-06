#!/usr/bin/env bash
# Egress guardrail for the workshop tester Codespace (workshop-level hardening, not a GitHub product control).
#
#   egress.sh start   start the logging proxy and route the lab user's traffic through it
#
# Audit (always on): a local proxy logs every host contacted through it. hosts.txt lists each host once,
# marked "listed" or "unlisted" against the allowlist; connections.log keeps every request.
# Lock (EGRESS_LOCK=true): the proxy refuses unlisted hosts and iptables rejects direct outbound traffic
# from the lab user, so tools that ignore the proxy settings are blocked too. The lock needs passwordless
# sudo and the NET_ADMIN capability; when it cannot be verified this script prints EGRESS_LOCK=failed:<reason>.
#
# Allowlist: egress-allowlist.txt plus the GitHub /meta domains (website, copilot, codespaces).
# Output markers read by orchestrate.sh: EGRESS_AUDIT=on, EGRESS_LOCK=enforced|failed:<reason>.
set -u

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
EGRESS_DIR=${EGRESS_DIR:-/tmp/workshop-tester/egress}
PORT=${EGRESS_PORT:-3128}
LOCK=${EGRESS_LOCK:-false}
ENV_FILE=${WORKSHOP_TESTER_ENV:-$HOME/.workshop-tester.env}
PROXY="http://127.0.0.1:$PORT"

lock_failed() {
  echo "EGRESS_LOCK=failed:$1"
  echo "lock-failed" > "$EGRESS_DIR/mode"
  exit 1
}

build_allowlist() {
  {
    grep -Ev '^[[:space:]]*(#|$)' "$SCRIPT_DIR/egress-allowlist.txt"
    if meta=$( (set -a; [ -f "$ENV_FILE" ] && . "$ENV_FILE"; set +a; gh api meta --jq '.domains | (.website + .copilot + .codespaces)[]') 2>/dev/null ); then
      printf '%s\n' "$meta"
    else
      echo "EGRESS_META=unavailable (allowlist file only)" >&2
    fi
  } | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^\*\.//' | tr '[:upper:]' '[:lower:]' | sort -u > "$EGRESS_DIR/allowlist.txt"
  echo "EGRESS_ALLOWLIST=$(wc -l < "$EGRESS_DIR/allowlist.txt") entries"
}

write_proxy() {
  cat > "$EGRESS_DIR/proxy.mjs" <<'EOF'
// Minimal HTTP/CONNECT proxy: logs every destination host and, when enforce=1, refuses hosts outside the allowlist.
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';

const [port, dir, enforce] = process.argv.slice(2);
const allow = fs.readFileSync(path.join(dir, 'allowlist.txt'), 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
const listed = (h) => {
  h = h.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  return allow.some((d) => h === d || h.endsWith('.' + d));
};
const seen = new Set();
const record = (method, host, p) => {
  const ok = listed(host);
  const go = ok || enforce !== '1';
  const line = [new Date().toISOString(), method, `${host}:${p}`, ok ? 'listed' : 'unlisted', go ? 'forwarded' : 'refused'].join('\t');
  fs.appendFileSync(path.join(dir, 'connections.log'), line + '\n');
  const key = `${host}\t${ok}\t${go}`;
  if (!seen.has(key)) { seen.add(key); fs.appendFileSync(path.join(dir, 'hosts.txt'), line + '\n'); }
  return go;
};

const server = http.createServer((req, res) => {
  let u;
  try { u = new URL(req.url); } catch { res.writeHead(400).end(); return; }
  const host = u.hostname.replace(/^\[|\]$/g, '');
  const p = u.port || '80';
  if (!record(req.method, host, p)) { res.writeHead(403).end('blocked by the workshop egress lock\n'); return; }
  const up = http.request({ host, port: p, method: req.method, path: u.pathname + u.search, headers: req.headers }, (r) => {
    res.writeHead(r.statusCode, r.headers);
    r.pipe(res);
  });
  up.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end(); });
  req.pipe(up);
});

server.on('connect', (req, sock, head) => {
  const m = /^\[?([^\]]+?)\]?:(\d+)$/.exec(req.url || '');
  if (!m) { sock.end('HTTP/1.1 400 Bad Request\r\n\r\n'); return; }
  const [, host, p] = m;
  if (!record('CONNECT', host, p)) { sock.end('HTTP/1.1 403 Forbidden\r\n\r\n'); return; }
  const up = net.connect(Number(p), host, () => {
    sock.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    if (head && head.length) up.write(head);
    up.pipe(sock);
    sock.pipe(up);
  });
  up.on('error', () => sock.end('HTTP/1.1 502 Bad Gateway\r\n\r\n'));
  sock.on('error', () => up.destroy());
});

server.listen(Number(port), '127.0.0.1');
EOF
}

proxy_ready() {
  local i
  for i in $(seq 1 20); do
    (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null && return 0
    sleep 0.5
  done
  return 1
}

route_through_proxy() {
  local tmp
  tmp=$(mktemp)
  [ -f "$ENV_FILE" ] && sed '/^# >>> workshop-tester egress$/,/^# <<< workshop-tester egress$/d' "$ENV_FILE" > "$tmp"
  {
    echo '# >>> workshop-tester egress'
    for v in HTTPS_PROXY https_proxy HTTP_PROXY http_proxy; do printf 'export %s=%s\n' "$v" "$PROXY"; done
    for v in NO_PROXY no_proxy; do printf 'export %s=localhost,127.0.0.1,::1\n' "$v"; done
    echo 'export NODE_USE_ENV_PROXY=1'
    echo '# <<< workshop-tester egress'
  } >> "$tmp"
  (umask 077; cat "$tmp" > "$ENV_FILE")
  rm -f "$tmp"
}

apply_lock() {
  local uid ipt state
  sudo -n true 2>/dev/null || lock_failed "no passwordless sudo"
  command -v iptables >/dev/null || { sudo -n apt-get -qq update >/dev/null 2>&1 && sudo -n apt-get -qq install -y iptables >/dev/null 2>&1; }
  command -v iptables >/dev/null || lock_failed "iptables unavailable"
  uid=$(id -u)
  for ipt in iptables ip6tables; do
    command -v "$ipt" >/dev/null || continue
    if sudo -n "$ipt" -m conntrack -h >/dev/null 2>&1; then state="-m conntrack --ctstate ESTABLISHED,RELATED"; else state="-m state --state ESTABLISHED,RELATED"; fi
    sudo -n "$ipt" -N WT_EGRESS 2>/dev/null || sudo -n "$ipt" -F WT_EGRESS || lock_failed "$ipt chain (NET_ADMIN missing?)"
    # shellcheck disable=SC2086
    sudo -n "$ipt" -A WT_EGRESS -o lo -j RETURN &&
      sudo -n "$ipt" -A WT_EGRESS $state -j RETURN &&
      sudo -n "$ipt" -A WT_EGRESS -p udp --dport 53 -j RETURN &&
      sudo -n "$ipt" -A WT_EGRESS -p tcp --dport 53 -j RETURN &&
      sudo -n "$ipt" -A WT_EGRESS -j REJECT || lock_failed "$ipt rules"
    sudo -n "$ipt" -C OUTPUT -m owner --uid-owner "$uid" -j WT_EGRESS 2>/dev/null ||
      sudo -n "$ipt" -I OUTPUT -m owner --uid-owner "$uid" -j WT_EGRESS || lock_failed "$ipt owner match"
  done
}

probe_lock() {
  curl -fsS -o /dev/null --max-time 15 -x "$PROXY" https://api.github.com/zen || lock_failed "api.github.com not reachable through the proxy"
  curl -fsS -o /dev/null --max-time 15 -x "$PROXY" https://example.com 2>/dev/null && lock_failed "proxy forwarded example.com"
  curl -fsS -o /dev/null --max-time 10 --noproxy '*' https://example.com 2>/dev/null && lock_failed "direct connection to example.com succeeded"
  # Drop the probe traffic so the evidence only shows what the lab contacted.
  : > "$EGRESS_DIR/hosts.txt"
  : > "$EGRESS_DIR/connections.log"
  echo "EGRESS_LOCK=enforced"
  echo "locked" > "$EGRESS_DIR/mode"
}

start() {
  local node enforce=0
  mkdir -p "$EGRESS_DIR"
  chmod 0755 "$EGRESS_DIR"
  : > "$EGRESS_DIR/hosts.txt"
  : > "$EGRESS_DIR/connections.log"
  echo "audit" > "$EGRESS_DIR/mode"
  build_allowlist
  write_proxy
  node=$(command -v node) || { echo "EGRESS_AUDIT=failed:node unavailable"; exit 1; }
  pkill -f "$EGRESS_DIR/proxy.mjs" 2>/dev/null; sudo -n pkill -f "$EGRESS_DIR/proxy.mjs" 2>/dev/null
  if [ "$LOCK" = true ]; then
    enforce=1
    # The proxy runs as root so the lab user's iptables owner match does not apply to its upstream connections.
    sudo -n true 2>/dev/null || lock_failed "no passwordless sudo"
    sudo -n setsid -f "$node" "$EGRESS_DIR/proxy.mjs" "$PORT" "$EGRESS_DIR" "$enforce" > "$EGRESS_DIR/proxy.out" 2>&1 < /dev/null
  else
    setsid -f "$node" "$EGRESS_DIR/proxy.mjs" "$PORT" "$EGRESS_DIR" "$enforce" > "$EGRESS_DIR/proxy.out" 2>&1 < /dev/null
  fi
  proxy_ready || { echo "EGRESS_AUDIT=failed:proxy did not start"; cat "$EGRESS_DIR/proxy.out"; exit 1; }
  route_through_proxy
  echo "EGRESS_AUDIT=on"
  if [ "$LOCK" = true ]; then
    apply_lock
    probe_lock
  fi
}

case ${1:-} in
  start) start ;;
  *) echo "usage: $0 start" >&2; exit 2 ;;
esac
