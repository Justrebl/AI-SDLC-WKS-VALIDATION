# Before D-Day — Local tools setup (🥉 Option 3)

Use this checklist if your organization chose to **install the tools directly** on attendee machines, without Codespaces or containers:

- **Afternoon 1 — GitHub Copilot Zero to Hero**
- **Afternoon 2 — AI SDLC with GitHub and GitHub Copilot**

This is the fallback when neither Codespaces nor containers are allowed. Every attendee must install and verify the same tool versions, so start at **D-7** and allow time for software requests to your IT team.

Other setups: [GitHub Codespaces](before-d-day-codespace.md) · [local dev container](before-d-day-devcontainer.md). Full reference: [prerequisites](prerequisites.md).

> **Synthetic data only.** Do not paste customer data, confidential code, credentials, or production telemetry into prompts, issues, or Copilot cloud agent tasks.

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

**Workstations**

- [ ] Attendees can install the tools below, or IT has packaged them. Global `npm install -g` and `gh extension install` must be allowed.

**Repositories and Actions**

- [ ] Members can **fork public repositories** (Afternoon 1) and **create private repositories from a template** (Afternoon 2).
- [ ] **GitHub Actions** is enabled on attendee repositories, and the allowed actions include `actions/*` and `github/gh-aw-actions/*`.
- [ ] Workflows can create issues and comments (gh-aw safe outputs).

**Budgets**

