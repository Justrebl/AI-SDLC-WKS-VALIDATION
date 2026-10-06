#!/usr/bin/env bash
# Replays the AI SDLC with GitHub and GitHub Copilot prerequisites and Levels 1-6 (docs/afternoon-2/workshop.md) inside a Codespace
# opened on a throwaway sandbox repository. Every step is recorded in $RESULTS_DIR/results.jsonl.
#
# Required environment:
#   SANDBOX_REPO          owner/name of the sandbox repository (the Codespace's own repository)
#   GH_TOKEN              sandbox-scoped token for gh (sandbox issues, workflow runs, Copilot cloud agent assignment)
#   COPILOT_GITHUB_TOKEN  token for Copilot CLI (fine-grained PAT with the Copilot Requests permission)
# Optional:
#   RESULTS_DIR           default /tmp/workshop-tester
#   WORKFLOW_WAIT_S       max wait for each gh-aw run (default 1800)
#   CODING_AGENT_WAIT_S   max wait for the Copilot cloud agent task and PR (default 3600)
#   CODE_REVIEW_WAIT_S    max wait for the Copilot code review on that PR (default 900)
set -u

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_DIR=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)
export RESULTS_DIR=${RESULTS_DIR:-/tmp/workshop-tester}
WORKFLOW_WAIT_S=${WORKFLOW_WAIT_S:-1800}
CODING_AGENT_WAIT_S=${CODING_AGENT_WAIT_S:-3600}
CODE_REVIEW_WAIT_S=${CODE_REVIEW_WAIT_S:-900}
export CI=true DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1 NPM_CONFIG_UPDATE_NOTIFIER=false GH_PROMPT_DISABLED=1
# shellcheck source=lib.sh
. "$SCRIPT_DIR/lib.sh"

finish() {
  local failed
  failed=$(grep -c '"status":"fail"' "$RESULTS_FILE" || true)
  printf '{"sandbox":"%s","finished_at":"%s","steps":%s,"failed":%s}\n' \
    "$SANDBOX_REPO" "$(date -u +%FT%TZ)" "$(wc -l < "$RESULTS_FILE")" "${failed:-0}" > "$RESULTS_DIR/summary.json"
  pkill -f 'dotnet run' 2>/dev/null; pkill -f 'vite' 2>/dev/null
  touch "$RESULTS_DIR/done"
}
trap finish EXIT

# push_fallback <step-id>: retry a rejected sandbox push with the tester token.
push_fallback() {
  if [ "$STEP_CODE" -ne 0 ]; then
    note "git push with the Codespace credential failed; retrying with the tester token to continue the sandbox replay"
    if git -c credential.helper= -c credential.helper='!gh auth git-credential' push >> "$RESULTS_DIR/steps/$1.log" 2>&1; then
      check "push succeeded with the tester token (fallback)" true
      STEP_CODE=0
    else
      check "push succeeded with the tester token (fallback)" false
    fi
  fi
}

cd "$REPO_DIR" || exit 1
: "${SANDBOX_REPO:?SANDBOX_REPO is required}"
git config user.name >/dev/null || git config user.name "Workshop Tester"
git config user.email >/dev/null || git config user.email "workshop-tester@users.noreply.github.com"

# ---------------------------------------------------------------- Preflight
step pre-tools preflight "Workshop tools available in the Codespace" literal 60 \
  'for t in git dotnet node npm gh copilot apm curl; do printf "%s: " "$t"; command -v "$t" || exit 1; done; dotnet --version; node --version; gh --version | head -n1; copilot --version; apm --version'
finish_step

step pre-prompts preflight "Extract copy-paste prompts from workshop.md" translated 30 \
  "node '$SCRIPT_DIR/extract-prompts.mjs' docs/afternoon-2/workshop.md '$RESULTS_DIR/prompts'"
finish_step
[ "$STEP_CODE" -eq 0 ] || exit 1

# ---------------------------------------------------------------- Starter readiness (prerequisite)
step pre-starter-layout preflight "Starter readiness: hello-only app and synthetic tracks" translated 30 \
  'for p in src/front src/api tests/api MusicCatalog.slnx .github/copilot-instructions.md .github/workflows/copilot-setup-steps.yml .github/ISSUE_TEMPLATE/feature.yml solutions/afternoon-2; do [ -e "$p" ] && echo "ok $p" || { echo "missing $p"; exit 1; }; done'
grep -q '/api/hello' src/api/Program.cs && ! grep -q '/api/tracks' src/api/Program.cs \
  && check "Program.cs exposes GET /api/hello only" true || check "Program.cs exposes GET /api/hello only" false "$(grep -n 'Map' src/api/Program.cs)"
grep -q '/api/hello' src/front/src/App.tsx && ! grep -q '/api/tracks' src/front/src/App.tsx \
  && check "App.tsx fetches /api/hello only" true || check "App.tsx fetches /api/hello only" false
n=$(node -e 'console.log(JSON.parse(require("fs").readFileSync("src/api/Data/tracks.json","utf8")).length)' 2>/dev/null)
[ "$n" = 12 ] && check "tracks.json contains 12 tracks" true || check "tracks.json contains 12 tracks" false "count=$n"
finish_step

step pre-dotnet-test preflight "Starter readiness: xUnit passes" literal 900 'dotnet test'
finish_step

step pre-npm-test preflight "Starter readiness: Vitest passes" literal 600 'npm --prefix src/front test'
finish_step

