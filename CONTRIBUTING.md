# Contributing

Thanks for helping keep this workshop accurate. Copilot, Copilot CLI, APM, HVE-Core and GitHub agentic workflows change quickly, so most contributions are about keeping the labs aligned with current documentation.

The attendee guides (`docs/afternoon-*/workshop.md`) only contain what attendees practice. Maintainer guidance lives in this file, facilitator timing lives in [docs/tutor.md](docs/tutor.md), and design decisions, open assumptions and how to resume the work live in [docs/maintainer-handbook.md](docs/maintainer-handbook.md). The curated Design Thinking outcomes behind those decisions live in [docs/design/](docs/design/README.md); HVE-Core working state under `.copilot-tracking/` is never committed.

## Repository layout

| Path | Content |
| --- | --- |
| `docs/afternoon-1/workshop.md` | GitHub Copilot Zero to Hero (wraps the upstream GHCopilotHoL lab, adds Levels 7 to 9) |
| `docs/afternoon-2/workshop.md` | AI SDLC with GitHub and GitHub Copilot |
| `docs/prerequisites.md` | Shared prerequisites, network allowlist, organization settings and pre-D-Day checklists for both afternoons |
| `docs/before-d-day-*.md` | Self-contained pre-D-Day checklists for each delivery option (Codespaces, dev container, local tools). Keep them consistent with `docs/prerequisites.md` |
| `docs/kick-off-call-checklist.md` | Step-by-step organization checklist for the kick-off call; keep consistent with `docs/prerequisites.md` section 7 |
| `docs/tutor.md` | Timing, pre-flight, risks and messaging guardrails for tutors |
| `docs/afternoon-*/assets/` | Screenshots and their placeholder lists |
| `solutions/afternoon-2/` | Reference files for blocked attendees (`apm.yml`, policy, workflows, CI workflow and branch ruleset) |
| `src/`, `tests/api/` | Music Catalog starter application |
| `tests/workshop/afternoon-2/` | Workshop tester scripts that replay the AI SDLC lab |
| `.github/devcontainer-image/` | Prebuilt devcontainer image definition |
| `.github/agents/workshop-creator.agent.md` | Workshop Creator agent: reproduces this repository's creation path for a new workshop, with handoffs to the HVE-Core DT Coach, RPI Agent and PowerPoint Builder |
| `.github/skills/workshop-authoring/SKILL.md` | Workshop Creator's progressive-disclosure rules for concise introductions, optional depth, and a visible hands-on path |

## MOAW conventions

The guides are published with [MOAW](https://github.com/microsoft/moaw/blob/main/CONTRIBUTING.md). Preview your branch at:

- `https://moaw.dev/workshop/gh:Justrebl/AI-SDLC-Workshop/<branch>/docs/afternoon-1/`
- `https://moaw.dev/workshop/gh:Justrebl/AI-SDLC-Workshop/<branch>/docs/afternoon-2/`

## Writing rules

- Separate pages with `---` and keep the YAML frontmatter, including `duration_minutes`.
- Use MOAW boxes: `<div class="tip|info|warning|task" data-title="...">` with `>`-quoted content.
- **No time codes in the attendee guides.** Put durations, start times and "if late" fallbacks in [docs/tutor.md](docs/tutor.md).
- Keep facilitator-only and maintainer-only instructions out of the attendee guides.
- Apply [Workshop Authoring](.github/skills/workshop-authoring/SKILL.md) when creating or restructuring introductions: keep the required path visible and make deeper explanations optional.
- Follow the messaging guardrails in [docs/tutor.md](docs/tutor.md#messaging-guardrails): no prices or quotas, keep usage units distinct, HydraFusion is a Research Preview, `apm audit --policy` is experimental.
- Use current product names (for example **Copilot cloud agent**, formerly Copilot coding agent) and link to official documentation rather than restating it.
- Use synthetic data only.

## Upstream pins

GitHub Copilot Zero to Hero was last checked against:

| Repository | Commit |
| --- | --- |
| [Philess/GHCopilotHoL](https://github.com/Philess/GHCopilotHoL) | `c7f7f94` |
| [Philess/gh-copilot-demo](https://github.com/Philess/gh-copilot-demo) | `f935d88` |

AI SDLC with GitHub and GitHub Copilot pins HVE-Core by commit SHA in `solutions/afternoon-2/apm.yml` (`1dbd6a7`, the v3.2.2 release commit). Release tags are not resolvable as APM refs.

To re-verify:

1. Review the upstream diff since the pinned commit (for example `https://github.com/Philess/GHCopilotHoL/compare/c7f7f94...main`).
2. Update the level links and descriptions in `docs/afternoon-1/workshop.md` if levels moved or changed.
3. Adjust the timings in [docs/tutor.md](docs/tutor.md) if a level's scope changed.
4. Update the commit values in this section.
5. When bumping HVE-Core, update `solutions/afternoon-2/apm.yml` and any workshop text that quotes the pin, then run the workshop tester.

## Screenshots

Each `docs/afternoon-*/assets/README.md` lists the screenshots the guides expect. Capture them from a clean profile with synthetic data only, and remove names, emails and tenant identifiers.

## Do not change without coordination

These values are matched by scripts or attendee instructions:

- The paths `docs/afternoon-1`, `docs/afternoon-2`, `solutions/afternoon-2` and `tests/workshop/afternoon-2` (display names changed, paths did not).
- The `afternoon-1` branch name.
- The commit message `Baseline Afternoon 2 starter`, which the workshop tester looks for.
- `.github/workflows/workshop-tester.md`. Any edit requires recompiling `workshop-tester.lock.yml` with `gh aw compile`; commit both files together. Run the compile from a folder outside OneDrive-synced paths if it hangs.

## Validation

Run what applies to your change:

```bash
# Starter application
dotnet test
cd src/front && npm ci && npm test && npm run build

# AI SDLC guide: the tester extracts prompts from the guide
node tests/workshop/afternoon-2/extract-prompts.mjs docs/afternoon-2/workshop.md /tmp/prompts

# Tester shell scripts
bash -n tests/workshop/afternoon-2/lib.sh
bash -n tests/workshop/afternoon-2/run-lab.sh
```

After merge, the [workshop tester](tests/workshop/afternoon-2/README.md) replays the AI SDLC lab and opens an issue if a step fails. Changes to the devcontainer image are described in the [README](README.md#prebuilt-devcontainer-image).

## Issues and pull requests

- Report problems at <https://github.com/Justrebl/AI-SDLC-Workshop/issues>. For the upstream Zero to Hero levels, use [Philess/GHCopilotHoL issues](https://github.com/Philess/GHCopilotHoL/issues).
- Keep pull requests focused, describe what changed for attendees, and use conventional commit prefixes (`docs:`, `fix:`, `feat:`, `ci:`).
