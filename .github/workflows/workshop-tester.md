---
description: "Workshop tester: replays the entire Afternoon 2 lab in a throwaway sandbox repository and Codespace, then reports failures as an issue."

on:
  push:
    branches: [main]
    paths:
      - "docs/afternoon-2/**"
      - "solutions/afternoon-2/**"
      - "src/**"
      - "tests/**"
      - "MusicCatalog.slnx"
      - ".devcontainer.json"
      - ".devcontainer/**"
      - ".github/**"
  workflow_dispatch:

# Opt-in: forks, attendee copies and sandbox repositories do not set this variable, so they never run the tester.
if: vars.WORKSHOP_TESTER_ENABLED == 'true'

concurrency:
  group: workshop-tester
  cancel-in-progress: false

permissions:
  contents: read
  issues: read
  actions: read
  copilot-requests: write   # Copilot inference for the validation agent, no PAT required

engine:
  id: copilot
  model: gpt-5.5
timeout-minutes: 20

jobs:
  # Deterministic job: holds the tester secrets, runs the lab in a Codespace and always cleans up.
  # It runs outside the agent sandbox and never fails, so the validation agent always receives results.
  lab_run:
    needs: [activation]
    runs-on: ubuntu-latest
    timeout-minutes: 360
    permissions:
      contents: read
    env:
      GH_TOKEN: ${{ secrets.WORKSHOP_TESTER_TOKEN }}
      COPILOT_GITHUB_TOKEN: ${{ secrets.WORKSHOP_TESTER_COPILOT_TOKEN }}
      # Scoped token forwarded into the Codespace instead of the broad infrastructure token.
      SANDBOX_TOKEN: ${{ secrets.WORKSHOP_TESTER_SANDBOX_TOKEN }}
      # Set to 'true' to block unlisted egress from the Codespace; the default only audits it.
      EGRESS_LOCK: ${{ vars.WORKSHOP_TESTER_EGRESS_LOCK }}
      SANDBOX_OWNER: ${{ vars.WORKSHOP_TESTER_OWNER || github.repository_owner }}
      SANDBOX_NAME: workshop-tester-${{ github.run_id }}-${{ github.run_attempt }}
      CODESPACE_MACHINE: ${{ vars.WORKSHOP_TESTER_MACHINE || 'standardLinux32gb' }}
      SOURCE_REPO: ${{ github.repository }}
      SOURCE_SHA: ${{ github.sha }}
      RUN_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
    steps:
      # The runner context is not available in job-level env, so OUT_DIR is set here.
      - name: Set results directory
        run: echo "OUT_DIR=${RUNNER_TEMP}/lab-run" >> "$GITHUB_ENV"
      - uses: actions/checkout@v5
        with:
          persist-credentials: false
      - name: Create sandbox repository and Codespace
        run: bash tests/workshop/afternoon-2/orchestrate.sh setup
      - name: Run the Afternoon 2 lab in the Codespace
        run: bash tests/workshop/afternoon-2/orchestrate.sh run
      - name: Collect lab results
        # Skipped on cancel: the 5-minute cancellation grace period is reserved for cleanup.
        if: ${{ !cancelled() }}
        run: bash tests/workshop/afternoon-2/orchestrate.sh collect
      - name: Delete Codespace and sandbox repository
        if: always()
        timeout-minutes: 15
        env:
          JOB_STATUS: ${{ job.status }}
        run: bash tests/workshop/afternoon-2/orchestrate.sh cleanup
      - name: Upload lab results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: workshop-tester-results
          path: ${{ runner.temp }}/lab-run
          retention-days: 14
          if-no-files-found: warn

  # Backstop: runs even when the run is cancelled or lab_run is force-terminated after the cancellation grace period,
  # and deletes this run's Codespace and sandbox repository if they still exist. Runner loss is covered by the
  # orphan sweep of the next run.
  sandbox_cleanup:
    needs: [lab_run]
    if: always()
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions: {}
    env:
      GH_TOKEN: ${{ secrets.WORKSHOP_TESTER_TOKEN }}
      GH_PROMPT_DISABLED: "1"
      SANDBOX_REPO: ${{ vars.WORKSHOP_TESTER_OWNER || github.repository_owner }}/workshop-tester-${{ github.run_id }}-${{ github.run_attempt }}
    steps:
      - name: Delete leftover Codespace and sandbox repository of this run
        run: |
          [ -n "$GH_TOKEN" ] || { echo "WORKSHOP_TESTER_TOKEN secret is missing"; exit 0; }
          gh codespace list --json name,repository --jq ".[] | select(.repository == \"$SANDBOX_REPO\") | .name" |
            while read -r cs; do echo "delete codespace $cs"; gh codespace delete -c "$cs" --force || true; done
          if gh repo view "$SANDBOX_REPO" --json description --jq .description 2>/dev/null | grep -qF "Ephemeral workshop tester sandbox"; then
            echo "delete repo $SANDBOX_REPO"; gh repo delete "$SANDBOX_REPO" --yes || true
          else
            echo "no leftover sandbox repository"
          fi

  agent:
    needs: [lab_run]

  report:
    needs: [lab_run, agent, safe_outputs, sandbox_cleanup]
    if: ${{ always() && vars.WORKSHOP_TESTER_ENABLED == 'true' }}
    runs-on: ubuntu-latest
    timeout-minutes: 5
    permissions:
      contents: read
      actions: read
    env:
      LAB_RESULT: ${{ needs.lab_run.result }}
      AGENT_RESULT: ${{ needs.agent.result }}
      SAFE_OUTPUTS_RESULT: ${{ needs.safe_outputs.result }}
      CLEANUP_RESULT: ${{ needs.sandbox_cleanup.result }}
      RUN_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
    steps:
      - uses: actions/checkout@v5
        with:
          persist-credentials: false
      - name: Download lab results if available
        uses: actions/download-artifact@v4
        continue-on-error: true
        with:
          name: workshop-tester-results
          path: ${{ runner.temp }}/lab-run
      - name: Publish workshop report
        if: always()
        run: |
          if [ -f tests/workshop/afternoon-2/report.mjs ]; then
            node tests/workshop/afternoon-2/report.mjs "${RUNNER_TEMP}/lab-run" >> "$GITHUB_STEP_SUMMARY" || {
              echo "## Workshop report unavailable" >> "$GITHUB_STEP_SUMMARY"
              echo "The report renderer failed. Inspect the run logs and uploaded artifact." >> "$GITHUB_STEP_SUMMARY"
              exit 1
            }
          else
            echo "## Workshop report unavailable" >> "$GITHUB_STEP_SUMMARY"
            echo "The source checkout did not complete. Inspect the run logs and uploaded artifact." >> "$GITHUB_STEP_SUMMARY"
            exit 1
          fi

