# Afternoon 2 reference outputs for the extended tracks

These files show what good output from the HVE-Core role agents looks like for the Music Catalog playlist slice. Facilitators can use them for demos, as a fallback when an agent run fails, or to compare with attendee output.

<div class="warning" data-title="Workshop simulation">

> These documents were written by hand to match the fixed scope of the workshop. They are not captured agent output. Real BRD Builder, PRD Builder, Functional Planner, ADR Creator, and Security Reviewer runs produce different wording, file names, identifiers, and structure. Compare the content and scope, not the exact text.

</div>

| File | Track | Produced in a real run by | Where attendees save it |
| --- | --- | --- | --- |
| [project-planning/music-catalog-playlist-slice-brd.md](project-planning/music-catalog-playlist-slice-brd.md) | Level 2, Product Manager | BRD Builder | `docs\project-planning` |
| [project-planning/music-catalog-playlist-slice.md](project-planning/music-catalog-playlist-slice.md) | Level 2, Product Manager | PRD Builder | `docs\project-planning` |
| [project-planning/playlist-slice-backlog-handoff.md](project-planning/playlist-slice-backlog-handoff.md) | Level 2, Product Manager | Functional Planner (`handoff.md`) and Backlog Manager `/backlog-plan` | Not committed. Functional Planner writes its handoff to a local tracking folder. |
| [project-planning/remove-playlist-track.md](project-planning/remove-playlist-track.md) | Level 5, core follow-up | Workshop-authored planning decision, not captured agent output | `docs\project-planning`, linked from the feature issue |
| [planning/adrs/0001-in-memory-playlist-state.md](planning/adrs/0001-in-memory-playlist-state.md) | Level 3, Tech Lead extension | ADR Creator | `docs\planning\adrs` |
| [security/playlist-security-review.md](security/playlist-security-review.md) | Level 5, Security Architect track | Security Reviewer, run by Copilot cloud agent | `docs\security`, through the agent's pull request |

How to use them:

- **Product Manager track.** After Step 5, open the sample handoff next to the attendee's `handoff.md`. Check for one parent issue, four sub-issues, and acceptance criteria that match the PRD.
- **Tech Lead extension.** Compare the attendee ADR with the sample: it needs context, the chosen option, the options it rejected, and the consequences (state lost on restart, single instance only, replaced by a later persistence change).
- **Security Architect track.** Use the sample report to show the expected shape: severity, file and line, description, recommendation, a verified or unverified status, the skills applied, and the AI-assisted disclaimer. The report has illustrative findings. Do not treat it as a real assessment of any implementation.
