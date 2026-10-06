# Before D-Day — Local dev container setup (🥈 Option 2)

Use this checklist if your organization chose a **local dev container** (Docker or Podman) for both afternoons:

- **Afternoon 1 — GitHub Copilot Zero to Hero**
- **Afternoon 2 — AI SDLC with GitHub and GitHub Copilot**

The tools run in a container on each attendee's machine, so everyone gets the same environment as in Codespaces without needing Codespaces. The risks are the **container engine** (licence, virtualization, disk space) and **downloads through the corporate network**, so start at **D-7**.

Other setups: [GitHub Codespaces](before-d-day-codespace.md) · [local tools](before-d-day-local.md). Full reference: [prerequisites](prerequisites.md).

> **Synthetic data only.** Do not paste customer data, confidential code, credentials, or production telemetry into prompts, issues, or Copilot cloud agent tasks.

## What you get in the container

| Afternoon | Repository | Preinstalled |
| --- | --- | --- |
| Afternoon 1 | Your **fork** of [Philess/gh-copilot-demo](https://github.com/Philess/gh-copilot-demo), cloned locally | The fork's dev container: .NET, Node.js and the Copilot extensions. Copilot CLI is installed during setup with `npm install -g @github/copilot`. |
| Afternoon 2 | Your **private repository created from the [Justrebl/AI-SDLC-Workshop](https://github.com/Justrebl/AI-SDLC-Workshop) template**, cloned locally | The prebuilt image `ghcr.io/justrebl/ai-sdlc-workshop/devcontainer:latest`: Git, Node.js 22, .NET 10, GitHub CLI, Copilot CLI and APM CLI. `postCreateCommand` adds `gh-aw` and restores the dependencies. |

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

- [ ] Attendees may install and run **Docker Desktop** (check your Docker subscription terms) or **Podman**.
- [ ] Hardware virtualization and **WSL 2** (Windows) are allowed by the device-management policy.

**Repositories, Actions and packages**

- [ ] Members can **fork public repositories** (Afternoon 1) and **create private repositories from a template** (Afternoon 2).
- [ ] **GitHub Actions** is enabled on attendee repositories, and the allowed actions include `actions/*` and `github/gh-aw-actions/*`.
- [ ] Workflows can create issues and comments (gh-aw safe outputs).
- [ ] Members can pull public images from `ghcr.io`.

**Budgets**

- [ ] Budgets reviewed for Copilot usage and Actions minutes. Each uses a different usage unit; see [GitHub Copilot billing](https://docs.github.com/en/copilot/concepts/billing). This setup adds no Codespaces cost. Do not rely on prices written in workshop material.

## D-7 — Network team

Everything is downloaded from the **attendee workstation**, including from inside the container.

| Traffic | What to allow |
| --- | --- |
| GitHub and Copilot | `github.com`, plus `gh api meta --jq '.domains.website, .domains.copilot'` and the extra endpoints in the [Copilot allowlist reference](https://docs.github.com/en/copilot/reference/copilot-allowlist-reference) |
| Container images | `ghcr.io`, `*.ghcr.io`, `pkg-containers.githubusercontent.com` (`gh api meta --jq '.domains.packages'`). Add `mcr.microsoft.com` and `*.data.mcr.microsoft.com` for the Afternoon 1 dev container and for rebuilding the Afternoon 2 image. |
| Package registries (inside the container) | `registry.npmjs.org`, `api.nuget.org`, `*.nuget.org` |
| VS Code and its extensions (also installed inside the container) | `update.code.visualstudio.com`, `marketplace.visualstudio.com`, `*.gallery.vsassets.io`, `*.gallerycdn.vsassets.io`, `vscode.download.prss.microsoft.com` ([Network connections in VS Code](https://code.visualstudio.com/docs/setup/network)) |
| Container engine installers | `docker.com` and `desktop.docker.com`, or `podman.io` and its GitHub releases |
| Lab content | `moaw.dev`, `microsoft.github.io`, `raw.githubusercontent.com`, the `microsoft/hve-core` repository |

- [ ] **TLS inspection** is disabled for `*.githubcopilot.com`, `*.githubusercontent.com` and `ghcr.io`, **or** attendees know how to add the proxy root certificate **inside the container** (and set `NODE_EXTRA_CA_CERTS` for Copilot CLI).
- [ ] **WebSockets** are allowed for Copilot Chat.
- [ ] Proxy settings documented for attendees, if a proxy is used. The container engine and the container both need them ([Configuring network settings for Copilot](https://docs.github.com/en/copilot/how-tos/configure-personal-settings/configure-network-settings)).

Codespaces endpoints are **not** needed for this setup. The complete endpoint table is in [prerequisites, section 6](prerequisites.md#6-network-and-firewall).

## D-7 — Every attendee

1. **Licence.** Sign in to GitHub. [github.com/settings/copilot](https://github.com/settings/copilot) shows a Business or Enterprise seat and the organization that grants it.
2. **VS Code.**
   - [ ] Install [VS Code](https://code.visualstudio.com/download), [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) and [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).
   - [ ] Sign in with the **same** GitHub account that holds the Copilot seat, then send `Say hello` in the Chat view.
3. **Container engine.** Pick one:
   - **Docker Desktop:** [install](https://docs.docker.com/get-started/get-docker/).
   - **Podman 5 or later:** [install](https://podman.io/docs/installation), then on Windows and macOS:

     ```bash
     podman machine init
     podman machine start
     ```

     Point VS Code at Podman in your user settings ([VS Code guidance](https://code.visualstudio.com/remote/advancedcontainers/docker-options#_podman)):

     ```json
     { "dev.containers.dockerPath": "podman" }
     ```

     Optional `docker` alias for your terminal. PowerShell (`$PROFILE`): `Set-Alias -Name docker -Value podman`. bash or zsh: `alias docker=podman`. On some Linux distributions, the `podman-docker` package provides it system-wide.
4. **Machine.**
   - [ ] Windows: `wsl --status` shows WSL 2, and virtualization is enabled.
   - [ ] At least **15 GB** of free disk space.
5. **Engine and network tests.** On PowerShell, use `curl.exe` and drop `| head -n 1`.

   ```bash
   docker version                    # or: podman version
   docker run --rm hello-world
   docker pull ghcr.io/justrebl/ai-sdlc-workshop/devcontainer:latest
   curl -sI https://api.githubcopilot.com | head -n 1
   curl -sI https://registry.npmjs.org | head -n 1
   curl -sI https://api.nuget.org/v3/index.json | head -n 1
   ```

   Pulling the Afternoon 2 image now saves several minutes on the day.
6. **Dry run.** Clone any repository that has a dev container, run **Dev Containers: Reopen in Container**, and wait for the build to finish.

## D-1 — Every attendee

- [ ] **Afternoon 1:** fork [Philess/gh-copilot-demo](https://github.com/Philess/gh-copilot-demo), clone the fork, open it in VS Code, and run **Dev Containers: Reopen in Container**. This container builds from a base image with no prebuilt layer, so the first build is the slow one: do it now, not on the day.
- [ ] **Afternoon 1:** run the sample app once, as the upstream lab requires at least the front end:

  ```bash
  cd albums-api && dotnet run          # API on port 3000, Swagger at /swagger
  cd album-viewer && npm install && npm run dev   # second terminal; viewer on port 3001
  ```

  Open `http://localhost:3001` and check that albums are listed. If `copilot` is missing in this container, run `npm install -g @github/copilot`.
- [ ] **Afternoon 1:** in the fork, **Settings → Copilot → Cloud agent** is available (used in Level 6). If it is not, ask the organization owner (see D-7).
- [ ] **Afternoon 2:** **Use this template → Create a new repository** (private) from [Justrebl/AI-SDLC-Workshop](https://github.com/Justrebl/AI-SDLC-Workshop), clone it, and **Reopen in Container**.
- [ ] In each container terminal, sign in and check the tools:

  ```bash
  gh auth login                       # GitHub.com, HTTPS, browser
  gh auth refresh --scopes workflow   # Afternoon 2: needed to push workflow files
  gh auth setup-git
  copilot                             # then /login, complete the device flow, and /exit
  copilot --version
  apm --version                       # Afternoon 2
  gh aw version                       # Afternoon 2
  ```

- [ ] **Afternoon 2:** `dotnet test`, then `cd src/front && npm ci && npm test` pass.
- [ ] Leave the containers built so the first start on the day is fast.

## If something fails

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Cannot connect to the Docker daemon` | Engine or Podman VM not running | Start Docker Desktop, or `podman machine start`. |
| VS Code still calls `docker` with Podman | `dev.containers.dockerPath` not set | Set it to `podman` in **user** settings and reload the window. |
| Image pull fails with a certificate error | TLS inspection | Ask for a `ghcr.io` exclusion, or trust the proxy root certificate in the engine. |
| `npm ci` or `dotnet restore` fails inside the container | Proxy or certificate missing inside the container | Pass `HTTPS_PROXY`, and add the root certificate in the container (`NODE_EXTRA_CA_CERTS` for Node.js). |
| Build is very slow or runs out of space | Disk space or VM resources | Free at least 15 GB; give the Docker or Podman VM at least 4 GB of memory. |
| Afternoon 1 viewer shows no albums | API not running on port 3000 | Start `albums-api` first; check that ports 3000 and 3001 are forwarded. |
| Copilot Chat says you have no access | Wrong account, or no seat | Check the **Accounts** menu and [github.com/settings/copilot](https://github.com/settings/copilot). |