step pre-clean-tree preflight "Sandbox translation: readiness inspection" translated 60 'git status'
tree_clean_check
finish_step

# ---------------------------------------------------------------- Level 1
step l1-marketplace-add "Level 1" "Register the HVE-Core marketplace" literal 300 \
  'copilot plugin marketplace add microsoft/hve-core'
if [ "$STEP_CODE" -ne 0 ] && log_has 'already'; then note "marketplace already registered (allowed)"; STEP_CODE=0; fi
finish_step

step l1-plugin-install "Level 1" "Install HVE-Core" literal 600 'copilot plugin install hve-core@hve-core'
if [ "$STEP_CODE" -ne 0 ] && log_has 'already'; then note "plugin already installed (allowed)"; STEP_CODE=0; fi
finish_step

step l1-plugin-browse "Level 1" "Browse plugin commands (/plugin)" emulated 120 'copilot plugin list'
note "interactive /plugin replaced by 'copilot plugin list'"
log_has 'hve-core' && check "hve-core plugin listed" true || check "hve-core plugin listed" false
finish_step

skip_step l1-vscode "Level 1" "VS Code alternative (ise-hve-essentials.hve-core)" "VS Code UI fallback, not executable headless"

step l1-git-status "Level 1" "Sandbox translation: clean-tree inspection" translated 30 'git status'
tree_clean_check
finish_step

# ---------------------------------------------------------------- Level 2
copilot_prompt l2-dt-start "Level 2" "Start the curated DT example (/hve-core:dt-start-project.prompt)" dt-start 900 "--agent hve-core:dt-coach"
finish_step
dt_replay_ok=$STEP_CODE
for number in $(seq -w 1 9); do
  number=$(printf '%02d' "$((10#$number))")
  if [ "$dt_replay_ok" -eq 0 ]; then
    copilot_prompt "l2-dt-example-$number" "Level 2" "Replay curated DT method $number contribution" "dt-example-$number" 900 "--continue --agent hve-core:dt-coach"
    finish_step
    dt_replay_ok=$STEP_CODE
  else
    skip_step "l2-dt-example-$number" "Level 2" "Replay curated DT method $number contribution" "earlier curated DT turn failed; do not fabricate missing conversation"
  fi
done

skip_step l2-method-next "Level 2" "DT Method Next: inspect native sequencing advice" \
  "requires a human choice from actual coaching state; sampler contributions do not establish method completion"

copilot_prompt l2-dt-summary "Level 2" "Map exploration to the shared delivery contract" dt-summary 900 "--continue --agent hve-core:dt-coach"
note "curated example replay, not authentic learner research, peer feedback, or full method completion; report missing evidence honestly"
log_has 'playlist' && check "summary mentions the playlist capability" true || check "summary mentions the playlist capability" false
log_has '409|conflict|reject|duplicate' && check "summary states duplicate add is rejected" true || check "summary states duplicate add is rejected" false
log_has 'empty' && check "summary mentions the empty state" true || check "summary mentions the empty state" false
finish_step

step l2-dt-notes "Level 2" "Explore the local coaching notes" translated 30 \
  'find .copilot-tracking/dt/music-catalog-listening-experience -type f -size +0c -print; git status --short'
[ -s .copilot-tracking/dt/music-catalog-listening-experience/coaching-state.md ] \
  && check "curated DT replay produced coaching state" true || check "curated DT replay produced coaching state" false
tree_clean_check
note "file existence checked headlessly; human inspection and authentic research remain unverified"
finish_step

skip_step l2-dt-later-choice "Level 2" "Choose a later slice with DT Coach" \
  "requires an authentic learner decision; no choice, approval or completed DT method is fabricated"
skip_step l2-dt-later-record "Level 2" "Curate the confirmed later-slice decision" \
  "requires the learner's confirmed choice; sandbox uses the documented Remove a track fallback, not a claimed DT outcome"

copilot_prompt l2-dt-record "Level 2" "Documentation: curate the shared delivery brief" dt-record 900 "--continue --agent hve-core:documentation"
rec=docs/project-planning/playlist-design-decisions.md
[ -s "$rec" ] && check "decision record written" true || check "decision record written" false "missing $rec"
[ -s "$rec" ] && ! grep -q '\.copilot-tracking' "$rec" && check "record has no tracking paths" true || check "record has no tracking paths" false
note "sandbox fixture from the published contract; no human review or completed DT methods inferred"
finish_step

copilot_prompt l2-brd-start "Level 2" "Start the BRD from the supplied workshop facts" brd-start 900 "--agent hve-core:brd-builder"
finish_step
brd_replay_ok=$STEP_CODE
for number in $(seq 2 11); do
  number=$(printf '%02d' "$number")
  if [ "$brd_replay_ok" -eq 0 ]; then
    copilot_prompt "l2-brd-example-$number" "Level 2" "Replay curated BRD contribution $number" "brd-example-$number" 900 "--continue --agent hve-core:brd-builder"
    finish_step
    brd_replay_ok=$STEP_CODE
  else
    skip_step "l2-brd-example-$number" "Level 2" "Replay curated BRD contribution $number" "earlier BRD turn failed; do not invent missing answers"
  fi
done
step l2-brd-file "Level 2" "Check the saved BRD result" translated 30 \
  'test -s docs/project-planning/music-catalog-playlist-slice-brd.md'
