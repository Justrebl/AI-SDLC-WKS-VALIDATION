# Resume the pedagogy rework after merge

**Status:** Proposed execution sequence. No step below is complete merely because
this document exists.

**Prepared:** 2026-10-06.

**Backlog:** [parent #60](https://github.com/Justrebl/AI-SDLC-Workshop/issues/60).

**Baseline PR:** [#59](https://github.com/Justrebl/AI-SDLC-Workshop/pull/59).

## Current marketplace scope (2026-10-06)

The maintainer superseded this plan's demo-only marketplace boundary: Level 4
now includes a template-shipped remote catalog with HVE-Core, Java Development,
Java Modernization Studio and WorkIQ, CLI/VS Code registration and HVE installation,
construction/versioning, and an explicit existing-HVE/APM transition. Only HVE is
a required install; the app setup remains a tutor demo. Level 4 has a 45-minute
estimate, not measured delivery timing. The historical checklist below describes
the earlier increment; its demo-only statements are not current implementation
instructions. Preserve the Linux/Bash-only lab convention in future handoffs.

## Goal and boundary

Make Levels 4-6 explain one delivery story:

> A method available on my machine becomes a governed repository dependency;
> committed planning and delivery evidence guide delegation; independent review
> and a human decision establish what is accepted.

Keep the existing Music Catalog scope and hands-on APM exercise. Marketplace and
accessibility remain proctor-only demonstrations. Keep the useful deny/restore
experiment, human gates, and observable **Success Criteria**. Do not add application
features or turn every command into a comprehension questionnaire.

This is the focused next increment, not a promise to finish all fourteen child
issues in one day. Capacity, assignments, and a milestone have not been set.

The checklist below guides editing and validating the workshop content. Learner
PRs, cloud sessions, reviews, and merges are behaviors the revised guide must
require, not operations the authoring agent may perform during a content-only
change. The maintainer's baseline PR #59 is distinct from those learner PRs.

## Before merging the baseline

This resume document and later terminology, pedagogy, and reviewer-tool edits were
not included in PR #59's remote head when this plan was prepared. Review the
pending changes and deliberately decide which belong in the baseline before
merging. Adding this document to the reviewed commit is what makes it available
from a fresh clone after merge; an uncommitted file does not travel with the PR.

Keep the reviewer GitHub-tool/publisher changes identified as an automation
workstream. They do not satisfy documentation-only pedagogy issue criteria.
Nothing in this plan authorizes a commit, push, issue closure, or merge.

## Execution order

### 1. Verify the merged baseline before changing anything

- [ ] Confirm PR #59 reached `main`, and inspect its actual merge commit and files.
- [ ] Stop if your working tree has edits that have not been accounted for. Do not
  discard, stash, or overwrite them as a shortcut.
- [ ] Open this document, the [learning-flow decisions](levels-4-6-learning-flow.md),
  and the current issue bodies. Use headings, not the old review line numbers.
- [ ] Check whether each planned change is already present; record actual evidence
  rather than replaying completed work.
- [ ] Start the follow-up from the reviewed `main` baseline on a new branch when
  you are ready to implement. Do not continue editing protected `main`.

**Checkpoint:** the source revision, pending local work, and next incomplete step
are known. Refresh open/closed issue and PR state; do not reuse this document as a
live tracker snapshot.

### 2. Clear the two concrete review defects

- [ ] Make the Level 6 PowerShell example pass the literal reviewer argument:
  `--add-reviewer '@copilot'`, not variable splatting.
- [ ] Add a PowerShell-aware argument regression; a successful Bash replay does
  not verify the published PowerShell command.
- [ ] Correct the architect recap: attendees saw a marketplace demonstration;
  they did not register a new repository marketplace in this exercise.

**Checkpoint:** the CLI example is copyable, and the recap matches actual practice.
These findings overlap [#70](https://github.com/Justrebl/AI-SDLC-Workshop/issues/70)
but do not complete that broader consistency issue.

### 3. Rework Level 4 around an explicit mental model

Related work: [#61](https://github.com/Justrebl/AI-SDLC-Workshop/issues/61) and
[#67](https://github.com/Justrebl/AI-SDLC-Workshop/issues/67).

- [ ] Add the short, visible primer: what is missing from a personal installation,
  what the repository will gain, and what will be handed to the cloud task.
- [ ] Keep the essential model visible: `apm.yml` declares dependencies;
  `apm.lock.yaml` records resolution; deployed profiles/skills are what Copilot
  reads; policy controls permitted sources/surfaces; audit checks consistency;
  a required GitHub check governs merging.
- [ ] Explain why the lockfile still matters when the manifest already pins a SHA.
  Do not promise identical agent behavior merely from identical package content.
- [ ] Introduce each action by its consequence and limit. Installation equips the
  repository; it does not run RPI or change the playlist. The target selects the
  harness format, not an AI model.
- [ ] Relate the actual HVE-Core pin and deployed RPI/Backlog Manager profiles to
  that model. Disable the personal plugin only after the repository copy is
  verified; preserve the managed-settings and VS Code caveats.
- [ ] Make the deny/restore exercise interpretable: installed files can exist
  while the policy refuses them. Restore the passing policy before publishing.
- [ ] After each copied file, direct attention to a real rule or evidence-based
  choice. Keep solution files unchanged; do not add an abstract recall quiz.
- [ ] Distinguish marketplace discovery, shared organization agents, APM trust,
  and runtime permissions. Keep advanced rollout/format details optional, not
  the essential explanation itself.

**Checkpoint:** a reader with toggles closed sees how the artefacts fit together,
then performs the existing actions and inspects concrete evidence.

### 4. Separate Level 5 verification from backlog/delegation

Related work: [#64](https://github.com/Justrebl/AI-SDLC-Workshop/issues/64) and
[#65](https://github.com/Justrebl/AI-SDLC-Workshop/issues/65).

**Working design:** keep the existing Level 5 page/index, with two clearly named
stages, each with a primer and handoff. This avoids adding a new top-level workshop
page just to make the separation readable.

**Confirmed governance choice: option A for #65.** The learner's Level 3
implementation must reach `main` through a reviewed PR, using the existing
prepared PR description. There is no direct-push exception for that feature.
Apply the supporting Level 3 publication changes before the Level 4 handoff:

- [ ] The revised guide directs the learner to a feature branch for the Level 3
  implementation and publication of its PR.
- [ ] It requires real test/review evidence before a human merges the feature.
- [ ] Its Level 4 handoff starts from the resulting reviewed default-branch baseline.
- [ ] Preserve the distinction between using a PR and having enforced CI checks:
  do not claim `test` or `apm-audit` were required before they were installed.
- [ ] Update the tester's branch/publication replay and explicitly record any
  human review or merge step it cannot execute.

After strict checks are active, later setup and delivery use PRs as well.

- [ ] Stage 5a establishes the verification contract: test CI, working cloud setup,
  APM audit, and the relevant required checks. Explain which guarantee each adds.
- [ ] Publish the initial CI/setup files before activating the strict audit rule.
  Once the no-bypass rule is active, publish the Stage 5b workflow/planning setup
  through a reviewed PR, not another direct `main` push.
- [ ] Make that later setup PR part of the learner path; do not silently soften
  the ruleset or add an administrator bypass.
- [ ] Stage 5b follows one issue from committed planning through backlog evidence
  to human-selected RPI delegation.
- [ ] Explain the two jobs: the agent reads and proposes operations; the separate
  safe-output job applies only configured, bounded mutations. Reading issue text
  does not authorize new writes.
- [ ] Explain the two lock artefacts: APM's lockfile records context dependencies;
  gh-aw's generated `.lock.yml` is an Actions workflow.
- [ ] Preserve the `backlog-managed` opt-in, operation caps, real fix/PR links,
  missing-evidence reporting, and the rule that an open PR is not completion.
- [ ] Keep Project status honest: people set intermediate states; configured
  closed-item automation reflects verified issue closure. Comments alone do not
  update Project fields.

**Checkpoint:** checks exist before delegation, setup still works under protection,
and the learner can follow the same issue's evidence rather than a new command tour.

### 5. Make Level 6 an acceptance exercise

Related coverage: the Level 4-6 slice of
[#61](https://github.com/Justrebl/AI-SDLC-Workshop/issues/61).

- [ ] Keep a compact, visible explanation of RPI self-review, independent Copilot
  PR review, `test`, `apm-audit`, acceptance criteria, and the human decision.
- [ ] Explicitly request or verify a posted Copilot review on the delegated PR;
  a coding session's self-review or pending request is not that evidence.
- [ ] Compare review/check evidence with the current PR revision and actual issue
  criteria. Green checks do not settle a behavior that was never tested.
- [ ] Address valid feedback, request another review after substantive changes,
  and leave human workflow approval and merge gates intact.
- [ ] Keep the accessibility example separate and proctor-only, even if presented
  as a while-the-agent-runs callout. Do not add participant Playwright setup.
- [ ] Explain the demo's GitHub/cloud-agent versus gh-aw tool configuration and
  coverage limits; never turn missing runtime checks into conformance claims.
- [ ] After an accepted merge, inspect fixing PR/commit links, remaining issue
  criteria, and configured Project transitions. Partial delivery stays open.

**Checkpoint:** each acceptance claim has the right evidence and owner; no automated
review or status colour substitutes for the human decision.

### 6. Integrate and validate the increment

- [ ] Reconcile `README.md`, the attendee guide/frontmatter, `docs/tutor.md`,
  screenshots/references, and the actual exercise order.
- [ ] Keep timing only in the tutor guide and maintain the existing two-afternoon
  application scope.
- [ ] Update coupled workshop checks and replay when steps or prompts change;
  preserve command-plus-task blocks and curated example ordering.
- [ ] Adjust disclosure tests so essential models can be visible. A ban on every
  introductory table, or a sentence-length test, is not a pedagogy assessment.
- [ ] Run prompt extraction and targeted guide/APM/replay checks. Keep API/UI tests
  separate unless application behavior actually changes.
- [ ] Record how the automated replay handles a human setup-PR merge it cannot
  perform. Any controlled sandbox translation must be labelled honestly; it must
  not claim live rule enforcement or human approval.
- [ ] Review the rendered closed-toggle path. Record unavailable hosted rendering,
  full compilation, or live reconciliation evidence rather than claiming success.
- [ ] Obtain review of the increment before authorizing its commit/push/merge.

**Checkpoint:** the content, supporting checks, and exercise evidence agree. This is
not permission to run paid automation or change GitHub settings automatically.

## Issue completion and next batches

Do not close [#61](https://github.com/Justrebl/AI-SDLC-Workshop/issues/61) after
changing only Levels 4-6: it also covers Levels 1-3 and the opening three-act story.
Likewise, check all named copied-file exercises before closing
[#67](https://github.com/Justrebl/AI-SDLC-Workshop/issues/67).
The parent stays open until all child criteria are satisfied.

Recommended subsequent order, not a current capacity commitment:

| Batch | Issues | Dependency or boundary |
| --- | --- | --- |
| DT and RPI foundations | [#62](https://github.com/Justrebl/AI-SDLC-Workshop/issues/62), then [#63](https://github.com/Justrebl/AI-SDLC-Workshop/issues/63) | Settle the DT contribution before changing the RPI handoff/context exercise |
| Level 1 and setup | [#68](https://github.com/Justrebl/AI-SDLC-Workshop/issues/68), [#69](https://github.com/Justrebl/AI-SDLC-Workshop/issues/69) | Can fill remaining #61 coverage; setup is a quick-win option |
| Role judgement and consistency | [#66](https://github.com/Justrebl/AI-SDLC-Workshop/issues/66), [#71](https://github.com/Justrebl/AI-SDLC-Workshop/issues/71), [#70](https://github.com/Justrebl/AI-SDLC-Workshop/issues/70) | Preserve native agent procedures and real learner choices |
| Afternoon 1 | [#72](https://github.com/Justrebl/AI-SDLC-Workshop/issues/72), [#73](https://github.com/Justrebl/AI-SDLC-Workshop/issues/73), [#74](https://github.com/Justrebl/AI-SDLC-Workshop/issues/74) | Separate guide lane; coordinate shared README/tutor changes |

Use one integration owner for the Afternoon 2 guide. The child issues are separately
assignable, but simultaneous edits to the same guide are not independent work.

## Resume in a fresh session

Open this committed document and the linked issue bodies first. Private working
notes are not needed to recover the direction. Ask RPI to build or reconcile its
local task plan from the merged files and current issue state, then start only the
first incomplete, dependency-ready step you explicitly authorize.

For each step, retain the source revision, decisions, changed files, checks, and
remaining acceptance criteria. Refresh evidence before recommending issue closure;
do not infer completion from this roadmap or a checkbox alone.
