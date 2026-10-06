# Design documentation

These pages keep the outcome of the Design Thinking sessions that shaped this workshop. They replace the local HVE-Core working state, which is never committed. Read them with the [maintainer handbook](../maintainer-handbook.md), which holds the design decisions (D1 to D17) and the open risks.

| Page | What it answers |
| --- | --- |
| [Problem and scope](problem-and-scope.md) | Which problem the workshop solves, what attendees should be able to do, and what is in and out of scope |
| [Stakeholders](stakeholders.md) | Who the workshop serves and who to consult before a delivery |
| [Assumptions](assumptions.md) | What is confirmed, what still needs checking, and how to check it |

## Update these pages

HVE-Core agents write their working state under `.copilot-tracking/`, which this repository ignores. When a new Design Thinking session changes the workshop:

1. Run the session with the DT Coach as usual. Its notes stay local.
2. Copy the outcome, not the notes, into the page it belongs to. Keep decisions in the handbook's [Design decisions](../maintainer-handbook.md#design-decisions) table and link to them from here.
3. Remove names, quotes, organization details and paths into `.copilot-tracking/`. Describe people by role.
4. Run `npx markdownlint-cli2 "docs/design/*.md"` and open a pull request.

Attendees practise the same habit in the Level 2 module [Curate what you commit](../afternoon-2/workshop.md#curate-what-you-commit).
