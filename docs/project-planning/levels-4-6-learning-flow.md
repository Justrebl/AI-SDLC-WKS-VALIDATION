# Levels 4-6: agreed learning-flow decisions

**Decision date:** 2026-10-06  
**Status:** Applied to the guide and solution workflow; live delivery validation remains separate.

The next focused increment and post-merge recovery sequence are in
[the pedagogy resume plan](pedagogy-resume-plan.md). This decision record describes
the established scope; the resume plan does not mark that follow-up complete.

This document records the agreed redesign of the
[Afternoon 2 workshop](../afternoon-2/workshop.md) and the implementation
clarifications below. Local guide, solution, and tester changes do not publish
workflows, configure repository settings, or execute GitHub operations.

## Workshop-wide command convention

**Decision date:** 2026-10-06.

**Status:** Confirmed by the maintainer; Level 4 examples and Linux access
prerequisites converted. Conversion of remaining existing lab examples is pending.

Both participant labs show Linux commands only, using Bash shell syntax and
Linux-style paths. Do not include PowerShell or Windows Command Prompt variants
in the lab guides. Use one copyable command path rather than parallel
platform-specific examples.

The participant prerequisites must identify the Linux/Bash environment used for
the lab, including how Windows attendees access that environment. This decision
does not itself remove a delivery option or change host-specific setup
instructions outside the participant labs.

Workshop Creator owns this authoring constraint and passes it to subsequent
handoffs. The next RPI plan must account for existing command examples,
prerequisites, and replay checks; recording this decision does not mean those
surfaces have been converted.

## Audience, timebox, and teaching approach

The audience includes TPMs, developers, architects, GitHub Platform Owners, and
Operators. Participants know custom agents; plugin familiarity is mixed, and APM
is new. The revised Level 4 includes a simple curated marketplace registration
and HVE installation exercise, without authoring a local plugin.

The ten-minute constraint applied to the DT coaching session, not each lab level.
Level 4 now has a forty-five-minute estimate, preserving APM and adding marketplace
practice; live delivery timing remains unverified. No fixed duration has been agreed
for Levels 5 and 6.

Use one continuous story:

> Make the team's AI delivery method portable and governable; keep the backlog
> aligned with delivery; delegate useful work; independently review the result.

Introduce every required command with its purpose, what it changes, and the
observable result. Keep required actions, permission warnings, and human approval
gates visible. Put optional theory and extended reference material in collapsed
sections. Do not present long command lists without explaining their role.

## Level 4: trusted practices that travel with the repository

### Outcome

Participants practice in the Music Catalog repository they used in Levels 1-3.
They add repository agents with APM, inspect the installed content, audit it
against the lockfile and policy, and commit and push the setup so the agents are
available on the default branch for Levels 5-6.

### Revised forty-five-minute flow (estimate)

| Time | Segment | Action and evidence |
| --- | --- | --- |
| 0-3 minutes | Establish the challenge | Explain why a personal Copilot setup does not automatically travel to a teammate or a fresh cloud-agent environment. |
| 3-6 minutes | Inspect the curated catalog | Four remote entries ship in the template copy; no local plugin authoring. |
| 6-18 minutes | Register and install | Register attendee owner/repo in CLI and VS Code; inspect existing personal HVE, consent to qualified replacement, verify curated 3.2.2 and agents. |
| 18-21 minutes | Versioning and app demo | Compare metadata versus source SHA; tutor demonstrates app registration. |
| 21-29 minutes | Install with APM | Inspect unchanged APM pin, lockfile and deployed agent content. |
| 29-32 minutes | Switch to repository agents | Disable exact curated personal CLI plugin and handle separate VS Code copy. |
| 32-37 minutes | Apply policy and audit | Preserve allowlist and deny-and-restore practice. |
| 37-42 minutes | Publish and verify | Add audit workflow, review staged content, commit and push. |
| 42-45 minutes | Confirm the handoff | Verify default-branch agents and passing audit for cloud use. |

The catalog contains HVE-Core, Java Development, Java Modernization Studio and
WorkIQ. Only HVE is installed in the required path; Java payload and WorkIQ
authentication limits remain visible. GitHub/Jira were withdrawn. The same-name
HVE source transition requires qualified uninstall and absence verification,
not assumed overwrite. Unknown/managed/duplicate sources stop with tutor help.

Installation and audit can take longer on restricted networks. Preflight tooling,
authentication, and permissions; prepare recorded audit output for delays. If
installation or audit cannot complete, explicitly record incomplete readiness
rather than claim the repository is ready.

### Explain the repository mechanics

`apm.yml` declares selected dependencies and their pinned source constraints.
Installation resolves and materializes them, deploys supported components for the
selected target, and records resolution in `apm.lock.yaml`. Participants inspect
an actual deployed agent rather than infer availability from a successful install.

The audit checks dependency, lockfile, deployed-content consistency, and applicable
policy. It does not prove that an agent's behavior is correct, safe in every use,
or appropriate for every task.

Disable the personal CLI plugin only after the repository deployment is verified:

```bash
copilot plugin disable hve-core@contoso-plugin-marketplace
copilot plugin list --json
```

