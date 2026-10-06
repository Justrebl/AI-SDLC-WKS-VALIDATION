# Backlog handoff: Music Catalog playlist slice

> [!NOTE]
> Reference output for the Afternoon 2 Product Manager track. It shows the shape of a Functional Planner GitHub handoff and a Backlog Manager `/backlog-plan` result. Written by hand. In a real run, Functional Planner writes `handoff.md` to a local tracking folder and nothing is created on GitHub until you confirm.

* **Project**: Music Catalog playlist slice
* **Source**: [PRD-001](music-catalog-playlist-slice.md)
* **Target**: GitHub issues in the participant's repository
* **Status**: needs_review

## Planning Summary

| Level | Count |
| --- | --- |
| Parent issue (level 1) | 1 |
| Sub-issues (level 2) | 4 |

Labels, milestones, and assignees are left empty on purpose. Add them during Backlog Manager triage.

## Issues

### {{TEMP-1}} feat: playlist slice

* **Level**: 1 (parent)
* **Status**: needs_review

Body:

> Build the single in-memory playlist described in [PRD-001](music-catalog-playlist-slice.md).
>
> **Children**
>
> - {{TEMP-2}} feat(api): list catalog tracks
> - {{TEMP-3}} feat(api): read and add to the playlist
> - {{TEMP-4}} feat(front): track list and playlist panel
> - {{TEMP-5}} test: API and UI coverage for the playlist slice

### {{TEMP-2}} feat(api): list catalog tracks

* **Level**: 2 (sub-issue of {{TEMP-1}})
* **Area**: `src/api`
* **Status**: needs_review

Acceptance criteria (PRD FR-001):

- [ ] AC-001: `GET /api/tracks` returns HTTP 200 and 12 tracks.
- [ ] AC-002: each track uses camelCase fields from `tracks.json`.

### {{TEMP-3}} feat(api): read and add to the playlist

* **Level**: 2 (sub-issue of {{TEMP-1}})
* **Area**: `src/api`
* **Status**: needs_review

Acceptance criteria (PRD FR-002, FR-003):

- [ ] AC-003: `GET /api/playlist` returns an empty list on a fresh process.
- [ ] AC-004: `GET /api/playlist` includes added tracks.
- [ ] AC-005: `POST /api/playlist/{trackId}` adds a known track.
- [ ] AC-006: unknown `trackId` returns 404, playlist unchanged.
- [ ] AC-007: duplicate `trackId` returns 409, playlist unchanged.

### {{TEMP-4}} feat(front): track list and playlist panel

* **Level**: 2 (sub-issue of {{TEMP-1}})
* **Area**: `src/front`
* **Status**: needs_review

Acceptance criteria (PRD FR-004, FR-005):

- [ ] AC-008: each track has an Add button whose accessible name identifies the track.
- [ ] AC-009: selecting Add calls the API and updates the panel.
- [ ] AC-010: the empty panel shows "Your playlist is empty. Add a track to get started."
- [ ] AC-011: the panel lists added tracks.
- [ ] AC-012: a 409 shows a visible duplicate message with `role="alert"` or `aria-live`.

### {{TEMP-5}} test: API and UI coverage for the playlist slice

* **Level**: 2 (sub-issue of {{TEMP-1}})
* **Area**: `tests/api`, `src/front`
* **Status**: needs_review

Acceptance criteria (PRD FR-006):

- [ ] AC-013: xUnit tests with `WebApplicationFactory<Program>` cover AC-001 to AC-007.
- [ ] AC-014: Vitest and Testing Library tests cover AC-008 to AC-012, querying by role and name.

## Operations

Run in order. Each link runs after both of its issues exist.

- [ ] Create {{TEMP-1}} feat: playlist slice
- [ ] Create {{TEMP-2}} feat(api): list catalog tracks
- [ ] Create {{TEMP-3}} feat(api): read and add to the playlist
- [ ] Create {{TEMP-4}} feat(front): track list and playlist panel
- [ ] Create {{TEMP-5}} test: API and UI coverage for the playlist slice
- [ ] Link {{TEMP-2}} as sub-issue of {{TEMP-1}}
- [ ] Link {{TEMP-3}} as sub-issue of {{TEMP-1}}
- [ ] Link {{TEMP-4}} as sub-issue of {{TEMP-1}}
- [ ] Link {{TEMP-5}} as sub-issue of {{TEMP-1}}

## Sample `/backlog-plan` result

Recommended order after the issues exist:

1. **feat(api): list catalog tracks**. Smallest change. Fixes the track contract the front end needs.
2. **feat(api): read and add to the playlist**. Depends on the track contract for 404 checks.
3. **feat(front): track list and playlist panel**. Uses both endpoints.
4. **test: API and UI coverage**. Write the tests alongside each item above, not at the end. Close this issue when AC-013 and AC-014 pass.

Parallel work:

- The two API issues touch the same `Program.cs`. Run them in sequence to avoid conflicts.
- Once the API contract (routes, status codes, JSON shape) is fixed, the front-end issue can start in parallel against a mocked API.
- The API tests and the UI tests live in separate folders and can be written in parallel.
