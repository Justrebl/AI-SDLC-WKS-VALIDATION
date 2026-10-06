#!/usr/bin/env bash
# Orchestrates one workshop tester run from a GitHub Actions runner.
#
#   orchestrate.sh setup    create the sandbox repository and the Codespace, wait until the Codespace is ready
#   orchestrate.sh run      start run-lab.sh inside the Codespace and wait for it to finish
#   orchestrate.sh collect  copy the lab results back to $OUT_DIR/lab
#   orchestrate.sh cleanup  delete the Codespace, the sandbox repository and orphaned sandboxes from older runs
#
# Required environment:
#   GH_TOKEN              tester token, used on the runner only (create/delete the sandbox repository and Codespace)
#   SANDBOX_TOKEN         sandbox-scoped token sent to the Codespace as GH_TOKEN (fine-grained PAT limited to the
#                         sandbox owner: Contents, Issues, Pull requests, Actions, Workflows read/write)
#   COPILOT_GITHUB_TOKEN  Copilot CLI token (fine-grained PAT with Copilot Requests); defaults to GH_TOKEN
#   SANDBOX_OWNER         user or organization that owns sandboxes
#   SANDBOX_NAME          sandbox repository name, must start with "workshop-tester-"
#   OUT_DIR               local output directory (uploaded as the run artifact)
# Optional: CODESPACE_MACHINE (default standardLinux32gb), LAB_TIMEOUT_S (default 14400),
#           EGRESS_LOCK=true (block Codespace egress outside the allowlist; the run fails closed if it cannot),
#           SOURCE_REPO, SOURCE_SHA, RUN_URL (metadata for the report)
set -u

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
: "${OUT_DIR:?}" "${SANDBOX_OWNER:?}" "${SANDBOX_NAME:?}"
case $SANDBOX_NAME in workshop-tester-*) ;; *) echo "SANDBOX_NAME must start with workshop-tester-" >&2; exit 2;; esac
SANDBOX_REPO="$SANDBOX_OWNER/$SANDBOX_NAME"
CODESPACE_MACHINE=${CODESPACE_MACHINE:-standardLinux32gb}
# Budget within the 360-minute lab_run job: setup (<= 80 min, image wait included) + lab + collect (10) + cleanup (<= 15, step timeout).
LAB_TIMEOUT_S=${LAB_TIMEOUT_S:-14400}
export COPILOT_GITHUB_TOKEN=${COPILOT_GITHUB_TOKEN:-${GH_TOKEN-}}
STATE="$OUT_DIR/state.env"
SANDBOX_MARKER="Ephemeral workshop tester sandbox (safe to delete)"
export GH_PROMPT_DISABLED=1
mkdir -p "$OUT_DIR"
export RESULTS_DIR="$OUT_DIR/infra"
# shellcheck source=lib.sh
. "$SCRIPT_DIR/lib.sh"
touch "$STATE"
# shellcheck disable=SC1090
. "$STATE"

save_state() { printf '%s=%q\n' "$1" "$2" >> "$STATE"; }

cs_ssh() {
  # cs_ssh <command> : runs a login shell command inside the Codespace
  gh codespace ssh -c "$CODESPACE" -- "bash -lc $(printf '%q' "$1")"
}