steps:
  - name: Download lab results
    uses: actions/download-artifact@v4
    with:
      name: workshop-tester-results
      path: /tmp/gh-aw/agent/lab-run

# Firewall for the validation agent only; the Codespace is guarded by tests/workshop/afternoon-2/egress.sh.
network:
  allowed: [defaults, github]

tools:
  github: false
  bash: ["cat", "ls", "find", "grep", "head", "tail", "wc", "jq", "sed -n"]

safe-outputs:
  create-issue:
    title-prefix: "[Workshop tester] "
    labels: [workshop-tester, automation]
    max: 1
    close-older-issues: true
  noop:
    report-as-issue: false   # a clean run is visible on the Actions run summary; no "no-op" issue
  threat-detection:
    engine:
      id: copilot
      model: gpt-5.5
---

# Workshop tester: Afternoon 2 validation report

You are running unattended in GitHub Actions for `${{ github.repository }}` after a change reached `main`. The tested commit is in `meta.json`.
Do not ask questions. Do not modify files. Your only possible outputs are one issue or a `noop`.
Follow `docs/afternoon-2/workshop.md` literally: use only its guided steps, success criteria and links it explicitly provides, together with the supplied tester results and logs. Do not browse or search the internet, consult unrelated documentation, invent missing instructions, or infer how to accomplish an undocumented step. If the guide or captured evidence does not establish an outcome, report the evidence gap in the notes rather than guessing a defect category; never turn an assumption into a pass.

Treat the published **Toggle solution / Toggle example** blocks as the canonical example path for tester conversations. Compare the extracted `prompts/curated-solutions.txt` and individual DT/BRD example messages with the session transcripts. The tester must use these supplied answers in order, not improvise a different persona, feature, stakeholder, success measure, or approval. Report deviations as tester limitations or replay defects, not as evidence that the published example failed. The DT example samples methods without completing their evidence gates. BRD example approval and handoff steps depend on human review and are intentionally skipped; never infer approval, waived findings, or full PM-track completion from a saved draft.

A previous deterministic job already did this:

1. Created a throwaway private sandbox repository from a snapshot of this commit.
2. Opened a GitHub Codespace on it, using `.devcontainer.json` pinned to the prebuilt image built from `.github/devcontainer-image/` at the tested commit.
3. Ran `tests/workshop/afternoon-2/run-lab.sh` in that Codespace. The script replays every level of `docs/afternoon-2/workshop.md`: the commands, the copy-paste prompts (through Copilot CLI `-p`), the real `gh aw run` calls and the Coding Agent assignment.
4. Deleted the Codespace and the sandbox repository.

## Inputs

All inputs are under `/tmp/gh-aw/agent/lab-run/`:

