#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
FIXTURE_ROOT=$(mktemp -d -t workshop-rpi-flow.XXXXXX)
trap 'rm -rf "$FIXTURE_ROOT"' EXIT
export RESULTS_DIR="$FIXTURE_ROOT/results"
. "$SCRIPT_DIR/lib.sh"
mkdir "$FIXTURE_ROOT/workspace"
cd "$FIXTURE_ROOT/workspace"

equal() {
  if [ "$1" != "$2" ]; then
    printf 'Expected <%s>, got <%s>\n' "$2" "$1" >&2
    exit 1
  fi
}

reject() {
  if "$@" > "$FIXTURE_ROOT/rejected.log" 2>&1; then
    printf 'Expected failure: %s\n' "$*" >&2
    exit 1
  fi
}

mkdir -p .copilot-tracking/research/2026-10-05 .copilot-tracking/plans/2026-10-05 \
  .copilot-tracking/changes/2026-10-05 .copilot-tracking/reviews/logs/2026-10-05
research=.copilot-tracking/research/2026-10-05/playlist-research.md
plan=.copilot-tracking/plans/2026-10-05/playlist-plan.md
changes=.copilot-tracking/changes/2026-10-05/playlist-changes.md
review=.copilot-tracking/reviews/logs/2026-10-05/playlist-review.md
printf 'research\n' > "$research"
printf 'plan\n' > "$plan"
printf 'changes\n' > "$changes"
printf 'review\n' > "$review"
printf 'Artifact: [%s](%s)\n' "$research" "$research" > response.txt
equal "$(resolve_rpi_artifact research response.txt)" "$research"
echo "pass: repeated links resolve to one returned research artifact"

printf 'Backup: %s.bak\n' "$research" > response.txt
reject resolve_rpi_artifact research response.txt
echo "pass: a backup filename cannot be mistaken for the returned artifact"

printf 'Artifact: %s\n' "$plan" > response.txt
equal "$(resolve_rpi_artifact plan response.txt playlist)" "$plan"
reject resolve_rpi_artifact plan response.txt another-task
grep -q 'found 0' "$FIXTURE_ROOT/rejected.log"
echo "pass: Plan must belong to the research task"

printf 'Artifact: %s\n' "$changes" > response.txt
equal "$(resolve_rpi_artifact changes response.txt playlist)" "$changes"
printf 'Artifact: %s\n' "$review" > response.txt
equal "$(resolve_rpi_artifact review response.txt playlist)" "$review"
echo "pass: changes and Review preserve the same task identity"

printf 'No artifact was returned.\n' > response.txt
reject resolve_rpi_artifact research response.txt
printf 'Artifact: .copilot-tracking/research/2026-10-05/missing-research.md\n' > response.txt
reject resolve_rpi_artifact research response.txt
grep -q 'missing or unreadable' "$FIXTURE_ROOT/rejected.log"
echo "pass: unreported and nonexistent artifacts fail"

other=.copilot-tracking/research/2026-10-05/another-task-research.md
printf 'other research\n' > "$other"
printf 'Artifacts: %s and %s\n' "$research" "$other" > response.txt
reject resolve_rpi_artifact research response.txt
grep -q 'found 2; do not choose by recency' "$FIXTURE_ROOT/rejected.log"
echo "pass: ambiguous returned artifacts do not select the newest"

printf 'Plan from <research-path>; implement <plan-path>; review <changes-path>.\n' > prompt.txt
export RPI_RESEARCH_PATH=$research RPI_PLAN_PATH=$plan RPI_CHANGES_PATH=$changes
equal "$(render_workshop_prompt prompt.txt)" "Plan from $research; implement $plan; review $changes."
printf 'Ordinary workshop message.\n' > prompt.txt
equal "$(render_workshop_prompt prompt.txt)" "Ordinary workshop message."
echo "pass: only artifact placeholders are replaced; ordinary messages remain unchanged"

printf 'Plan from <research-path>.\n' > prompt.txt
unset RPI_RESEARCH_PATH
reject render_workshop_prompt prompt.txt
grep -q 'Cannot resolve <research-path>' "$FIXTURE_ROOT/rejected.log"
export RPI_RESEARCH_PATH=.copilot-tracking/research/2026-10-05/missing-research.md
reject render_workshop_prompt prompt.txt
echo "pass: unset and missing bindings fail instead of becoming empty paths"

printf 'replay policy\n' > "$RESULTS_DIR/prompts/replay-policy.txt"
cp prompt.txt "$RESULTS_DIR/prompts/fixture.txt"
step() { echo "Copilot must not be invoked with unresolved artifacts" >&2; exit 99; }
copilot_prompt fixture "Level 3" "Fixture" fixture 30 > "$FIXTURE_ROOT/blocked-invocation.log" 2>&1
equal "$STEP_CODE" 1
[[ "$CURRENT_CHECKS" == *'"pass":false'* ]]
echo "pass: unresolved placeholders block the agent invocation"

curl() {
  printf '%s\0' "$@" > "$FIXTURE_ROOT/curl-args"
  printf '200'
}
equal "$(http_status POST https://example.invalid/api/playlist/tracks '{"trackId":"t1"}')" 200
mapfile -d '' -t args < "$FIXTURE_ROOT/curl-args"
equal "${#args[@]}" 12
equal "${args[6]}" POST
equal "${args[8]}" 'Content-Type: application/json'
equal "${args[10]}" '{"trackId":"t1"}'
equal "${args[11]}" https://example.invalid/api/playlist/tracks
echo "pass: playlist POST sends the JSON request body intact"

equal "$(http_status GET https://example.invalid/api/tracks)" 200
mapfile -d '' -t args < "$FIXTURE_ROOT/curl-args"
equal "${#args[@]}" 8
equal "${args[6]}" GET
equal "${args[7]}" https://example.invalid/api/tracks
echo "pass: GET behavior is unchanged"