setup() {
  printf '{"source_repo":"%s","source_sha":"%s","run_url":"%s","sandbox":"%s","machine":"%s"}\n' \
    "${SOURCE_REPO-}" "${SOURCE_SHA-}" "${RUN_URL-}" "$SANDBOX_REPO" "$CODESPACE_MACHINE" > "$OUT_DIR/meta.json"

  step infra-tokens infra "Tester secrets are configured" translated 30 \
    '[ -n "${GH_TOKEN-}" ] && echo "GH_TOKEN set" || { echo "WORKSHOP_TESTER_TOKEN secret is missing"; exit 1; }
     [ -n "${SANDBOX_TOKEN-}" ] && echo "SANDBOX_TOKEN set" || { echo "WORKSHOP_TESTER_SANDBOX_TOKEN secret is missing: the Codespace never receives the tester token"; exit 1; }
     gh api user --jq .login'
  if [ -n "${SOURCE_REPO-}" ] && [ "${SANDBOX_OWNER}" = "${SOURCE_REPO%%/*}" ]; then
    note "sandboxes share the owner of the source repository; set WORKSHOP_TESTER_OWNER to a dedicated account so the sandbox-scoped token cannot reach other repositories"
  fi
  finish_step
  [ "$STEP_CODE" -eq 0 ] || return 1

  if [ -n "${SOURCE_REPO-}" ]; then
    step infra-template preflight "Source repository template flag (Dev Environment Setup template path)" translated 30 \
      "gh api repos/$SOURCE_REPO --jq .is_template"
    if log_has '^true'; then finish_step; else
      note "the repository is not a template, so only the Dev Environment Setup copy fallback works for participants; the tester mirrors that fallback with a snapshot"
      record "$STEP_ID" "$STEP_LEVEL" "$STEP_TITLE" "$STEP_MODE" "$STEP_CMD" "$STEP_CODE" "$STEP_DUR" warn
    fi
  fi

  # Pin the sandbox to the image built from this exact definition, so a stale :latest cannot mask a broken change.
  IMAGE_REPO=$(sed -n 's/^[[:space:]]*"image":[[:space:]]*"\([^":]*\)\(:[^"]*\)\{0,1\}".*/\1/p' "$GITHUB_WORKSPACE/.devcontainer.json" | head -n1)
  IMAGE_TAG="tree-$(git -C "$GITHUB_WORKSPACE" rev-parse HEAD:.github/devcontainer-image 2>/dev/null | cut -c1-12)"
  export IMAGE_REPO IMAGE_TAG
  step infra-image infra "Prebuilt devcontainer image ${IMAGE_REPO}:${IMAGE_TAG} is published and public" translated 1260 '
    case "$IMAGE_REPO" in ghcr.io/*) ;; *) echo "root .devcontainer.json does not reference a ghcr.io image"; exit 1;; esac
    [ "$IMAGE_TAG" != tree- ] || { echo "cannot hash .github/devcontainer-image"; exit 1; }
    name=${IMAGE_REPO#ghcr.io/}
    accept="application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.docker.distribution.manifest.v2+json, application/vnd.oci.image.manifest.v1+json"
    for i in $(seq 1 40); do
      tok=$(curl -fsS "https://ghcr.io/token?scope=repository:$name:pull" | jq -r ".token // empty")
      code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $tok" -H "Accept: $accept" \
        "https://ghcr.io/v2/$name/manifests/$IMAGE_TAG")
      echo "attempt $i: HTTP $code for $IMAGE_REPO:$IMAGE_TAG"
      [ "$code" = 200 ] && exit 0
      sleep 30
    done
    echo "prebuilt image not published (or not public) for this definition: run the Devcontainer image workflow and make the GHCR package public"
    exit 1'
  finish_step
  [ "$STEP_CODE" -eq 0 ] || return 1

  # A snapshot of the tested commit with a single fresh commit, mirroring the Dev Environment Setup copy fallback.
  step infra-sandbox infra "Create the private sandbox repository from a snapshot of the tested commit" translated 600 "
    set -e
    tmp=\$(mktemp -d)
    git -C '$GITHUB_WORKSPACE' archive HEAD | tar -x -C \"\$tmp\"
    cd \"\$tmp\"
    sed -i 's#\"image\":[[:space:]]*\"[^\"]*\"#\"image\": \"$IMAGE_REPO:$IMAGE_TAG\"#' .devcontainer.json
    grep '\"image\"' .devcontainer.json
    git init -q -b main
    git -c user.name='Workshop Tester' -c user.email='workshop-tester@users.noreply.github.com' add -A
    git -c user.name='Workshop Tester' -c user.email='workshop-tester@users.noreply.github.com' commit -q -m 'Workshop snapshot of ${SOURCE_REPO-}@${SOURCE_SHA-}'
    gh repo create '$SANDBOX_REPO' --private --description '$SANDBOX_MARKER for ${SOURCE_REPO-}@${SOURCE_SHA-}'
    git push -q \"https://x-access-token:\$GH_TOKEN@github.com/$SANDBOX_REPO.git\" main
    echo created $SANDBOX_REPO"
  finish_step
  [ "$STEP_CODE" -eq 0 ] || return 1
  save_state SANDBOX_CREATED 1

  step infra-codespace infra "Create the Codespace on the sandbox" translated 1200 \
    "gh codespace create -R '$SANDBOX_REPO' -b main -m '$CODESPACE_MACHINE' --idle-timeout 45m --retention-period 1h --default-permissions"
  # The sandbox is new, so its only Codespace is the one just created. Parsing the create output is a fallback.
  CODESPACE=$(gh codespace list -R "$SANDBOX_REPO" --json name --jq '.[0].name // empty' 2>/dev/null)
  if [ -z "$CODESPACE" ]; then
    CODESPACE=$(grep -Eo '^[a-z0-9]+(-[a-z0-9]+)+$' "$RESULTS_DIR/steps/infra-codespace.log" | tail -n1)
  fi
  [ -n "$CODESPACE" ] && { check "Codespace created" true "$CODESPACE"; save_state CODESPACE "$CODESPACE"; } || check "Codespace created" false
  finish_step
  [ -n "$CODESPACE" ] || return 1

  step infra-ready infra "Codespace available and postCreateCommand finished" translated 1500 "
    for i in \$(seq 1 30); do
      s=\$(gh codespace view -c '$CODESPACE' --json state --jq .state 2>/dev/null); echo \"state=\$s\"
      [ \"\$s\" = Available ] && break; sleep 20
    done
    for i in \$(seq 1 40); do
      gh codespace ssh -c '$CODESPACE' -- \"bash -lc 'command -v copilot && command -v apm && gh aw version && test -d /workspaces/$SANDBOX_NAME/src/front/node_modules'\" && exit 0
      sleep 15
    done
    exit 1"
  finish_step
  [ "$STEP_CODE" -eq 0 ] || return 1

  # The Codespace receives the sandbox-scoped token as GH_TOKEN, never the tester token.
  step infra-env infra "Send sandbox-scoped credentials to the Codespace (file mode 600)" translated 120 \
    "printf 'export GH_TOKEN=%q\nexport COPILOT_GITHUB_TOKEN=%q\nexport SANDBOX_REPO=%q\n' \"\$SANDBOX_TOKEN\" \"\$COPILOT_GITHUB_TOKEN\" '$SANDBOX_REPO' | gh codespace ssh -c '$CODESPACE' -- 'umask 077; cat > ~/.workshop-tester.env && echo stored'"
  finish_step
  [ "$STEP_CODE" -eq 0 ] || return 1

  harden
}

# Egress guardrail. Always: start a logging proxy in the Codespace and record every host contacted (audit).
# With EGRESS_LOCK=true: the proxy also refuses hosts outside the allowlist and iptables rejects any direct
# outbound connection from the lab user, so traffic that ignores the proxy fails instead of leaving.
# A requested lock that cannot be enforced stops the run before the lab starts.
harden() {
  local lock=${EGRESS_LOCK:-false}
  save_state EGRESS_MODE audit
  step infra-harden infra "Egress guardrail in the Codespace (audit$([ "$lock" = true ] && echo ', lock requested'))" translated 180 \
    "gh codespace ssh -c '$CODESPACE' -- \"bash -lc 'EGRESS_LOCK=$lock bash /workspaces/$SANDBOX_NAME/tests/workshop/afternoon-2/egress.sh start'\""
  if log_has '^EGRESS_AUDIT=on'; then check "Egress audit proxy running" true; else check "Egress audit proxy running" false; fi
  if [ "$lock" = true ]; then
    if log_has '^EGRESS_LOCK=enforced'; then
      check "Egress lock enforced (example.com blocked, api.github.com reachable)" true
      save_state EGRESS_MODE locked
    else
      check "Egress lock enforced (example.com blocked, api.github.com reachable)" false "$(grep -E '^EGRESS_' "$RESULTS_DIR/steps/$STEP_ID.log" | tail -n 5)"
      save_state EGRESS_MODE not-enforceable
      save_state HARDEN_FAILED 1
    fi
    finish_step
  else
    # Audit mode never fails the run.
    finish_step any
  fi
  # shellcheck disable=SC1090
  . "$STATE"
}
run() {
  [ -n "${CODESPACE-}" ] || { echo "no Codespace, skipping the lab run"; return 1; }
  if [ "${HARDEN_FAILED-}" = 1 ]; then
    STEP_ID=infra-lab-start STEP_LEVEL=infra STEP_TITLE="Start run-lab.sh in the Codespace" STEP_MODE=translated STEP_CMD="not started" STEP_DUR=0 STEP_CODE=1
    note "egress lock requested but not enforced; the lab was not started"
    finish_step
    return 1
  fi
  # gh codespace ssh can stay open after the detached runner starts, so the SSH exit code is not the gate:
  # the step passes when the remote shell printed "started" and the runner process is verified alive (or already done).
  step infra-lab-start infra "Start run-lab.sh in the Codespace" translated 90 \
    "gh codespace ssh -c '$CODESPACE' -- \"bash -lc 'set -a; . ~/.workshop-tester.env; set +a; cd /workspaces/$SANDBOX_NAME && setsid -f bash tests/workshop/afternoon-2/run-lab.sh > /tmp/workshop-tester-runner.log 2>&1 < /dev/null; echo started'\""
  local alive="" i
  for i in 1 2 3 4 5 6; do
    alive=$(cs_ssh 'if test -f /tmp/workshop-tester/done; then echo RUNNER_DONE; elif pgrep -f "afternoon-2/[r]un-lab.sh" >/dev/null; then echo RUNNER_ALIVE; fi' 2>/dev/null | grep -Eo 'RUNNER_(ALIVE|DONE)' | head -n1)
    [ -n "$alive" ] && break
    sleep 10
  done
  [ "$STEP_CODE" -eq 0 ] || note "ssh exited with $STEP_CODE after the launch; gate is the runner process check"
  if log_has '^started'; then check "Launch command printed started" true; else check "Launch command printed started" false; fi
  if [ -n "$alive" ]; then check "Runner process verified in the Codespace" true "$alive"; else check "Runner process verified in the Codespace" false; fi
  finish_step any
  [ -n "$alive" ] || return 1

  local start waited=0 failures=0 gone=0 out
  start=$(date +%s)
  while [ "$waited" -lt "$LAB_TIMEOUT_S" ]; do
    sleep 60
    waited=$(( $(date +%s) - start ))
    if out=$(cs_ssh 'if test -f /tmp/workshop-tester/done; then echo LAB_DONE; elif ! pgrep -f "afternoon-2/[r]un-lab.sh" >/dev/null; then echo RUNNER_GONE; fi; tail -n 2 /tmp/workshop-tester-runner.log' 2>&1); then
      failures=0
      echo "[$((waited / 60)) min] $(echo "$out" | tail -n 1)"
      echo "$out" | grep -q LAB_DONE && break
      if echo "$out" | grep -q RUNNER_GONE; then gone=$((gone + 1)); else gone=0; fi
      [ "$gone" -ge 2 ] && break
    else
      failures=$((failures + 1))
      echo "ssh poll failed ($failures): $out"
      [ "$failures" -ge 10 ] && break
    fi
  done
  STEP_ID=infra-lab-wait STEP_LEVEL=infra STEP_TITLE="Lab run finished inside the Codespace" STEP_MODE=translated STEP_CMD="poll /tmp/workshop-tester/done" STEP_DUR=$waited
  if echo "${out-}" | grep -q LAB_DONE; then STEP_CODE=0; else
    STEP_CODE=1
    if [ "$failures" -ge 10 ]; then note "lost SSH access to the Codespace"
    elif [ "$gone" -ge 2 ]; then note "run-lab.sh exited without writing /tmp/workshop-tester/done"
    else note "lab did not finish within ${LAB_TIMEOUT_S}s"; fi
  fi
  finish_step
}

collect() {
  [ -n "${CODESPACE-}" ] || return 0
  mkdir -p "$OUT_DIR/lab"
  step infra-collect infra "Copy lab results from the Codespace" translated 600 \
    "gh codespace ssh -c '$CODESPACE' -- \"bash -lc 'tar -czf - -C /tmp workshop-tester workshop-tester-runner.log 2>/dev/null | base64 -w0'\" > '$OUT_DIR/lab.b64' && base64 -d '$OUT_DIR/lab.b64' | tar -xz -C '$OUT_DIR/lab' && rm -f '$OUT_DIR/lab.b64' && ls -R '$OUT_DIR/lab' | head -n 50"
  finish_step
}

cleanup() {
  # Resources are found by name, not only from saved state, so a cancellation between creating a resource and
  # recording it still cleans up. The Codespace goes first: it is billed while it exists.
  step infra-delete-codespace infra "Delete the Codespace" translated 240 "
    { [ -n '${CODESPACE-}' ] && echo '${CODESPACE-}'
      gh codespace list --json name,repository --jq '.[] | select(.repository == \"$SANDBOX_REPO\") | .name'
    } | sort -u | while read -r cs; do [ -n \"\$cs\" ] && { echo \"delete codespace \$cs\"; gh codespace delete -c \"\$cs\" --force; }; done
    true"
  finish_step
  step infra-delete-sandbox infra "Delete the sandbox repository" translated 60 "
    if gh repo view '$SANDBOX_REPO' --json description --jq .description 2>/dev/null | grep -qF '$SANDBOX_MARKER'; then
      gh repo delete '$SANDBOX_REPO' --yes
    else echo 'no sandbox repository to delete'; fi"
  finish_step
  # A cancelled job has a 5-minute grace period: skip the sweep, the sandbox_cleanup job and the next run cover it.
  if [ "${JOB_STATUS-}" = cancelled ]; then
    echo "run cancelled: skipped the orphan sweep"
  else
    # Sweep sandboxes and Codespaces left by earlier runs that could not clean up (cancelled jobs, runner loss).
    step infra-sweep infra "Delete orphaned sandboxes and Codespaces from earlier runs" translated 600 "
      gh codespace list --json name,repository --jq '.[] | select(.repository | test(\"/workshop-tester-\")) | select(.repository != \"$SANDBOX_REPO\") | .name' |
        while read -r cs; do echo \"delete codespace \$cs\"; gh codespace delete -c \"\$cs\" --force; done
      gh repo list '$SANDBOX_OWNER' --limit 200 --json nameWithOwner,description --jq '.[] | select(.nameWithOwner | test(\"/workshop-tester-\")) | select((.description // \"\") | startswith(\"$SANDBOX_MARKER\")) | select(.nameWithOwner != \"$SANDBOX_REPO\") | .nameWithOwner' |
        while read -r r; do echo \"delete repo \$r\"; gh repo delete \"\$r\" --yes; done
      true"
    finish_step
  fi
  # Last line of defence: no token may leave the runner inside the artifact.
  grep -rlE '(gh[pousr]_|github_pat_)[A-Za-z0-9_]{20,}' "$OUT_DIR" 2>/dev/null | while read -r f; do redact "$f"; done
}

case ${1-} in
  setup) setup ;;
  run) run ;;
  collect) collect ;;
  cleanup) cleanup ;;
  *) echo "usage: $0 setup|run|collect|cleanup" >&2; exit 2 ;;
esac
# Never fail the job: the validation agent reads the recorded results, including infrastructure failures.
exit 0
