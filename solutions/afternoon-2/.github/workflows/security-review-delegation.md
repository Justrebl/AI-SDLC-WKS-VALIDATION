---
description: "Label-gated delegation of a security review to Copilot cloud agent with the HVE-Core Security Reviewer custom agent."

on:
  issues:
    types: [labeled]
    names: [security-review]

permissions:
  contents: read
  issues: read
  copilot-requests: write   # Copilot inference billed through the org, no PAT required for the agent job

engine: copilot

tools:
  github:
    toolsets: [issues]

# Workshop pattern: the agent job only reads and decides. The assignment itself is a safe output.
# assign-to-agent needs a fine-grained PAT in the GH_AW_AGENT_TOKEN secret; GITHUB_TOKEN and GitHub App tokens are rejected.
safe-outputs:
  assign-to-agent:
    name: copilot
    allowed: [copilot]
    custom-agent: security-reviewer
    custom-instructions: "Report only. Add docs/security/playlist-security-review.md and do not change application code. List which security skills you applied and mark every finding as verified or unverified."
    target: triggering
    max: 1
  add-comment:
    max: 1
---

# Security review delegation

You are running unattended inside a GitHub Actions job for the repository `${{ github.repository }}`.
A person added the `security-review` label to issue #${{ github.event.issue.number }}. Do not ask questions.

1. Read the triggering issue.
2. Delegate only when all of these are true:
   - the issue asks for a security review of code in this repository;
   - it names a scope (folders or files);
   - it asks for a report and does not ask for changes outside that scope;
   - it contains no credentials, tokens or keys.
3. If every condition holds, call `assign_to_agent` for the triggering issue.
4. Otherwise, call `add_comment` on the issue with the conditions that failed, and do not assign anyone.

The review findings are AI-assisted. They do not replace SAST, DAST, SCA, penetration testing or review by a qualified person.