Explain that disable preserves the install. Verify the repository agents in a new
CLI session if necessary. The personal plugin can later be restored with
`copilot plugin enable hve-core@contoso-plugin-marketplace`. Managed settings may
prevent local disabling; stop and resolve the handoff rather than claim success.
This command does not disable a separate
VS Code extension or plugin.

### Sharing and governance distinctions

| Mechanism | Purpose | Boundary |
| --- | --- | --- |
| Organization-shared prompts, agents, and skills | Centrally maintained internal practices, discussed in the session as `.copilot-private`. | Storage alone does not guarantee availability on every Copilot surface; explain the actual distribution path. |
| Copilot plugin marketplace | Discover packaged capabilities and install or enable them for supported clients. | This is not GitHub Marketplace for Actions/apps; discovery is not APM dependency-source approval. |
| APM repository dependency | Select, pin, install, and audit shared practices alongside project code. | Target compatibility and runtime availability still need verification. |
| Copilot enterprise-managed settings | Restrict available plugin marketplaces and require or block plugins. | An Enterprise Owner capability, separate from APM policy; not a general repository-admin setting. |
| APM policy plus required audit | Constrain dependency sources and verify repository compliance. | A shared workflow alone is not a mandatory merge gate; enforce it with applicable rulesets or required checks. |

Use the existing `microsoft/**` APM source allowlist for the hands-on exercise.
Use the template-shipped company-curated catalog as a concrete model: approved GitHub-hosted
package repositories can form an APM source allowlist. A marketplace display name
is not itself an APM source rule.

Explain centralized organization/enterprise APM policy and tighten-only
inheritance. Distinguish that policy from a shared audit workflow and from the
GitHub rule that makes the audit mandatory across selected repositories.
Demonstrations of organization-wide enforcement depend on the supported APM
version, policy distribution, GitHub plan, and administrator permissions.

Source verification resolved the earlier `.copilot-private` shorthand to
GitHub's documented `.github-private` convention. The guide distinguishes
organization-level shared agents from enterprise-wide governance configured by
an Enterprise Owner; it does not assert that every shared organization agent is
Enterprise-only or automatically distributes standalone prompts/skills.
See [organization custom agents](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/prepare-for-custom-agents)
and [enterprise governance](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/manage-agents/create-github-private-repo).

### Tutor app demo and optional historical marketplace comparison

