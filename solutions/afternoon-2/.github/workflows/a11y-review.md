---
description: "Weekly accessibility review of the Music Catalog front end with an actionable remediation plan."

on:
  schedule: weekly on monday
  workflow_dispatch:

permissions:
  contents: read
  issues: read
  pull-requests: read
  copilot-requests: write

engine: copilot

# Workshop pattern: import the HVE-Core Accessibility Reviewer for assessment;
# the workflow prompt below specifies the bounded remediation plan.
imports:
  - .github/agents/accessibility-reviewer.agent.md

network:
  allowed:
    - defaults
    - "w3.org"

tools:
  github:
    toolsets: [repos, issues]
  bash: ["cat", "ls", "find", "grep", "head", "wc"]
  web-fetch:

safe-outputs:
  create-issue:
    title-prefix: "[A11y review] "
    labels: [accessibility, automation]
    max: 1
    expires: 7
    close-older-issues: true
---

# Accessibility review and remediation plan

You are running unattended inside a GitHub Actions job for `${{ github.repository }}`. Do not ask questions.

Scope: `src/front/src/**` only (React + TypeScript). Standard: WCAG 2.2 level AA.

1. **Review** — act as the Accessibility Reviewer. Inspect components for semantic structure, accessible names on interactive elements, keyboard operability, focus management, status messages (`aria-live` / `role="alert"`), and colour-independent state. Record each finding with file, line, WCAG success criterion and a confidence (high, medium, low). Discard low-confidence findings.
2. **Plan** — act as the Accessibility Planner. Group the verified findings into at most five remediation tasks, ordered by user impact, each with acceptance criteria that a developer can test with Testing Library queries by role.
3. Create **one** issue containing `## Findings` (table: criterion, file, line, severity) and `## Remediation plan` (numbered tasks with acceptance criteria).
4. If there are no verified findings, call `noop` with a one-line explanation instead of creating an issue.

This is an automated assessment and not a conformance claim. A human must review findings before acting.