note "saved draft checked; quality findings and human sign-off must not be inferred from file existence"
finish_step
skip_step l2-brd-signoff "Level 2" "BRD example steps 12-13: approval and handoff evidence" \
  "human review, explicit approval and possible waivers are not authorized by an unattended example replay"

step l2-curate-ignored "Level 2" "Curate: check that the tracking folder is ignored" translated 30 'git check-ignore -v .copilot-tracking/probe'
git check-ignore -q .copilot-tracking/probe && check ".copilot-tracking/ is ignored" true || check ".copilot-tracking/ is ignored" false
finish_step

skip_step l2-hve-commit "Level 2" "HVE commit prompt: path selection and staged-set confirmation" \
  "human commit decisions are not replayed; the following sandbox checkpoint is a translation, not prompt execution or reviewed approval"
step l2-curate-commit "Level 2" "Sandbox translation: checkpoint planning drafts" translated 60 \
  'git add docs/project-planning && git status && git commit -m "Add playlist slice design record, BRD and PRD"'
[ -z "$(git ls-files .copilot-tracking)" ] && check "no tracking file committed" true || check "no tracking file committed" false "$(git ls-files .copilot-tracking | head -n 10)"
finish_step

step l2-git-status "Level 2" "Sandbox translation: commit checkpoint inspection" translated 30 'git status; git log --oneline -1'
tree_clean_check
finish_step

skip_step l2-pm-track "Level 2" "Extended track: Product Manager (BRD, PRD, Functional Planner, Backlog Manager)" \
  "BRD draft example replayed separately; PRD and backlog execution wait for human BRD sign-off; Meeting Analyst needs Microsoft 365 and WorkIQ"

# ---------------------------------------------------------------- Level 3
copilot_prompt l3-research "Level 3" "RPI research command and task" rpi-research 1800 "--agent hve-core:rpi-agent"
if RPI_RESEARCH_PATH=$(resolve_rpi_artifact research "$RESULTS_DIR/steps/$STEP_ID.log"); then
  RPI_TASK_SLUG=$(basename "$RPI_RESEARCH_PATH" -research.md)
  export RPI_RESEARCH_PATH
  check "returned research artifact exists" true "$RPI_RESEARCH_PATH"
else
  check "returned research artifact exists" false "missing, ambiguous, or unreadable artifact"
fi
tree_clean_check
finish_step
[ "$STEP_CODE" -eq 0 ] && [ -n "$RPI_RESEARCH_PATH" ] || exit 1

copilot_prompt l3-plan "Level 3" "RPI plan command and task" rpi-plan 1800 "--continue --agent hve-core:rpi-agent"
if RPI_PLAN_PATH=$(resolve_rpi_artifact plan "$RESULTS_DIR/steps/$STEP_ID.log" "$RPI_TASK_SLUG"); then
  export RPI_PLAN_PATH
  check "plan belongs to the research task" true "$RPI_PLAN_PATH"
  grep -qi 'dotnet test' "$RPI_PLAN_PATH" && check "plan includes API validation" true || check "plan includes API validation" false
  grep -qi 'npm.*test' "$RPI_PLAN_PATH" && check "plan includes front-end validation" true || check "plan includes front-end validation" false
else
  check "plan belongs to the research task" false "missing, ambiguous, or unreadable artifact"
fi
tree_clean_check
finish_step
[ "$STEP_CODE" -eq 0 ] && [ -n "$RPI_PLAN_PATH" ] || exit 1

step l3-feature-branch "Level 3" "Create the feature branch before implementation" translated 30 \
  'git switch -c feature/playlist-slice && [ "$(git branch --show-current)" = "feature/playlist-slice" ]'
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

implementation_base=$(git rev-parse HEAD) || exit 1
copilot_prompt l3-implement "Level 3" "RPI implement command and task" rpi-implement 3600 "--continue --agent hve-core:rpi-agent"
if RPI_CHANGES_PATH=$(resolve_rpi_artifact changes "$RESULTS_DIR/steps/$STEP_ID.log" "$RPI_TASK_SLUG"); then
  export RPI_CHANGES_PATH
  check "changes record belongs to the approved plan" true "$RPI_CHANGES_PATH"
else
  check "changes record belongs to the approved plan" false "missing, ambiguous, or unreadable artifact"
fi
if implementation_changes=$(implementation_changes_since "$implementation_base"); then
  [ -n "$implementation_changes" ] && check "agent edited implementation files" true "$(printf '%s\n' "$implementation_changes" | head -n 20)" \
    || check "agent edited implementation files" false "no implementation change since $implementation_base"
else
  check "agent edited implementation files" false "could not compare implementation with $implementation_base"
fi
grep -rqs 'Your playlist is empty. Add a track to get started.' src/front/src \
  && check "exact empty-state text present in src/front/src" true || check "exact empty-state text present in src/front/src" false
finish_step
[ "$STEP_CODE" -eq 0 ] && [ -n "$RPI_CHANGES_PATH" ] || exit 1

step l3-dotnet-test "Level 3" "Validate API tests" literal 900 'dotnet test'
log_has 'Passed!|passed' && check "dotnet test reports passing tests" true || check "dotnet test reports passing tests" false
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

step l3-npm-test "Level 3" "Validate front-end tests" translated 600 'cd src/front && npm test'
grep -rqsE 'getByRole|findByRole|getAllByRole|findAllByRole|getByLabelText' src/front/src \
  && check "Testing Library queries use roles or labels" true || check "Testing Library queries use roles or labels" false
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

