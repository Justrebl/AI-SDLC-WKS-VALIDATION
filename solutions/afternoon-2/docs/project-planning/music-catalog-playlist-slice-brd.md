---
brd_id: "BRD-001"
title: "Music Catalog playlist slice"
status: "draft"
version: "0.1.0"
owners: ["Workshop facilitator"]
reviewers: ["Workshop participants"]
created_date: "2026-10-01"
last_updated: "2026-10-01"
business_goal_ids: ["BG-001"]
business_goal_smart_status: "deferred"
fr_to_ac_coverage_threshold_pct: 80.0
diagram_format: "mermaid"
lineage:
  supersedes: []
  superseded_by: []
last_brd_id: null
requirement_id_prefixes:
  fr: "FR"
  ac: "AC"
  nfr: "NFR"
  con: "CON"
  br: "BR"
license: "CC-BY 4.0 (Microsoft HVE-Core)"
---

# Music Catalog playlist slice

> **BRD-001** | Status: draft | Version: 0.1.0 | Last Updated: 2026-10-01

> [!NOTE]
> Reference output for the Afternoon 2 Product Manager track. Written by hand to match the fixed workshop scope. A real BRD Builder run produces different wording and structure.

## Executive Summary

Workshop participants need one small, realistic feature to practise a governed agentic software development lifecycle (SDLC) from requirements to delivery. This BRD defines that feature: a listener browses a synthetic music catalog and collects tracks in a single playlist during a session.

The workshop facilitator sponsors the slice. The scope is deliberately narrow: one playlist, in-memory state, and no users, authentication, or persistence. These limits keep the slice small enough to ship within one workshop level.

Primary success metric: every participant ships the slice with passing tests during the workshop.

## Business Context

The Music Catalog application is a training mono-repo. Its only purpose is to give participants a shared, low-risk code base for the Agentic SDLC with GitHub Copilot workshop. The track catalog is synthetic seed data. The slice must not depend on external services, customer data, or production systems.

Source of the decisions in this BRD: the locked Design Thinking decisions for this slice (Level 2 of Afternoon 2).

## Stakeholders

| Stakeholder | Power | Interest | Engagement strategy |
| --- | --- | --- | --- |
| Workshop facilitator (sponsor) | High | High | Manage closely: approves scope and success criteria |
| Workshop participants (listeners and builders) | Low | High | Keep informed: they use the slice and implement it |

## Design Decisions

- **DD-001**: Scope is limited to a single playlist with in-memory state. Source: locked Design Thinking decisions.
- **DD-002**: Users, authentication, persistence, reorder, remove, search, and playlist creation are out of scope. Source: locked Design Thinking decisions.

## Business Goals

BG-001: Every workshop participant ships the playlist slice with passing tests during the workshop session.

- Priority: MUST
- KPI: Share of participants whose slice passes the API and UI test suites.
- Baseline: Not measured. See OQ-001.
- Target: All participants.
- Timeframe: Within the workshop session.
- Measurement source: Participant test runs (`dotnet test` and `npm test`).
- Owner: Workshop facilitator.

**SMART status**: deferred. The baseline is unknown.

## Business Rules

- **BR-001**: The slice uses synthetic catalog data only. No customer or confidential data. Category: policy. Enforceability: mandatory.
- **BR-002**: Playlist state is not persisted beyond the running API process. Category: operational. Enforceability: mandatory.

## Functional Requirements

| ID | Requirement | Actor | Acceptance criteria |
| --- | --- | --- | --- |
| FR-001 | A listener can browse the catalog of tracks. | Listener | AC-001 |
| FR-002 | A listener can add a track to the single playlist. | Listener | AC-002 |
| FR-003 | The playlist rejects a duplicate add and tells the listener. | Listener | AC-003 |
| FR-004 | An empty playlist shows a visible empty state. | Listener | AC-004 |

Acceptance criteria:

- **AC-001**: The listener sees every track in the synthetic catalog.
- **AC-002**: After adding a track, the listener sees it in the playlist.
- **AC-003**: Adding a track that is already in the playlist leaves the playlist unchanged and shows a visible message.
- **AC-004**: With no tracks in the playlist, the listener sees an empty-state message.

## Non-Functional Requirements

- **NFR-001 (accessibility)**: Every control is reachable and identifiable by role and accessible name.
- **NFR-002 (operability)**: The slice adds no new libraries and no external services.

## Constraints

- **CON-001**: One playlist only.
- **CON-002**: In-memory state only.
- **CON-003**: No users, authentication, persistence, reorder, remove, search, or playlist creation.

## Out of Scope

- User accounts and authentication.
- Persistence across restarts.
- Reordering or removing tracks.
- Searching the catalog.
- Creating more than one playlist.

## Open Questions

| ID | Question | Owner |
| --- | --- | --- |
| OQ-001 | Is a baseline needed for BG-001, or is the target alone enough for a workshop? | Workshop facilitator |
| OQ-002 | What is the exact text of the duplicate message? The facts only require it to be visible. | Workshop facilitator |

## Handoff

Next step: PRD Builder turns FR-001 to FR-004 into product requirements with testable acceptance criteria.