- `meta.json`: source commit, run URL, sandbox name and Codespace machine type.
- `infra/results.jsonl`: setup and cleanup steps (`infra-*`) plus preflight findings.
- `lab/workshop-tester/results.jsonl`: one JSON object per lab step. Fields are `id`, `level`, `title`, `mode`, `command`, `exit_code`, `duration_s`, `status`, `checks[]`, `notes`, `log`, and `log_tail`.
  - `mode` is one of `literal`, `translated`, `emulated` or `skipped`. `literal` means the lab command as written. `translated` means a PowerShell command run as bash. `emulated` means a UI or interactive step replayed non-interactively.
  - `status` is one of `pass`, `fail`, `warn` or `skip`.
- `lab/workshop-tester/steps/<id>.log`: full output of each step. `*.run.log` holds the gh-aw workflow run logs.
- `lab/workshop-tester/sessions/*.md`: the Copilot CLI session transcripts.
- `lab/workshop-tester/prompts/`: extracted published messages, curated solution reference, and replay policy.
- `lab/workshop-tester/usage/*.json`: Copilot CLI usage statistics for each prompt step.
- `lab/workshop-tester/daily-backlog-issue.json`, `coding-agent-pr.json` and `coding-agent-pr-checks.txt`, when they were produced.
- `lab/workshop-tester/egress/`: Codespace network evidence. `mode` is `audit`, `locked` or `lock-failed`. `hosts.txt` has one tab-separated line per distinct destination: time, method, `host:port`, `listed` or `unlisted`, and `forwarded` or `refused`. `allowlist.txt` is the effective allowlist.

If `lab/` is missing, the lab never ran. Report the infrastructure failure from `infra/results.jsonl`.

## Validation

1. Read `docs/afternoon-2/workshop.md` and list every step and its **Success Criteria** bullets, level by level.
2. Match each documented step to a result `id`, using its `level` and `title`.
   - List any documented step that has no result. That is coverage drift between the lab and `tests/workshop/afternoon-2/run-lab.sh`.
   - List any executed step that no longer exists in the lab.
3. For each step, judge the outcome against the documented success criteria, using the `checks`, `exit_code` and logs. Do not substitute an alternative command or result not supplied in the guide.
   - Copilot output is non-deterministic. Judge only the documented acceptance behavior, not exact wording or outside product knowledge.
4. Classify every problem as exactly one of:
   - **Lab defect**: the document is wrong, incomplete or out of order, so a participant following it literally would fail or be confused. Examples: a missing push before a step that needs the remote, files the lab never commits, a missing title, a repository that is not a template.
   - **Solution or code defect**: files under `solutions/afternoon-2/`, `src/`, `tests/`, `.devcontainer.json` or `.github/devcontainer-image/` do not behave as the lab says.
   - **Product or environment change**: a tool, CLI flag, plugin, model, policy or GitHub feature behaved differently than documented. Quote the exact error.
   - **Tester limitation**: the failure comes only from emulation, for example `/plugin` replayed as `copilot plugin list` or prompts sent through `copilot -p`, and a participant would not hit it.
   - **Infrastructure failure**: tokens, sandbox creation, Codespace, SSH or timeouts.
5. Egress: read `egress/mode` and `egress/hosts.txt`. Every `unlisted` destination is a finding: classify it as a **Product or environment change** when a tool started calling a new host, or as a **Lab defect** when the lab itself sends participants there. In `locked` mode, a `refused` line that matches a failed step explains that failure. If the folder is missing, report "egress evidence missing" as an infrastructure failure.
6. Copilot CLI usage: summarize each prompt step from `usage/*.json`, using the units those files report. Do not convert them into premium requests, credits or money.

## Output

- If all executed checks passed, documented skips are accounted for, and you found no lab defect, solution defect, product change, unlisted egress or coverage drift, call `noop`. Include a one-line summary with the number of steps and the total duration.
- Otherwise create **one** issue with this structure:
  - Title: a short summary of the most important failure.
  - `## Summary`: the overall verdict, source commit, link to the run (from `meta.json`), and steps passed, failed, warned and skipped.
  - `## Results by level`: a table with Level | Steps | Pass | Fail | Warn | Skip | Notes.
  - `## Problems`: one subsection per problem. Give the classification, the step `id` and the documented success criteria. Add evidence of 15 lines at most from the log, and the smallest suggested fix: the exact doc text to change, or the file to fix.
  - `## Coverage drift`: list it, or write "none".
  - `## Egress`: the mode, the number of distinct destinations, and a table of `unlisted` or `refused` hosts with method and outcome. Write "no unlisted egress" when there is none, or "egress evidence missing".
  - `## Copilot CLI usage`: a table by prompt step, in the reported units.
  - `## Notes`: tester limitations and assumptions.
- Never include tokens, secrets or full environment dumps. Quote only short log excerpts.
- The `report` job publishes the captured step counts and completion state on the Actions run summary even if you fail or stop early. Your issue/noop provides the guided analysis; do not assume the existence of an issue means the run succeeded.