# Run the app: the API on 5080 and the Vite dev server on 5173 (proxying /api).
(cd src/api && nohup dotnet run > "$RESULTS_DIR/steps/l3-api-server.log" 2>&1 &)
(cd src/front && nohup npm run dev -- --host 127.0.0.1 > "$RESULTS_DIR/steps/l3-front-server.log" 2>&1 &)
step l3-run-app "Level 3" "Run the app and exercise the playlist API" translated 300 \
  'for u in http://localhost:5080/api/hello http://127.0.0.1:5173/; do for i in $(seq 1 90); do curl -fsS -o /dev/null "$u" && break; sleep 2; done; curl -fsS -o /dev/null "$u" && echo "up $u" || { echo "down $u"; exit 1; }; done'
if [ "$STEP_CODE" -eq 0 ]; then
  s=$(http_status GET http://localhost:5080/api/tracks)
  c=$(node -e 'try{console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).length)}catch{console.log(-1)}' "$RESULTS_DIR/http-last.json")
  [ "$s" = 200 ] && [ "$c" = 12 ] && check "GET /api/tracks returns 12 tracks" true || check "GET /api/tracks returns 12 tracks" false "status=$s count=$c"
  payload=$(node -e 'const tracks=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));process.stdout.write(JSON.stringify({trackId:tracks[0].id}));' "$RESULTS_DIR/http-last.json")
  unknown_payload=$(node -e 'const tracks=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));process.stdout.write(JSON.stringify({trackId:Math.max(...tracks.map(track=>track.id))+1}));' "$RESULTS_DIR/http-last.json")
  s=$(http_status GET http://localhost:5080/api/playlist)
  [ "$s" = 200 ] && check "GET /api/playlist returns 200" true "$(head -c 300 "$RESULTS_DIR/http-last.json")" || check "GET /api/playlist returns 200" false "status=$s"
  s=$(http_status POST http://localhost:5080/api/playlist/tracks "$unknown_payload")
  [ "$s" = 404 ] && check "POST unknown track returns 404" true "$(head -c 300 "$RESULTS_DIR/http-last.json")" || check "POST unknown track returns 404" false "status=$s"
  s=$(http_status POST http://localhost:5080/api/playlist/tracks "$payload")
  case $s in 2??) check "POST existing track succeeds" true "status=$s";; *) check "POST existing track succeeds" false "status=$s";; esac
  s=$(http_status POST http://localhost:5080/api/playlist/tracks "$payload")
  [ "$s" = 409 ] && check "POST duplicate returns 409" true "$(head -c 300 "$RESULTS_DIR/http-last.json")" || check "POST duplicate returns 409" false "status=$s"
  s=$(http_status GET http://127.0.0.1:5173/api/tracks)
  [ "$s" = 200 ] && check "Vite dev server proxies /api" true || check "Vite dev server proxies /api" false "status=$s"
fi
note "browser checks (rendered list, empty state, duplicate message) are covered by Vitest and by the source checks above"
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1
pkill -f 'dotnet run' 2>/dev/null; pkill -f 'vite' 2>/dev/null

skip_step l3-hve-commit "Level 3" "HVE implementation commit prompt" \
  "human path selection/staged-set confirmation skipped; deterministic sandbox checkpoint preserves clean-tree and already-committed cases"
export -f commit_checkpoint
step l3-implement-commit "Level 3" "Sandbox translation: implementation checkpoint" translated 60 \
  'commit_checkpoint "Implement playlist slice with RPI"'
tree_clean_check
[ -z "$(git ls-files .copilot-tracking)" ] && check "no tracking file committed" true \
  || check "no tracking file committed" false "$(git ls-files .copilot-tracking | head -n 10)"
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

review_base=$(git rev-parse HEAD) || exit 1
copilot_prompt l3-review "Level 3" "RPI review command and task" rpi-review 2400 "--continue --agent hve-core:rpi-agent"
if review_path=$(resolve_rpi_artifact review "$RESULTS_DIR/steps/$STEP_ID.log" "$RPI_TASK_SLUG"); then
  check "review belongs to the implemented task" true "$review_path"
else
  check "review belongs to the implemented task" false "missing, ambiguous, or unreadable artifact"
fi
log_has 'Conformant|Defects found|Residual work|Not accepted' \
  && check "review reports an acceptance outcome" true || check "review reports an acceptance outcome" false
tree_clean_check
[ "$(git rev-parse HEAD)" = "$review_base" ] \
  && check "review does not create source commits" true || check "review does not create source commits" false
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

step l3-review-dotnet "Level 3" "Validate after review: dotnet test" literal 900 'dotnet test'
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1
step l3-review-npm "Level 3" "Validate after review: npm test" translated 600 'cd src/front && npm test'
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

skip_step l3-pull-request "Level 3" "HVE PR prompt: confirm push and creation" \
  "native publication approval is not replayed; sandbox push/PR steps below are translations, not prompt execution or learner consent"
step l3-pr-push "Level 3" "Publish the feature branch to the sandbox repository" translated 300 \
  'git push -u origin feature/playlist-slice'
push_fallback l3-pr-push
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

step l3-pr-create "Level 3" "Create and verify the sandbox pull request" translated 300 \
  'gh pr create --repo "$SANDBOX_REPO" --base main --head feature/playlist-slice --title "Implement playlist slice" --body "Sandbox replay description: local API and front-end tests and RPI review ran before this pull request. The unattended replay cannot perform human review or claim human acceptance." && gh pr view feature/playlist-slice --repo "$SANDBOX_REPO" --json number,state,baseRefName,headRefName --jq "if .state == \"OPEN\" and .baseRefName == \"main\" and .headRefName == \"feature/playlist-slice\" then \"open sandbox PR \" + (.number|tostring) + \" verified\" else error(\"PR base, head, or state does not match\") end"'
if PR_NUMBER=$(grep -Eo 'open sandbox PR [0-9]+ verified' "$RESULTS_DIR/steps/l3-pr-create.log" | tail -n 1 | grep -Eo '[0-9]+'); then
  export PR_NUMBER
  check "sandbox pull request number resolved" true "$PR_NUMBER"
else
  check "sandbox pull request number resolved" false "could not verify the published PR"
  STEP_CODE=1
fi
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

skip_step l3-human-review-merge "Level 3" "Human review and merge of the feature pull request" \
  "unattended sandbox replay cannot provide a human decision or claim human acceptance"

step l3-sandbox-merge-translation "Level 3" "Merge the sandbox PR as a replay-only translation" translated 300 \
  'gh pr merge "$PR_NUMBER" --repo "$SANDBOX_REPO" --merge --delete-branch && git switch main && git pull --ff-only origin main && [ "$(gh pr view "$PR_NUMBER" --repo "$SANDBOX_REPO" --json state --jq .state)" = "MERGED" ]'
note "sandbox-only continuation; automatic merge is not human review, human acceptance, or evidence of live ruleset enforcement"
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

skip_step l3-tech-lead "Level 3" "Optional Tech Lead activities (ADR Creator and Code Review agent)" \
  "optional human-gated agents that pause for scope and perspective confirmation"

# ---------------------------------------------------------------- Level 4
step l4-marketplace-install "Level 4" "Register sandbox catalog, inspect source, and install curated HVE" emulated 900 \
  ". '$SCRIPT_DIR/marketplace.sh' && curated_hve_install '$SANDBOX_REPO'"
note "qualified replacement is authorized only in the disposable sandbox; learner consent is not emulated"
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1
skip_step l4-marketplace-agents "Level 4" "Confirm DT Coach and RPI in a fresh CLI picker" \
  "inventory/version verified; live interactive agent-picker capability remains unverified"
skip_step l4-marketplace-vscode "Level 4" "Register and verify catalog in VS Code" \
  "VS Code UI and shared host/remote filesystem discovery are not exercised headlessly"
skip_step l4-marketplace-app "Level 4" "Tutor app registration demo" \
  "tutor-only app UI; no participant or tenant operations"

step l4-copy-apm "Level 4" "Copy the solution manifest" literal 30 'cp solutions/afternoon-2/apm.yml ./apm.yml && cat apm.yml'
grep -q 'microsoft/hve-core#1dbd6a7ea90b74accaf8c809262e38952bd4c359' apm.yml \
  && check "apm.yml pins HVE-Core by SHA" true || check "apm.yml pins HVE-Core by SHA" false
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

step l4-apm-install "Level 4" "Install the APM dependency" literal 1200 'apm install --target copilot'
[ -f apm.lock.yaml ] && check "apm.lock.yaml created" true || check "apm.lock.yaml created" false
grep -q 'resolved_commit' apm.lock.yaml 2>/dev/null && check "lockfile records resolved_commit" true "$(grep -m3 'resolved_commit' apm.lock.yaml)" \
  || check "lockfile records resolved_commit" false
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

step l4-plugin-disable "Level 4" "Disable personal HVE-Core after verifying repository agents" emulated 300 \
  ". '$SCRIPT_DIR/marketplace.sh' && curated_hve_disable"
note "repository profile presence is checked before disabling; fresh interactive agent-picker verification is not emulated"
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

step l4-copy-policy "Level 4" "Copy the policy" literal 30 'cp solutions/afternoon-2/apm-policy.yml ./apm-policy.yml'
grep -q 'self_defined: deny' apm-policy.yml && check "policy denies self-defined MCP" true || check "policy denies self-defined MCP" false
grep -q '^targets:' apm-policy.yml && check "no top-level targets key" false || check "no top-level targets key" true
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

step l4-policy-status "Level 4" "Confirm APM parses the policy" literal 300 'apm policy status --policy-source apm-policy.yml'
log_has 'found' && check "Outcome: found" true || check "Outcome: found" false
log_has 'block' && check "Enforcement: block" true || check "Enforcement: block" false
log_has 'warnings?[^a-z]*none' && check "Warnings: none" true || check "Warnings: none" false
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

step l4-policy-audit "Level 4" "Audit with policy" literal 1200 'apm audit --ci --policy apm-policy.yml'
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

step l4-deny-edit "Level 4" "Temporarily deny microsoft/hve-core in the policy" translated 30 \
  'cp apm-policy.yml "$RESULTS_DIR/policy-before-deny.yml" && awk '"'"'/^  require_pinned_constraint:/{print "  deny:\n    - \"microsoft/hve-core\""} {print}'"'"' apm-policy.yml > apm-policy.tmp && mv apm-policy.tmp apm-policy.yml && cat apm-policy.yml'
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

step l4-deny-audit "Level 4" "Policy audit fails with exit code 1" literal 1200 'apm audit --ci --policy apm-policy.yml'
finish_step 1
[ "$STEP_FAILED" -eq 0 ] || exit 1

step l4-restore-policy "Level 4" "Remove the temporary deny entry and audit the original policy" translated 1200 \
  'cp "$RESULTS_DIR/policy-before-deny.yml" apm-policy.yml && apm audit --ci --policy apm-policy.yml'
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

step l4-copy-apm-ci "Level 4" "Copy the PR audit workflow" literal 30 \
  'mkdir -p .github/workflows && cp solutions/afternoon-2/.github/workflows/apm-audit.yml .github/workflows/apm-audit.yml'
grep -q 'microsoft/apm-action@v1' .github/workflows/apm-audit.yml \
  && check "PR audit uses the APM action" true || check "PR audit uses the APM action" false
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

skip_step l4-hve-commit "Level 4" "HVE governed setup commit prompt" \
  "native prompt availability and human path/staged-set confirmations unverified; following sandbox commit is a translation"
step l4-commit "Level 4" "Sandbox translation: commit and push governed setup" translated 300 \
  'git status; git add apm.yml apm.lock.yaml apm-policy.yml .github .agents && git diff --cached --stat && git commit -m "Add governed repository agents and APM audit" && git push'
git ls-files --error-unmatch .github/workflows/daily-backlog.lock.yml >/dev/null 2>&1 \
  && check "no workflow lock files committed in Level 4" false || check "no workflow lock files committed in Level 4" true
gh api "repos/$SANDBOX_REPO/contents/.github/agents/rpi-agent.agent.md" --jq .path >/dev/null 2>&1 \
  && check "RPI Agent is on the default branch" true || check "RPI Agent is on the default branch" false
untracked=$(git status --porcelain | head -n 30)
[ -n "$untracked" ] && note "left uncommitted after Level 4: $(echo "$untracked" | tr '\n' ' ')"
finish_step
[ "$STEP_FAILED" -eq 0 ] || exit 1

# ---------------------------------------------------------------- Level 5a
skip_step l5-ci-hve-commit "Level 5a" "HVE CI workflow commit prompt" \
  "human commit selection/confirmation skipped; following sandbox checkpoint is a translation"
step l5-ci "Level 5a" "Make the tests the contract: add CI and push" translated 300 \
  'mkdir -p .github/workflows && cp solutions/afternoon-2/.github/workflows/ci.yml .github/workflows/ci.yml && git add .github/workflows/ci.yml && git commit -m "Add CI for API and front-end tests" && git push'
push_fallback l5-ci
grep -qE '^  test:' .github/workflows/ci.yml && check "ci.yml defines the test job" true || check "ci.yml defines the test job" false
since=$(date -u -d '-5 minutes' +%FT%TZ) ci_run="" ci_concl=""
for _ in $(seq 1 30); do
  ci_run=$(gh run list -R "$SANDBOX_REPO" --workflow ci.yml --branch main --limit 5 \
    --json databaseId,createdAt --jq "[.[] | select(.createdAt >= \"$since\")][0].databaseId // empty" 2>/dev/null)
  [ -n "$ci_run" ] && break; sleep 10
done
if [ -n "$ci_run" ]; then
  gh run watch "$ci_run" -R "$SANDBOX_REPO" --exit-status > "$RESULTS_DIR/steps/l5-ci.run.log" 2>&1
  ci_concl=$(gh run view "$ci_run" -R "$SANDBOX_REPO" --json conclusion --jq .conclusion 2>/dev/null)
fi
[ "$ci_concl" = success ] && check "CI run on main passed" true "run $ci_run" || check "CI run on main passed" false "run=${ci_run:-none} conclusion=${ci_concl:-none}"
finish_step

node -e 'const r=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));process.exit(r.rules.some(x=>x.type==="required_status_checks"&&x.parameters.required_status_checks.some(c=>c.context==="test"))?0:1)' \
  solutions/afternoon-2/rulesets/main-tests-required.json \
  && note "the solution ruleset requires the test check" || note "the solution ruleset does not require the test check"
skip_step l5-ruleset "Level 5a" "Create the branch ruleset that requires the test check" \
  "needs the Administration permission, which the sandbox-scoped tester token does not have; the solution JSON is checked statically"

skip_step l5-setup-hve-commit "Level 5a" "HVE Copilot setup commit prompt" \
  "human commit selection/confirmation skipped; following sandbox checkpoint is a translation"
step l5-setup-steps "Level 5a" "Add the API build to copilot-setup-steps.yml and push" translated 300 \
  "awk '{print} /^[[:space:]]+run: npm ci[[:space:]]*\$/ && !done {print \"\"; print \"      - name: Build the API\"; print \"        run: dotnet build MusicCatalog.slnx --no-restore\"; done=1}' .github/workflows/copilot-setup-steps.yml > /tmp/setup-steps.yml && mv /tmp/setup-steps.yml .github/workflows/copilot-setup-steps.yml && git add .github/workflows/copilot-setup-steps.yml && git commit -m 'Build the API in Copilot setup steps' && git push"
push_fallback l5-setup-steps
grep -q 'dotnet build MusicCatalog.slnx --no-restore' .github/workflows/copilot-setup-steps.yml \
  && check "setup steps build the API" true || check "setup steps build the API" false
note "manual YAML edit replaced by an awk insertion after the npm ci step"
finish_step

step l5-apm-ci "Level 5a" "Wait for the audit on the latest main commit" translated 600 "
  expected_sha=\$(git rev-parse HEAD)
  apm_run=''
  for _ in \$(seq 1 30); do
    apm_run=\$(gh run list -R '$SANDBOX_REPO' --workflow apm-audit.yml --branch main --limit 5 \
      --json databaseId,headSha --jq \"[.[] | select(.headSha == \\\"\$expected_sha\\\")][0].databaseId // empty\")
    [ -n \"\$apm_run\" ] && break
    sleep 10
  done
  [ -n \"\$apm_run\" ] || { echo 'No APM Audit run found for the latest main commit'; exit 1; }
  gh run watch \"\$apm_run\" -R '$SANDBOX_REPO' --exit-status
"
finish_step

step l5-apm-gate-config "Level 5a" "Verify the strict APM required-check rule" translated 30 \
  'node -e '"'"'const fs=require("fs");const r=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const ok=r.target==="branch"&&r.enforcement==="active"&&r.bypass_actors.length===0&&r.conditions.ref_name.include.includes("~DEFAULT_BRANCH")&&r.rules.some(x=>x.type==="required_status_checks"&&x.parameters.required_status_checks.some(c=>c.context==="apm-audit"));process.exit(ok?0:1)'"'"' solutions/afternoon-2/rulesets/main-apm-audit-required.json'
finish_step
skip_step l5-apm-ruleset "Level 5a" "Require the apm-audit check before delegation" \
  "needs Administration permission; the strict solution JSON is checked, but live merge enforcement is not simulated"

# ---------------------------------------------------------------- Level 5b
skip_step l5b-setup-pr "Level 5b" "Publish the backlog workflow and planning brief in a reviewed PR" \
  "cannot verify the active no-bypass APM rule: Administration permission is unavailable, so the setup PR and dependent delegation are skipped rather than bypassing the gate"
skip_step l5b-human-review "Level 5b" "Human review and merge of the setup PR" \
  "no Stage 5b setup PR was created; the unattended replay cannot provide human approval"
skip_step l5b-sandbox-merge-translation "Level 5b" "Merge the setup PR as a replay-only translation" \
  "no Stage 5b setup PR was created because active no-bypass enforcement could not be verified"
skip_step l5-ghaw-install "Level 5b" "Install the gh-aw extension" \
  "Stage 5b cannot begin until the strict APM audit rule is active"
skip_step l5-ghaw-init "Level 5b" "Initialize the repository (gh aw init)" \
  "Stage 5b setup is gated on verified no-bypass APM enforcement"
skip_step l5-copy-workflows "Level 5b" "Copy the bounded backlog workflow" \
  "Stage 5b setup PR is skipped because live no-bypass APM enforcement is unavailable"
skip_step l5-compile "Level 5b" "Compile workflows (gh aw compile)" \
  "the workflow was not copied because the Stage 5b setup PR gate is unavailable"
skip_step l5-review-diff "Level 5b" "Review generated files without editing" \
  "the Stage 5b setup files were not created"
skip_step l5-commit "Level 5b" "HVE prompt: commit workflow sources and locks" \
  "the Stage 5b setup files were not created"
skip_step l5-push "Level 5b" "Push the Stage 5b feature branch" \
  "the Stage 5b setup files were not created"
skip_step l5-planning-follow-up "Level 5b" "Publish the remove-from-playlist follow-up brief" \
  "the planning brief remains uncommitted because the Stage 5b reviewed-PR gate is unavailable"
skip_step l5-create-issue "Level 5b" "File a follow-up feature request from the feature form" \
  "no committed Stage 5b planning handoff; no issue is created"
skip_step l5-managed-issue "Level 5b" "Link committed plans and opt the issue into reconciliation" \
  "no feature issue was created"
skip_step l5-seed-issues "Level 5b" "Turn deferred review findings into issues" \
  "requires a genuine residual finding and a human decision to defer it; do not create synthetic review findings"
ISSUE_NUMBER=""

skip_step l5-run-daily-backlog "Level 5b" "Run daily backlog (gh aw run daily-backlog)" \
  "the bounded workflow was not merged through the gated setup PR"

skip_step l5-prereqs "Level 5b" "Confirm default-branch prerequisites" \
  "the Stage 5b setup PR was not merged"
skip_step l5-assign "Level 5b" "Assign the issue to Copilot cloud agent" \
  "no feature issue was created because the setup PR gate is unavailable"

skip_step l5-project-progress "Level 5b" "Follow task progress on a shared Project" \
  "needs a selected Project and human field/automation configuration; issue comments are not Project field updates"
skip_step l5-accessibility-demo "Level 5b" "Browser-supported accessibility review demonstration" \
  "proctor-only private repository example; no attendee audit or MCP configuration"

step l5-git-status "Level 5b" "Sandbox translation: commit checkpoint inspection" translated 30 'git status'
tree_clean_check
finish_step

skip_step l5-security-delegation "Level 5b" "Extended track: delegate a security review to Copilot cloud agent" \
  "extended track: a second Copilot PR would collide with the Level 6 PR detection; the gh-aw variant needs a GH_AW_AGENT_TOKEN PAT"

# ---------------------------------------------------------------- Level 6
if [ -n "${ISSUE_NUMBER:-}" ]; then
  # Wait for Copilot to open a PR that references the issue, then for the task to finish.
  step l6-pr "Level 6" "Copilot cloud agent opens a PR that references the issue" emulated 60 'true'
  PR="" waited=0
  while [ "$waited" -lt "$CODING_AGENT_WAIT_S" ]; do
    # The sandbox is new, so any Copilot-authored PR is the one for this issue; avoids search-index lag.
    PR=$(gh pr list -R "$SANDBOX_REPO" --state all --limit 20 --json number,author \
      --jq '[.[] | select(.author.login | test("copilot"; "i"))][0].number // empty' 2>/dev/null)
    [ -n "$PR" ] && break; sleep 60; waited=$((waited + 60))
  done
  if [ -z "$PR" ]; then
    check "Copilot opened a PR" false "no PR after ${CODING_AGENT_WAIT_S}s"
  else
    check "Copilot opened a PR" true "PR #$PR"
    while [ "$waited" -lt "$CODING_AGENT_WAIT_S" ]; do
      title=$(gh pr view "$PR" -R "$SANDBOX_REPO" --json title --jq .title 2>/dev/null)
      case $title in \[WIP\]*) sleep 60; waited=$((waited + 60));; *) break;; esac
    done
    gh pr view "$PR" -R "$SANDBOX_REPO" --json number,title,body,isDraft,files,headRefName,url > "$RESULTS_DIR/coding-agent-pr.json" 2>&1
    gh pr checks "$PR" -R "$SANDBOX_REPO" > "$RESULTS_DIR/coding-agent-pr-checks.txt" 2>&1
    grep -q "#$ISSUE_NUMBER" "$RESULTS_DIR/coding-agent-pr.json" && check "PR references the issue" true || check "PR references the issue" false
    case $title in \[WIP\]*) check "Copilot cloud agent finished within the wait budget" false "still WIP after ${CODING_AGENT_WAIT_S}s";; *) check "Copilot cloud agent finished within the wait budget" true;; esac
    if grep -qE '"path":"(apm|\.copilot-tracking|README)' "$RESULTS_DIR/coding-agent-pr.json"; then note "PR touches files outside src/ and tests/; the validator should review scope"; fi
  fi
  STEP_DUR=$waited
  finish_step

  skip_step l6-approve-checks "Level 6" "Approve and run workflows on the Copilot PR, then wait for the test check" \
    "settings-UI approval by a human; the PR checks are saved to coding-agent-pr-checks.txt"
  if [ -z "$PR" ]; then
    skip_step l6-code-review "Level 6" "Request a Copilot code review on the PR" "no Copilot PR to review"
  else
    step l6-code-review "Level 6" "Request a Copilot code review on the PR" translated 60 \
      "gh pr edit $PR -R $SANDBOX_REPO --add-reviewer '@copilot'"
    note "PR-NUMBER replaced by the Copilot PR; -R targets the sandbox"
    REVIEW_CODE=$STEP_CODE waited=0 reviews=0
    if [ "$REVIEW_CODE" -ne 0 ] && log_has "requires one of the following scopes: \['read:org'\]"; then
      note "tester credential limitation: Codespace sandbox token needs organization-read authorization (GitHub reported read:org) to request a Copilot review; this step remains failed"
    fi
    if [ "$REVIEW_CODE" -eq 0 ]; then
      while [ "$waited" -lt "$CODE_REVIEW_WAIT_S" ]; do
        reviews=$(gh pr view "$PR" -R "$SANDBOX_REPO" --json reviews \
          --jq '[.reviews[] | select(.author.login | test("copilot-pull-request-reviewer|^copilot$"; "i"))] | length' 2>/dev/null)
        [ "${reviews:-0}" -gt 0 ] && break; sleep 30; waited=$((waited + 30))
      done
      gh pr view "$PR" -R "$SANDBOX_REPO" --json reviews > "$RESULTS_DIR/code-review.json" 2>&1
    fi
    [ "$REVIEW_CODE" -eq 0 ] && check "Copilot added as a reviewer" true || check "Copilot added as a reviewer" false
    [ "${reviews:-0}" -gt 0 ] && check "Copilot posted a review" true || check "Copilot posted a review" false "no review after ${waited}s"
    STEP_DUR=$waited
    finish_step
  fi
else
  skip_step l6-pr "Level 6" "Copilot cloud agent opens a PR that references the issue" \
    "Stage 5b did not create or assign an issue because its no-bypass APM gate is unavailable"
  skip_step l6-approve-checks "Level 6" "Approve and run workflows on the Copilot PR, then wait for the test check" \
    "no Copilot PR exists because Stage 5b delegation was skipped"
  skip_step l6-code-review "Level 6" "Request a Copilot code review on the PR" \
    "no Copilot PR exists because Stage 5b delegation was skipped"
fi

skip_step l6-accept-and-reconcile "Level 6" "Accept delivery and verify issue/Project closure evidence" \
  "requires a human merge decision; automated tester does not merge or claim acceptance"

skip_step l6-push-protection "Recap" "Facilitator demo: secret scanning push protection" \
  "facilitator demo: needs GitHub Secret Protection on a licensed proctor repository and settings-UI steps (custom pattern, dry run)"

step l6-git-status "Level 6" "Sandbox translation: local change inspection" translated 30 'git status'
tree_clean_check
finish_step
