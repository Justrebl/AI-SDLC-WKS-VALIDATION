# Before D-Day — GitHub Codespaces setup (🥇 Option 1)

Use this checklist if your organization chose **GitHub Codespaces** for both afternoons:

- **Afternoon 1 — GitHub Copilot Zero to Hero**
- **Afternoon 2 — AI SDLC with GitHub and GitHub Copilot**

Nothing has to be installed on attendee machines: the tools run in a cloud VM that you open from the browser or from VS Code desktop. The risks are on the **network** and **organization settings** side, so start at **D-7**.

Other setups: [local dev container](before-d-day-devcontainer.md) · [local tools](before-d-day-local.md). Full reference: [prerequisites](prerequisites.md).

> **Synthetic data only.** Do not paste customer data, confidential code, credentials, or production telemetry into prompts, issues, or Copilot cloud agent tasks.

## What you get in the Codespace

| Afternoon | Repository | Preinstalled |
| --- | --- | --- |
| Afternoon 1 | Your **fork** of [Philess/gh-copilot-demo](https://github.com/Philess/gh-copilot-demo) | The fork's dev container: .NET, Node.js and the Copilot extensions. Copilot CLI is installed during setup with `npm install -g @github/copilot`. |
| Afternoon 2 | Your **private repository created from the [Justrebl/AI-SDLC-Workshop](https://github.com/Justrebl/AI-SDLC-Workshop) template** | The prebuilt image `ghcr.io/justrebl/ai-sdlc-workshop/devcontainer:latest`: Git, Node.js 22, .NET 10, GitHub CLI, Copilot CLI and APM CLI. `postCreateCommand` adds `gh-aw` and restores the dependencies. |

## D-7 — Organization or enterprise owner

Enterprise policies take precedence over organization policies. Details: [prerequisites, section 7](prerequisites.md#7-organization-and-enterprise-settings-admin).

**Copilot**

- [ ] A **Copilot Business or Enterprise** seat is assigned to every attendee.
- [ ] **Copilot in the CLI** is enabled.
- [ ] The **Copilot cloud agent** is enabled and allowed on the attendees' repositories.
- [ ] **Copilot code review** is enabled in the Copilot policies (Afternoon 2, Level 6).
- [ ] Optional: **GitHub Secret Protection** can be enabled on the attendees' private repositories for the push protection exercise (Afternoon 2, Level 6). Otherwise the facilitator demos it.
- [ ] Optional, extended role tracks (Afternoon 2): the MCP servers policy allows the GitHub MCP server for the Product Manager track. The PAT policy allows a fine-grained PAT for the facilitator's security delegation demo. See [prerequisites, section 7](prerequisites.md#7-organization-and-enterprise-settings-admin).
- [ ] The **models** you plan to demonstrate are enabled. Auto model selection only picks from allowed models.
- [ ] **MCP servers** are allowed in Copilot.
- [ ] **Plugins and marketplaces** allow `microsoft/hve-core` and a repository marketplace.
- [ ] **Preview features** are allowed if you plan to demonstrate them.

**Codespaces**

- [ ] Codespaces is **enabled** for the attendees on private repositories ([Enabling or disabling Codespaces for your organization](https://docs.github.com/en/codespaces/managing-codespaces-for-your-organization/enabling-or-disabling-github-codespaces-for-your-organization)).
- [ ] **No organization IP allow list** is enabled on the organization that owns the attendee repositories. With an IP allow list, codespace creation is disabled ([Managing allowed IP addresses](https://docs.github.com/en/enterprise-cloud@latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/managing-allowed-ip-addresses-for-your-organization)). If you cannot remove it, switch to the [dev container](before-d-day-devcontainer.md) or [local tools](before-d-day-local.md) setup.
- [ ] **Billing owner** chosen (organization or user) and a **spending limit** set ([About billing for GitHub Codespaces](https://docs.github.com/en/billing/managing-billing-for-your-products/about-billing-for-github-codespaces)).
- [ ] Machine-type, idle-timeout and retention policies reviewed. A 2- or 4-core machine is enough.

**Repositories, Actions and packages**

- [ ] Members can **fork public repositories** (Afternoon 1) and **create private repositories from a template** (Afternoon 2).
- [ ] **GitHub Actions** is enabled on attendee repositories, and the allowed actions include `actions/*` and `github/gh-aw-actions/*`.
- [ ] Workflows can create issues and comments (gh-aw safe outputs).
- [ ] Members can pull public images from `ghcr.io`.

**Budgets**

- [ ] Budgets reviewed for Copilot usage, Actions minutes **and Codespaces compute and storage**. Each uses a different usage unit; see [GitHub Copilot billing](https://docs.github.com/en/copilot/concepts/billing). Do not rely on prices written in workshop material.

## D-7 — Network team

Only the **attendee workstation** needs firewall rules. A codespace [reaches the public internet by default](https://docs.github.com/en/codespaces/developing-in-a-codespace/connecting-to-a-private-network), so npm, NuGet, `ghcr.io` and the APM sources need **no** allowlist entry for this setup.

| Traffic | What to allow |
| --- | --- |
| Workstation → Codespaces | The authoritative list: `gh api meta --jq '.domains.codespaces'` ([troubleshooting guide](https://docs.github.com/en/codespaces/troubleshooting/troubleshooting-your-connection-to-github-codespaces)). Today it includes `*.github.com`, `*.github.dev`, `*.visualstudio.com` (with the tunnel `global.rel.tunnels.api.visualstudio.com`), `*.vscode-webview.net`, `*.azureedge.net`, `*.msecnd.net`, `*.windows.net` and `*.microsoft.com`. |
| Workstation → GitHub and Copilot | `github.com`, plus `gh api meta --jq '.domains.website, .domains.copilot'` and the extra endpoints in the [Copilot allowlist reference](https://docs.github.com/en/copilot/reference/copilot-allowlist-reference). Copilot Chat in the codespace is reached through the browser or VS Code client. |
| Workstation → VS Code (desktop only) | `update.code.visualstudio.com`, `marketplace.visualstudio.com`, `*.gallery.vsassets.io`, `*.gallerycdn.vsassets.io` ([Network connections in VS Code](https://code.visualstudio.com/docs/setup/network)) |
| Workstation → lab content | `moaw.dev`, `microsoft.github.io`, `raw.githubusercontent.com` |

- [ ] **WebSockets** are allowed: Codespaces and Copilot Chat use long-lived connections.
- [ ] **TLS inspection** is disabled for `*.visualstudio.com`, `*.github.dev`, `*.githubcopilot.com` and `*.githubusercontent.com`. Inspection is the most common cause of a codespace that never connects.
- [ ] Proxy settings documented for attendees, if a proxy is used ([Configuring network settings for Copilot](https://docs.github.com/en/copilot/how-tos/configure-personal-settings/configure-network-settings)).

The complete endpoint table is in [prerequisites, section 6](prerequisites.md#6-network-and-firewall).

## D-7 — Every attendee

1. **Licence.** Sign in to GitHub. [github.com/settings/copilot](https://github.com/settings/copilot) shows a Business or Enterprise seat and the organization that grants it.
2. **VS Code desktop (recommended).** The browser works, but VS Code desktop is more reliable.
   - [ ] Install [VS Code](https://code.visualstudio.com/download) and the [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) and [GitHub Codespaces](https://marketplace.visualstudio.com/items?itemName=GitHub.codespaces) extensions.
   - [ ] Sign in with the **same** GitHub account that holds the Copilot seat, then send `Say hello` in the Chat view. A reply confirms the licence and the network path.
3. **Network tests**, from the network you will use on the day. Each command must return a status line, not a timeout or a certificate error. On PowerShell, use `curl.exe` and drop `| head -n 1`.

   ```bash
   curl -sI https://github.com | head -n 1
   curl -sI https://api.githubcopilot.com | head -n 1
   curl -s  https://global.rel.tunnels.api.visualstudio.com/api/version
   ```

4. **Codespace dry run.**
   - [ ] Create a codespace on any repository you own from [github.com/codespaces](https://github.com/codespaces).
   - [ ] Open it **in the browser**, then **in VS Code desktop** (**Codespaces: Connect to Codespace**).
   - [ ] In the codespace terminal, run `copilot --version` (if installed) and `gh auth status`.
   - [ ] Delete the codespace.

## D-1 — Every attendee

- [ ] **Afternoon 1:** fork [Philess/gh-copilot-demo](https://github.com/Philess/gh-copilot-demo), then **Code → Codespaces → Create codespace on main**. Wait until the `postCreateCommand` terminal reports that setup is complete.
- [ ] **Afternoon 1:** run the sample app once, as the upstream lab requires at least the front end:

  ```bash
  cd albums-api && dotnet run          # API on port 3000, Swagger at /swagger
  cd album-viewer && npm install && npm run dev   # second terminal; viewer on port 3001
  ```

  Open the forwarded port 3001 from the **Ports** view and check that albums are listed. If `copilot` is missing in this codespace, run `npm install -g @github/copilot`.
- [ ] **Afternoon 1:** in the fork, **Settings → Copilot → Cloud agent** is available (used in Level 6). If it is not, ask the organization owner (see D-7).
- [ ] **Afternoon 2:** **Use this template → Create a new repository** (private) from [Justrebl/AI-SDLC-Workshop](https://github.com/Justrebl/AI-SDLC-Workshop), then create a codespace on it. The first start pulls the prebuilt image.
- [ ] In each codespace terminal, sign in and check the tools:

  ```bash
  unset GITHUB_TOKEN               # the injected token would otherwise take precedence
  gh auth login                    # GitHub.com, HTTPS, browser
  gh auth refresh --scopes workflow   # Afternoon 2: needed to push workflow files
  gh auth setup-git
  copilot                          # then /login, complete the device flow, and /exit
  copilot --version
  apm --version                    # Afternoon 2
  gh aw version                    # Afternoon 2
  ```

- [ ] **Afternoon 2:** `dotnet test`, then `cd src/front && npm ci && npm test` pass.
- [ ] **Stop** both codespaces rather than deleting them, so they start quickly on the day. A codespace stops after 30 minutes of inactivity by default.

## If something fails

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| "Codespace creation is disabled" or the button is missing | Codespaces not enabled for you, or an organization IP allow list | Ask the organization owner (see D-7). Otherwise use the [dev container setup](before-d-day-devcontainer.md). |
| The codespace starts but VS Code never connects | Tunnel or WebSockets blocked, or TLS inspection | Run the tunnel test; open the codespace in the browser; see the [connection troubleshooting guide](https://docs.github.com/en/codespaces/troubleshooting/troubleshooting-your-connection-to-github-codespaces). |
| Copilot Chat says you have no access | Wrong account, or no seat | Check the **Accounts** menu and [github.com/settings/copilot](https://github.com/settings/copilot). |
| `git push` of `.github/workflows/*` is rejected | The codespace token lacks the `workflow` scope | `unset GITHUB_TOKEN`, then `gh auth refresh --scopes workflow` and `gh auth setup-git`. |
| Afternoon 1 viewer shows no albums | API not running on port 3000 | Start `albums-api` first, and check both ports in the **Ports** view. |
| Spending limit reached | Codespaces budget is 0 or exhausted | Ask the billing owner to raise the Codespaces budget. |
