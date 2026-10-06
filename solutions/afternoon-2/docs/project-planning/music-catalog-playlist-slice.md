---
prd_id: "PRD-001"
title: "Music Catalog playlist slice"
status: "draft"
version: "0.1.0"
owners: ["Workshop facilitator"]
reviewers: ["Workshop participants"]
created_date: "2026-10-01"
last_updated: "2026-10-01"
product_goal_ids: ["GOAL-001"]
product_goal_smart_status: "deferred"
fr_to_ac_coverage_threshold_pct: 80.0
fr_to_goal_coverage_threshold_pct: 100.0
diagram_format: "mermaid"
lineage:
  supersedes: []
  superseded_by: []
source_brd_id: "BRD-001"
requirement_id_prefixes:
  fr: "FR"
  ac: "AC"
  nfr: "NFR"
  con: "CON"
  goal: "GOAL"
license: "CC-BY 4.0 (Microsoft HVE-Core)"
---

# Music Catalog playlist slice

> **PRD-001** | Status: draft | Version: 0.1.0 | Last Updated: 2026-10-01 | Source: [BRD-001](music-catalog-playlist-slice-brd.md)

> [!NOTE]
> Reference output for the Afternoon 2 Product Manager track. Written by hand to match the fixed workshop scope. A real PRD Builder run produces different wording and structure.

## Executive Summary

The playlist slice lets a listener browse the 12 synthetic tracks of the Music Catalog and collect them in one in-memory playlist. It is the shared contract between the Product Manager track (Level 2) and the RPI implementation loop (Level 3).

Release horizon: one workshop level. Primary success metric: the API and UI test suites pass.

## Users and Personas

| Persona | Jobs to be done | Pain point | Success outcome |
| --- | --- | --- | --- |
| Listener (workshop participant) | Browse the catalog, collect tracks | No way to keep a selection | Sees chosen tracks in one playlist |

## Design Decisions

- **DD-001**: Keep the single playlist in memory in the API process. See [ADR 0001](../planning/adrs/0001-in-memory-playlist-state.md).
- **DD-002**: Use the existing `/api` minimal API conventions and camelCase JSON.

## Product Goals

GOAL-001: A listener can build a playlist from the catalog during a session, with passing API and UI tests. Priority: MUST. Traces to BG-001.

## Functional Requirements

### FR-001: List the catalog tracks

- Actor: front end.
- Trigger: `GET /api/tracks`.
- Expected outcome: the API returns the 12 tracks from `src/api/Data/tracks.json` as JSON with camelCase properties.
- Goal: GOAL-001.
- Acceptance criteria:
  - **AC-001**: When a client sends `GET /api/tracks`, the API shall return HTTP 200 and an array of 12 tracks.
  - **AC-002**: The API shall return each track with the fields defined in `tracks.json`, in camelCase.

### FR-002: Read the playlist

- Actor: front end.
- Trigger: `GET /api/playlist`.
- Expected outcome: the API returns the single in-memory playlist.
- Goal: GOAL-001.
- Acceptance criteria:
  - **AC-003**: When a client sends `GET /api/playlist` to a freshly started API, the API shall return HTTP 200 and an empty list.
  - **AC-004**: When a track was added, `GET /api/playlist` shall include that track.

### FR-003: Add a track to the playlist

- Actor: front end.
- Trigger: `POST /api/playlist/{trackId}`.
- Expected outcome: the track is added once.
- Goal: GOAL-001.
- Acceptance criteria:
  - **AC-005**: When `trackId` is known and not in the playlist, the API shall add the track and return a success status.
  - **AC-006**: If `trackId` is unknown, then the API shall return HTTP 404 and leave the playlist unchanged.
  - **AC-007**: If `trackId` is already in the playlist, then the API shall return HTTP 409 and leave the playlist unchanged.

### FR-004: Show the track list with Add buttons

- Actor: listener.
- Expected outcome: the front end lists every track with an accessible Add button.
- Goal: GOAL-001.
- Acceptance criteria:
  - **AC-008**: The UI shall show, for each track, a button whose accessible name identifies the track, for example "Add Track title".
  - **AC-009**: When the listener selects an Add button, the UI shall call `POST /api/playlist/{trackId}` and update the playlist panel.

### FR-005: Show the playlist panel

- Actor: listener.
- Goal: GOAL-001.
- Acceptance criteria:
  - **AC-010**: While the playlist is empty, the panel shall show the text "Your playlist is empty. Add a track to get started."
  - **AC-011**: When a track is added, the panel shall list it.
  - **AC-012**: If the API returns 409, then the UI shall show a visible duplicate message in an `aria-live` region or with `role="alert"`.

### FR-006: Automated tests

- Goal: GOAL-001.
- Acceptance criteria:
  - **AC-013**: xUnit tests in `tests/api` shall use `WebApplicationFactory<Program>` and cover AC-001 to AC-007.
  - **AC-014**: Vitest and Testing Library tests in `src/front` shall cover AC-008 to AC-012 and query controls by role and name.

## Non-Functional Requirements

### Reliability and Resilience

- **NFR-001**: State is in memory only. Restarting the API empties the playlist. This is accepted for the workshop.

### Security

- **NFR-002**: No authentication. The slice holds synthetic data only. This is accepted for a workshop. See the Level 5 security track.

### Usability and Accessibility

- **NFR-003**: Semantic elements, labelled buttons, and `role="alert"` or `aria-live` for status messages.

### Maintainability

- **NFR-004**: No new libraries, no database, no file writes, and no external services.

## Constraints

- **CON-001**: One playlist only.
- **CON-002**: Follow the repository conventions: minimal API under `/api`, function components and hooks only.

## Out of Scope

Users, authentication, persistence, reorder, remove, search, and playlist creation.

## Traceability

| BRD requirement | PRD requirements |
| --- | --- |
| FR-001 | FR-001, FR-004 |
| FR-002 | FR-002, FR-003, FR-005 |
| FR-003 | FR-003 (AC-007), FR-005 (AC-012) |
| FR-004 | FR-005 (AC-010) |

## Open Questions

| ID | Question | Status |
| --- | --- | --- |
| OQ-001 | Should a successful add return 200 with the playlist, or 201? | Implementation choice in Level 3. Tests must match it. |
| OQ-002 | Exact wording of the duplicate message. | Carried over from BRD OQ-002. |
