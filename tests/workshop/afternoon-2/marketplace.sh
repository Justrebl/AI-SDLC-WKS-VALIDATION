#!/usr/bin/env bash
# Source-aware personal HVE transition for the disposable sandbox only.

hve_state() {
  local mode=${1:-initial} inventory
  inventory=$(copilot plugin list --json) || return
  printf '%s' "$inventory" | node -e '
let text = "";
process.stdin.on("data", chunk => text += chunk);
process.stdin.on("end", () => {
  try {
    const rows = JSON.parse(text);
    if (!Array.isArray(rows) || rows.some(row => !row || typeof row.name !== "string")) {
      throw new Error("Expected a flat plugin array with named entries");
    }
    const hve = rows.filter(row => row.name === "hve-core");
    if (hve.length > 1) throw new Error("Duplicate HVE sources; stop before mutation");
    const row = hve[0];
    let state = "absent";
    if (row) {
      if (row.managed === true) throw new Error("Managed HVE requires administrator help");
      if (row.marketplace === "hve-core") state = "upstream";
      else if (row.marketplace === "contoso-plugin-marketplace") state = "curated";
      else throw new Error("Unknown HVE source; stop before mutation");
      if (state === "curated" && (row.version !== "3.2.2" || typeof row.enabled !== "boolean")) {
        throw new Error("Curated HVE must report version 3.2.2 and boolean activation");
      }
    }
    const mode = process.argv[1];
    if (mode === "absent" && state !== "absent") throw new Error("HVE remains after uninstall");
    if (mode === "enabled" && (state !== "curated" || row.enabled !== true)) {
      throw new Error("Expected one enabled curated HVE 3.2.2 entry");
    }
    if (mode === "disabled" && (state !== "curated" || row.enabled !== false)) {
      throw new Error("Expected one disabled curated HVE 3.2.2 entry");
    }
    if (mode === "initial" && state === "curated" && row.enabled !== true) {
      throw new Error("Existing curated HVE is disabled; resolve with tutor");
    }
    console.log(state);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
});
' "$mode"
}

curated_hve_install() {
  local repo=$1 state
  [[ "$repo" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || {
    printf 'Invalid sandbox owner/repo\n' >&2
    return 1
  }
  # The sandbox is disposable; this is not consent to replace a learner install.
  copilot plugin marketplace add "$repo" || return
  copilot plugin marketplace browse contoso-plugin-marketplace || return
  state=$(hve_state) || return
  if [ "$state" = upstream ]; then
    copilot plugin uninstall hve-core@hve-core || return
    hve_state absent || return
    state=absent
  fi
  if [ "$state" = absent ]; then
    copilot plugin install hve-core@contoso-plugin-marketplace || return
  fi
  hve_state enabled
}

curated_hve_disable() {
  test -f .github/agents/rpi-agent.agent.md || return
  test -f .github/agents/backlog-manager.agent.md || return
  hve_state enabled || return
  copilot plugin disable hve-core@contoso-plugin-marketplace || return
  hve_state disabled
}
