# Problem and scope

This page records the problem the workshop solves and the scope agreed during the first Design Thinking session. The rationale for each structural choice lives in the [maintainer handbook](../maintainer-handbook.md#design-decisions).

## Problem statement

Most engineers in the target audience use GitHub Copilot for chat and code completion. They do not yet see how to:

- ground AI work in a shared methodology, such as HVE-Core Design Thinking and the RPI workflow;
- package and govern that methodology across an organization with APM and a plugin marketplace;
- carry it from local work in the IDE or Copilot CLI into GitHub agentic workflows and Copilot cloud agent.

They need a hands-on, end-to-end experience of the AI SDLC on one shared, deliberately small application.

## Attendee capability

By the end of the two afternoons, attendees can:

- explain Copilot primitives (agents, custom instructions, prompts, skills) and how they change agent mode;
- compare Copilot Chat with the Copilot CLI harness, and place each surface on the autonomy ladder;
- layer instructions and limit what agents can do with hooks, MCP governance, branch rulesets and required checks;
- apply HVE-Core Design Thinking and the RPI workflow to a feature;
- share and consume methodology through a plugin marketplace and APM packages;
- install HVE-Core in a repository with APM so Copilot cloud agent and agentic workflows can use it;
- delegate a scoped issue to Copilot cloud agent and review the result;
- name the decisions needed to roll the method out across an organization: policies, metrics, existing code bases, method and model choice.

## In scope

- Copilot primitives, agent mode and the Copilot CLI harness (Afternoon 1 and its extra levels).
- HVE-Core Design Thinking and RPI, with RPI as the main hands-on topic.
- APM packaging, policy and lockfile, and plugin marketplace publication and consumption.
- Agentic workflows for daily backlog management, accessibility review and security-review delegation.
- Delegation of an issue from the generated backlog to Copilot cloud agent, behind a required CI check.
- An agentic threat model and an architect capstone on organization rollout.
- Governance framing across the whole chain.

## Out of scope

- Installing and authenticating tools during the workshop. This happens before the day; see [prerequisites.md](../prerequisites.md).
- Databases, persistence, users and authentication in the Music Catalog.
- Prices, quotas and cost guarantees. Cost and model selection appear only as a short decision guide in the architect capstone, without prices.

## Structural choices

| Choice | Handbook decision |
| --- | --- |
| Two 4-hour afternoons, the first on primitives and the second on the SDLC | D1, D2, D3 |
| Hands-on first, with demos as the fallback | D4 |
| Setup before the day | D5 |
| One Music Catalog application from a hello-world starter | D6, D7 |
| One feature: browse tracks and add a track to a single in-memory playlist | D8, D9 |
| Duplicate handling and the empty state are decided by attendees at a review gate | D10 |
| Fixed copy-paste prompts and a 2-hour budget for Design Thinking plus RPI | D11, D12 |
| HVE-Core installed through APM in the repository | D13 |
| Agentic workflows and Copilot cloud agent delegation | D14 to D17 |

The scripted prompts make Design Thinking a guided demonstration rather than open discovery. The review gates are where attendees use their own judgement.