Use the supplied screenshot of
[CoffeesoftDotDev/Plugin-Marketplace](https://github.com/CoffeesoftDotDev/Plugin-Marketplace),
which is private. Do not require participant membership or live access.

If useful, show the read-access requirement, `coffeesoft` catalog and `mslearn`
entry as a historical comparison, not the required exercise. The required catalog
is the attendee's template copy; its registration and HVE installation happen
before APM. Demonstrate registration in the GitHub Copilot app in an authorized
tutor profile; attendees register in CLI and VS Code. Explain the
publishing path: package metadata, a catalog entry, a pull request, manifest
validation, and code-owner review. Remind participants not to commit MCP secrets.

### Portability note

APM can also manage compatible whole Copilot Agent Plugins. It is not limited to
deploying loose agent files. Native plugin registration and loading depend on
APM/client versions; verify support against the workshop's pinned tooling before
adding a live example.

APM's compile command specifically compiles instructions into target context
files. Other primitives are deployed by install. Their formats and tools must
still be compatible with the selected harness; compilation is not automatic
conversion of every Copilot-specific agent behavior.

References:

- [Compile your package](https://microsoft.github.io/apm/producer/compile/)
- [Install Agent Plugins for Copilot](https://microsoft.github.io/apm/consumer/copilot-agent-plugins/)
- [Enterprise-managed plugin standards](https://docs.github.com/en/copilot/concepts/enterprise/plugin-standards)
- [Enterprise-managed settings reference](https://docs.github.com/en/copilot/reference/enterprise-administrators/enterprise-managed-settings)
- [APM enforcement in CI](https://microsoft.github.io/apm/enterprise/enforce-in-ci/)

## Level 5: reconcile the backlog, then delegate useful work

### Main participant path

1. Run a daily/manual Backlog Manager job against current issues, committed
   `docs/project-planning` content, and linked pull requests.
2. Inspect evidence-based issue updates and recommended implementation order.
3. Have a human select a bounded issue with acceptance criteria and explicit scope.
4. Delegate that issue to Copilot cloud agent with the repository's RPI Agent.
5. Observe its linked session and PR on the shared issue/Project dashboard.
6. Request Copilot code review when the implementation PR is ready for review.

Explain RPI briefly as Research, Plan, Implement, and Review. It works better with
well-created issues: a problem, expected outcome, acceptance criteria, constraints,
and dependencies give the agent a contract it can research and review against.
The agent's RPI self-review does not replace the separate Copilot PR review.

### Daily backlog reconciliation contract

| Evidence | Permitted update |
| --- | --- |
| Committed planning advances | Link the relevant document/revision and identify scope, acceptance-criteria, or dependency changes. Flag conflicting requirements for a human decision; do not silently rewrite agreed scope. |
| Linked draft/open PR | Publish progress with a real PR link, observed delivery, and remaining criteria. Open PRs are not completion evidence. |
| Fixing PR merged to `main` | Compare delivered changes and available checks with the issue's criteria. Link the fixing PR and commit; close only fully satisfied issues. |
| Partial or unclear delivery | Keep the issue open and state the remaining work or missing evidence. |

Prefer native issue-closing keywords for fully resolving PRs; the reconciliation
job handles remaining mismatches without treating every merged PR as completion.
For verified direct fixes on `main`, require an explicit issue-to-commit link and
the same acceptance evidence. Do not close issues from title similarity alone.

Keep repeated runs idempotent: avoid duplicate comments, findings, and reports;
update only when evidence changes. Treat issue and PR text as untrusted input,
not authority to widen permissions or assign work. Human selection and delegation
remain explicit gates.

Show a specific task's progress in a shared GitHub Issue/Project team dashboard:
planned, in progress with linked PR, review pending, and done after verified
delivery. The implemented lab uses human-set intermediate Status values and
GitHub Project's configured closed-item transition to Done. This avoids a
privileged Project token in the core exercise. Keep status-to-issue closure off;
moving a card is not acceptance evidence. Issue comments alone do not change
Project fields. Agent-driven ProjectOps remains an optional organizational extension.

The updated
[`daily-backlog.md`](../../solutions/afternoon-2/.github/workflows/daily-backlog.md)
adds bounded comments and verified closure for explicitly `backlog-managed`
issues, reads committed planning and revision-bound PR/check evidence, and
retains human assignment. It does not rewrite issue requirements or write
Project fields. Live closure and repeated-run behavior must still be observed
in an authorized test repository; a static prompt check is not runtime proof.

### Separate proctor-only accessibility demonstration

This is not a participant exercise. Do not require attendees to configure
Playwright, access the private reference repository, or run an accessibility audit.
Keep it visibly separate from the main backlog/RPI path.

Use the supplied repository MCP screenshot, prepared audit output, and these
references:

- [CoffeeSoft scheduled accessibility audit](https://github.com/CoffeesoftDotDev/accessibility-copilot/blob/main/.github/workflows/a11y-scheduled-audit.md)
- [CoffeeSoft Copilot instructions](https://github.com/CoffeesoftDotDev/accessibility-copilot/blob/main/.github/copilot-instructions.md)
- [Awesome Copilot](https://github.com/github/awesome-copilot)

The CoffeeSoft repository is private; provide the prepared visuals instead of
depending on attendee access. Do not copy its application-specific deployment
configuration or credential requirements into the Music Catalog exercise.

Show how browser evidence supplements source inspection: keyboard navigation,
focus, accessible names, empty/populated playlist states, and status/error
feedback. Retain reproducible findings, cite code or browser evidence, and link
existing issues/PRs to avoid duplicate remediation work.

Distinguish two execution surfaces:

- The scheduled `gh-aw` example declares its own Playwright tool.
- Repository MCP settings configure tools for cloud agent/code review; they do
  not automatically configure `gh-aw`, local Copilot CLI, or IDEs.

Check default Playwright availability before adding redundant configuration.
Tool availability is not proof that the application is running or reachable.
Missing runtime evidence must be reported as not tested, not a clean result.
The demo is audit-only and produces findings/coverage, not compliance
certification or proof of real screen-reader behavior. Keep cognitive-design
heuristics distinct from normative accessibility criteria.

Explain focused `fix(a11y): ...` remediation PRs as an optional downstream pattern.
Keep builds and tests active for fixes. Prevent recursive automation through
explicit workflow conditions and deduplication, not by assuming a title convention
enforces branch filtering. Participants do not execute this remediation track.

## Level 6: independently review the delegated delivery

Review the result of the cloud coding agent's RPI execution. Ensure Copilot code
review actually runs by requesting it explicitly or verifying automatic-review
configuration; coding-agent assignment alone does not establish this step.
Availability depends on the repository's Copilot entitlement and policy.

Read review findings, address valid feedback, and request another review after
substantive changes. Verify acceptance criteria, test results, APM audit, and any
relevant accessibility evidence. A human retains the approval and merge decision.

After merge to `main`, verify the fixing PR/commit links, issue closure or remaining
criteria, and the shared Project state. The next backlog run reconciles partial
delivery rather than declaring every merged change complete.

## Delivery readiness

- Use the verified `.github-private` convention and feature-specific eligibility.
- Verify any live whole-plugin example against the pinned APM/client releases.
- Dry-run bounded reconciliation, repeated-run deduplication, and verified closure.
- Configure the selected shared Project's closed-item workflow and Status choices.
- Prepare representative issues, planning changes, and PR evidence for the demo.
- Confirm required checks, cloud-agent setup, and Copilot code-review availability.
- Prepare private-repository screenshots and output for the proctor demos.
- Run the guide and related workshop checks without changing its safety gates.

The guide and solution workflow now implement this direction. No live GitHub
issues, Projects, repository settings, or workflow runs are modified by these
local changes. Marketplace/accessibility demo steps and all timing live in
[the tutor guide](../tutor.md), not as participant setup exercises.
