# Kick-off call: D-Day readiness checklist

Use this page during the kick-off call to check, with the customer on screen, that everything the attendees will use on D-Day is in place. It only lists checks: **look here, expect this**. Note each gap in the table at the end and give it an owner. The fixes are agreed after the call.

**[Codespaces only]** marks checks that apply only if the customer chose the Codespaces delivery option. All other checks apply to every option.

**Who should share their screen:** an organization owner, plus one volunteer attendee for section 9. Replace `ORG` with the organization name.

## 0. Context

- [ ] Delivery option chosen: Codespaces, local dev container, or local tools.
- [ ] Organization that grants the attendees' Copilot seats identified.
- [ ] Does the organization belong to an enterprise? If yes, settings that are greyed out are set by the enterprise. Note them as gaps.
- [ ] Number of attendees and their GitHub handles available.

## 1. Copilot licences

Organization → **Settings → Copilot → Access**

- [ ] Plan shown is **Copilot Business** or **Copilot Enterprise**.
- [ ] Every attendee and facilitator has a seat, either directly or through a team.
- [ ] Number of seats assigned ≥ number of attendees.

## 2. Copilot features allowed

Organization → **Settings → Copilot → Policies**

- [ ] **Copilot in the IDE / Copilot Chat**: enabled.
- [ ] **Copilot CLI**: enabled.
- [ ] **Copilot cloud agent**: enabled.
- [ ] **Copilot code review**: enabled.
- [ ] **MCP servers in Copilot**: enabled.
- [ ] **Preview features**: enabled, if the facilitator plans to show them.
- [ ] No policy blocks installing **plugins** or using a **marketplace** (needed for `microsoft/hve-core`).

## 3. Models

Organization → **Settings → Copilot → Models**

- [ ] The models the facilitator plans to demo are enabled.
- [ ] Auto model selection is available. It only picks from models that are enabled.

## 4. Copilot cloud agent access

Organization → **Settings → Copilot → Cloud agent**

- [ ] Repository access covers **all repositories**, or at least the repositories attendees will create.

## 5. Repositories

Organization → **Settings → Member privileges**

- [ ] Members can create **private** repositories.
- [ ] Members can **fork** repositories.
- [ ] Members can create repositories from a **template**. The workshop template is public: `Justrebl/AI-SDLC-Workshop`.

## 6. GitHub Actions

Organization → **Settings → Actions → General**

- [ ] Actions are allowed for all repositories, or for the attendees' repositories.
- [ ] Allowed actions include `actions/*` and `github/gh-aw-actions/*`, or all actions are allowed.
- [ ] Workflow permissions do not prevent workflows from creating issues and comments.
- [ ] Actions usage is not blocked by a budget of zero (**Settings → Billing and licensing**).

## 7. Codespaces [Codespaces only]

Organization → **Settings → Codespaces**

- [ ] **[Codespaces only]** Codespaces is enabled for all members, or for the attendees.
- [ ] **[Codespaces only]** Allowed machine types include 2-core and 4-core.
- [ ] **[Codespaces only]** The billing owner is known: the organization or each user.
- [ ] **[Codespaces only]** If the organization pays, the Codespaces budget is above zero (**Settings → Billing and licensing**).

Organization → **Settings → Authentication security**

- [ ] **[Codespaces only]** The **IP allow list** is **not** enabled. With it enabled, codespaces cannot be used for the organization's repositories.

## 8. Packages and container image

- [ ] Public images on `ghcr.io` can be pulled. That is where the prebuilt dev container image comes from.
- [ ] Local dev container option: the attendees' machines can run Docker Desktop or Podman. Check this with the customer's workstation policy.

## 9. Volunteer attendee, live

- [ ] [github.com/settings/copilot](https://github.com/settings/copilot) shows a Business or Enterprise seat, granted by `ORG`.
- [ ] VS Code: Copilot Chat answers a question. The signed-in account in **Accounts** is the right one.
- [ ] The terminal shows a logged-in account with the expected scopes:

  ```bash
  gh auth status
  ```

- [ ] **[Codespaces only]** [github.com/codespaces](https://github.com/codespaces) → a new codespace on the template opens in the browser.
- [ ] Local dev container option: `docker run --rm hello-world` succeeds (or `podman run --rm hello-world`).
- [ ] Local tools option: `git --version`, `node --version`, `dotnet --version` and `gh --version` all return a version.

## 10. Network

These can run from the volunteer's machine, or be handed to the network team.

- [ ] `github.com`, `api.github.com` and the Copilot endpoints are reachable, and Copilot answers in VS Code (section 9). The reference list is the [Copilot allowlist reference](https://docs.github.com/en/copilot/reference/copilot-allowlist-reference). The current domains are returned by:

  ```bash
  gh api meta --jq '.domains | .website, .copilot'
  ```

- [ ] `ghcr.io` is reachable.
- [ ] **[Codespaces only]** The Codespaces domains are reachable from attendee workstations, including `*.github.dev` with WebSockets. The current list is returned by:

  ```bash
  gh api meta --jq '.domains.codespaces'
  ```

- [ ] Is there TLS inspection or a proxy? If yes, note it as a gap.

## 11. Code security (optional, Afternoon 2 Level 6)

Organization → **Settings → Advanced Security**

- [ ] **GitHub Secret Protection** can be enabled on the attendees' private repositories. If not, the facilitator demos push protection instead. Note the decision.
- [ ] Repository administrators can enable Secret Protection, push protection and custom patterns. Enterprise or organization settings may lock them.

## 12. Extended role tracks (optional, Afternoon 2)

Decide which extended tracks run hands-on, run as a demo, or are skipped. See the [tutor guide](tutor.md#extended-tracks-outside-the-240-minutes).

- [ ] **Product Manager track (Level 2):** the MCP servers policy allows the GitHub MCP server, and the volunteer can create an issue with a sub-issue in their repository.
- [ ] **Meeting Analyst demo:** the facilitator has a Microsoft 365 Copilot licence and WorkIQ access. Otherwise, skip the demo.
- [ ] **Security delegation (Level 5):** the volunteer can assign an issue to Copilot and choose a custom agent.
- [ ] **gh-aw label-gated delegation demo:** the PAT policy allows a fine-grained PAT for the facilitator's sandbox repository.

## Gaps and owners

| # | Gap found | Owner | Due |
| --- | --- | --- | --- |
| 1 | | | D-7 |
| 2 | | | D-7 |
| 3 | | | D-1 |

**Next dates:** D-7, all gaps closed. D-1, every attendee runs the checklist for their delivery option: [Codespaces](before-d-day-codespace.md), [local dev container](before-d-day-devcontainer.md) or [local tools](before-d-day-local.md).
