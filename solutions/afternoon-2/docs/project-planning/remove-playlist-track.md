# Follow-up decision: remove a track from the playlist

**Status:** Ready for a scoped implementation issue.

The first Music Catalog slice adds tracks to one in-memory playlist. Removing
tracks was deliberately excluded from that slice. This follow-up adds removal
without changing the original planning record or introducing persistence.

## Problem and outcome

A listener cannot undo adding the wrong track. They should be able to remove an
existing playlist item without refreshing the page.

## Acceptance criteria

- The API exposes a remove operation for an existing playlist track.
- An unknown or absent track returns a clear error status and JSON body.
- Each playlist item has an accessible Remove button identifying its track.
- Removal refreshes the panel and restores the existing empty state after the
  last item is removed.
- xUnit and Vitest/Testing Library tests cover those behaviors.

## Constraints

Use the repository's existing API and UI conventions. State remains in memory.
No persistence, multiple playlists, users, reorder, search, or styling libraries.
Implementation chooses the route and component design within these boundaries.

## Traceability

Create or reuse one feature issue with these criteria. Link this document and the
original `docs/project-planning/playlist-design-decisions.md` from that issue.
The implementing PR links the issue and records test results. A full fix can use
a closing keyword; partial delivery must state what remains.

The daily backlog job may update evidence on issues explicitly labelled
`backlog-managed`. Planning text alone is not completion evidence.
