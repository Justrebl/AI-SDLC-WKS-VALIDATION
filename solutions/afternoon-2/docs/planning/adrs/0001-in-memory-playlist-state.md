---
status: accepted
date: 2026-10-01
decision-makers: Tech lead (workshop participant)
consulted: Workshop facilitator
informed: Workshop participants
---

# Keep the playlist state in memory

> [!NOTE]
> Reference output for the Afternoon 2 Tech Lead extension. Written by hand in the MADR format that ADR Creator follows. A real run produces different wording.

## Context and Problem Statement

The playlist slice ([PRD-001](../../project-planning/music-catalog-playlist-slice.md)) needs to remember which tracks a listener added. The repository conventions say state is kept in memory only, with no database, file writes, or external services. Where should the API keep the playlist?

## Decision Drivers

* Repository convention: in-memory state only.
* The slice must ship within one workshop level.
* Tests must run with `WebApplicationFactory<Program>` and no extra infrastructure.
* The catalog in `src/api/Data/tracks.json` is read-only seed data.

## Considered Options

* In-memory collection registered as a singleton in the API process.
* A database, for example SQLite or a hosted database.
* Writing the playlist back to `tracks.json` or another file.

## Decision Outcome

Chosen option: "In-memory collection registered as a singleton", because it is the only option that respects the repository conventions and needs no extra infrastructure for tests.

### Consequences

* Good, because the change stays inside `src/api` and the tests stay fast and self-contained.
* Good, because each test host starts with an empty playlist.
* Bad, because the playlist is lost when the API restarts.
* Bad, because state is not shared between instances. The API must run as a single instance.
* Neutral, because a later persistence change replaces this decision with a new ADR.

### Confirmation

* Code review checks that no database package, file write, or external call was added.
* The xUnit test for AC-003 confirms that a fresh API returns an empty playlist.

## Pros and Cons of the Options

### In-memory singleton

* Good, because it matches the conventions.
* Good, because it needs no setup.
* Bad, because it is not durable and not shared across instances.
* Bad, because concurrent requests need a thread-safe collection or a lock.

### Database

* Good, because it is durable.
* Bad, because it breaks the "no database" convention.
* Bad, because it adds setup to the Codespace and the tests.

### Write to a file

* Good, because it survives a restart.
* Bad, because it breaks the "no file writes" convention.
* Bad, because it would change the read-only seed data.

## More Information

Revisit this decision if the workshop adds users or persistence. Related: [security review](../../security/playlist-security-review.md) finding on thread safety.