- [ ] Budgets reviewed for Copilot usage and Actions minutes. Each uses a different usage unit; see [GitHub Copilot billing](https://docs.github.com/en/copilot/concepts/billing). This setup adds no Codespaces cost. Do not rely on prices written in workshop material.

## D-7 — Network team

| Traffic | What to allow |
| --- | --- |
| GitHub and Copilot | `github.com`, plus `gh api meta --jq '.domains.website, .domains.copilot'` and the extra endpoints in the [Copilot allowlist reference](https://docs.github.com/en/copilot/reference/copilot-allowlist-reference) |
| Package registries | `registry.npmjs.org` (also serves Copilot CLI), `api.nuget.org`, `*.nuget.org` |
| VS Code and its extensions | `update.code.visualstudio.com`, `marketplace.visualstudio.com`, `*.gallery.vsassets.io`, `*.gallerycdn.vsassets.io`, `vscode.download.prss.microsoft.com` ([Network connections in VS Code](https://code.visualstudio.com/docs/setup/network)) |
| Tool installers | The download sites of Git, Node.js, the .NET SDK, GitHub CLI and APM (see the table below). gh-aw installs from `github.com`. |
| Lab content | `moaw.dev`, `microsoft.github.io`, `raw.githubusercontent.com`, the `microsoft/hve-core` repository |

- [ ] **TLS inspection** is disabled for `*.githubcopilot.com` and `*.githubusercontent.com`, **or** the proxy root certificate is trusted by the OS, Git, npm and .NET, and `NODE_EXTRA_CA_CERTS` is set for Copilot CLI.
- [ ] **WebSockets** are allowed for Copilot Chat.
- [ ] Proxy settings documented for attendees, if a proxy is used ([Configuring network settings for Copilot](https://docs.github.com/en/copilot/how-tos/configure-personal-settings/configure-network-settings)).

Codespaces and container registry endpoints are **not** needed for this setup. The complete endpoint table is in [prerequisites, section 6](prerequisites.md#6-network-and-firewall).

## D-7 — Every attendee

1. **Licence.** Sign in to GitHub. [github.com/settings/copilot](https://github.com/settings/copilot) shows a Business or Enterprise seat and the organization that grants it.
2. **VS Code.**
   - [ ] Install [VS Code](https://code.visualstudio.com/download), [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) and [C# Dev Kit](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit).
   - [ ] Sign in with the **same** GitHub account that holds the Copilot seat, then send `Say hello` in the Chat view.
3. **Tools.** Afternoon 2 needs every row. Afternoon 1 needs only the rows marked **A1**.

   | Tool | Version | Afternoon | Install | Check |
   | --- | --- | --- | --- | --- |
   | Git | 2.40 or later | A1, A2 | [git-scm.com](https://git-scm.com/downloads) | `git --version` |
   | Node.js | 22 LTS | A1, A2 | [nodejs.org](https://nodejs.org/) | `node --version` |
   | .NET SDK | 8.x for Afternoon 1 (`albums-api`) and 10.x for Afternoon 2; both can be installed side by side | A1, A2 | [dotnet.microsoft.com](https://dotnet.microsoft.com/download) | `dotnet --version` |
   | GitHub CLI | Latest | A1, A2 | [cli.github.com](https://cli.github.com/) | `gh --version` |
   | GitHub Copilot CLI | Latest | A1, A2 | `npm install -g @github/copilot` ([docs](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli)) | `copilot --version` |
   | APM CLI | Latest | A2 | [APM installation](https://microsoft.github.io/apm/getting-started/installation/) | `apm --version` |
   | gh-aw extension | Latest | A2 | `gh extension install github/gh-aw` | `gh aw version` |

4. **Sign in.**

   ```bash
   gh auth login                       # GitHub.com, HTTPS, browser
   gh auth refresh --scopes workflow   # Afternoon 2: needed to push workflow files
   gh auth setup-git
   copilot                             # then /login, complete the device flow, and /exit
   ```

5. **Network tests.** On PowerShell, use `curl.exe` and drop `| head -n 1`.

   ```bash
   curl -sI https://api.githubcopilot.com | head -n 1
   curl -sI https://registry.npmjs.org | head -n 1
   curl -sI https://api.nuget.org/v3/index.json | head -n 1
   ```

## D-1 — Every attendee

- [ ] **Afternoon 1:** fork [Philess/gh-copilot-demo](https://github.com/Philess/gh-copilot-demo), clone the fork, open it in VS Code, and run the sample app once (the upstream lab requires at least the front end):

  ```bash
  cd albums-api && dotnet run          # API on port 3000, Swagger at /swagger
  cd album-viewer && npm install && npm run dev   # second terminal; viewer on port 3001
  ```

  Open `http://localhost:3001` and check that albums are listed.
- [ ] **Afternoon 1:** in the fork, **Settings → Copilot → Cloud agent** is available (used in Level 6). If it is not, ask the organization owner (see D-7).
- [ ] **Afternoon 2:** **Use this template → Create a new repository** (private) from [Justrebl/AI-SDLC-Workshop](https://github.com/Justrebl/AI-SDLC-Workshop), clone it, and run:

  ```bash
  dotnet test
  cd src/front
  npm ci
  npm test
  ```

- [ ] Every command in step 3 of D-7 still prints a version.
- [ ] `gh auth status` shows the `workflow` scope (Afternoon 2).

## If something fails

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `copilot: command not found` | npm global folder not on `PATH` | Add the folder from `npm prefix -g` (Windows) or `$(npm prefix -g)/bin` to `PATH`, then open a new terminal. |
| `dotnet test` fails to restore | Wrong SDK or NuGet blocked | `dotnet --list-sdks` must show 10.x; test `api.nuget.org`. |
| `albums-api` fails with "framework not found" | .NET 8 SDK or runtime missing | Install the .NET 8 SDK next to .NET 10; `dotnet --list-sdks` must show both. |
| Afternoon 1 viewer shows no albums, or a port is busy | API not running on 3000, or 3000/3001 already in use | Start `albums-api` first; stop whatever uses ports 3000 or 3001. |
| `npm ci` fails with `UNABLE_TO_GET_ISSUER_CERT` | TLS inspection | Set `NODE_EXTRA_CA_CERTS` to the proxy root certificate, or ask for an exclusion. |
| `gh extension install github/gh-aw` fails | GitHub CLI not signed in, or `github.com` downloads blocked | `gh auth status`; check access to GitHub release assets. |
| `git push` of `.github/workflows/*` is rejected | Missing `workflow` scope | `gh auth refresh --scopes workflow`, then `gh auth setup-git`. |
| Copilot Chat says you have no access | Wrong account, or no seat | Check the **Accounts** menu and [github.com/settings/copilot](https://github.com/settings/copilot). |
