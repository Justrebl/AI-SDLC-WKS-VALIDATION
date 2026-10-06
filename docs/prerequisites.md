# Prerequisites and pre-D-Day checks

This guide applies to both afternoons:

- **Afternoon 1 — GitHub Copilot Zero to Hero**
- **Afternoon 2 — AI SDLC with GitHub and GitHub Copilot**

For a shorter checklist that covers only the delivery option you chose, use [before-d-day-codespace.md](before-d-day-codespace.md), [before-d-day-devcontainer.md](before-d-day-devcontainer.md) or [before-d-day-local.md](before-d-day-local.md). This page remains the full reference.

Complete it **at least one week before the session (D-7)**. Then repeat the quick checks the day before (D-1). Items marked **Admin** need an organization or enterprise owner. Many features in Afternoon 2 are previews or depend on policy settings. Check each one in the tenant you will use on the day, because a feature that works on a personal account may be disabled in your organization.

<div class="important" data-title="Synthetic data only">

> Do not paste customer data, confidential code, credentials, or production telemetry into prompts, issues, or Copilot cloud agent tasks. Both labs use synthetic sample data only.

</div>

## 1. Choose a delivery option

Every attendee picks **one** of three options. They all lead to the same lab steps.

| | 🥇 Option 1: GitHub Codespaces | 🥈 Option 2: Local dev container | 🥉 Option 3: Local tools |
| --- | --- | --- | --- |
| What runs where | A cloud VM, reached from the browser or from VS Code | A container on your machine, run by Docker or Podman | Tools installed directly on your machine |
| What you install | Nothing (VS Code desktop is optional) | VS Code, the Dev Containers extension, Docker or Podman | VS Code and the full tool list in [section 4](#option-3-local-tools) |
| Environment | Identical for everyone; tools are preinstalled | Identical for everyone; tools are preinstalled | Depends on your machine |
| Main risk | Corporate network blocks the Codespaces tunnel | Container engine licence, virtualization, or disk space | Version drift and missing tools |
| Network needs | GitHub, Codespaces and Copilot endpoints ([section 6](#6-network-and-firewall)) | Same, plus the container registries and package registries | Same, plus the tool installers and package registries |
| Billing | Codespaces compute and storage, separate from Copilot | No extra GitHub billing | No extra GitHub billing |

**Recommendation:** use Option 1 unless your network or organization blocks Codespaces. Option 2 is the fallback for blocked Codespaces, and Option 3 is the fallback when containers are not allowed.

The repository you open depends on the afternoon:

| Afternoon | Repository | Environment it provides |
| --- | --- | --- |
| Afternoon 1 — GitHub Copilot Zero to Hero | Your **fork** of [Philess/gh-copilot-demo](https://github.com/Philess/gh-copilot-demo) | The fork's own dev container: .NET, Node.js, the Copilot extensions and the project dependencies. Copilot CLI is installed during setup with `npm install -g @github/copilot`. |
| Afternoon 2 — AI SDLC with GitHub and GitHub Copilot | Your own **private repository created from the [Justrebl/AI-SDLC-Workshop](https://github.com/Justrebl/AI-SDLC-Workshop) template** | A prebuilt image (`ghcr.io/justrebl/ai-sdlc-workshop/devcontainer:latest`) with Git, Node.js 22, .NET 10, GitHub CLI, Copilot CLI and APM CLI. `postCreateCommand` then installs the `gh-aw` extension and restores the .NET and front-end dependencies. |

## 2. Accounts, licence and sign-in (all options)

| # | Check | How to verify | Owner |
| --- | --- | --- | --- |
| 2.1 | A GitHub account you can sign in to, with two-factor authentication working | Sign in at [github.com](https://github.com) | Attendee |
| 2.2 | An active **Copilot Business or Enterprise** seat. Afternoon 1 also works with Copilot Pro or Pro+; Afternoon 2 needs organization policies, so it assumes Business or Enterprise. | [github.com/settings/copilot](https://github.com/settings/copilot) shows your plan and the organization that grants it | Admin assigns, attendee checks |
| 2.3 | You can create repositories under the account you will use (fork for Afternoon 1, template copy for Afternoon 2) | **New repository** is available on your account or in the target organization | Attendee or Admin |
| 2.4 | If your enterprise uses **Enterprise Managed Users (EMU)**, you know which account to use and whether it can fork public repositories | Ask your enterprise owner | Admin |
| 2.5 | VS Code is signed in to the **same** GitHub account that holds the Copilot seat | VS Code **Accounts** menu (bottom-left) | Attendee |

See [Copilot plans](https://docs.github.com/en/copilot/get-started/plans), [Granting access to Copilot for members of your organization](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/manage-access/grant-access) and [Setting up GitHub Copilot for yourself](https://docs.github.com/en/copilot/how-tos/set-up/set-up-for-self).

## 3. Visual Studio Code (all options)

VS Code desktop is required for Options 2 and 3. It is optional for Option 1, which also runs in the browser, but the desktop client is the most reliable experience.

1. Install the latest stable [Visual Studio Code](https://code.visualstudio.com/download).
2. Install these extensions:

   | Extension | Needed for |
   | --- | --- |
   | [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) (installs GitHub Copilot) | All options |
   | [GitHub Codespaces](https://marketplace.visualstudio.com/items?itemName=GitHub.codespaces) | Option 1 from VS Code desktop |
   | [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) | Option 2 |
   | [C# Dev Kit](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit) | Option 3 (preinstalled in the dev containers) |

3. Sign in to GitHub from the **Accounts** menu, open the Chat view, and send a short prompt such as `Say hello`. A reply confirms the licence, the sign-in and the network path to Copilot.

See [Set up GitHub Copilot in VS Code](https://code.visualstudio.com/docs/copilot/setup).

## 4. Per-option setup

### Option 1: GitHub Codespaces

1. Confirm Codespaces is enabled for you. Codespaces is always available on public repositories. For **private** repositories owned by an organization on a paid plan, an organization owner must enable it ([section 7](#7-organization-and-enterprise-settings-admin)).
2. Run the network checks in [section 6](#6-network-and-firewall), in particular the Codespaces tunnel test.
3. **Dry run:** create a Codespace on any repository you own, open it in the browser **and** in VS Code desktop, then delete it.

<div class="info" data-title="Codespaces usage">

> Codespaces usage is billed by compute and storage, separately from Copilot. Depending on organization policy, it is billed to the organization or to your personal account. See [About billing for GitHub Codespaces](https://docs.github.com/en/billing/managing-billing-for-your-products/about-billing-for-github-codespaces). Stop or delete your Codespaces after each afternoon. By default, a Codespace stops after 30 minutes of inactivity.

</div>

### Option 2: Local dev container (Docker or Podman)

1. Install a container engine:
   - **Docker Desktop** ([install](https://docs.docker.com/get-started/get-docker/)). Check that your organization's Docker Desktop licence terms allow it.
   - **Or Podman** ([install](https://podman.io/docs/installation)), version 5 or later. On Windows and macOS, create and start the Podman VM:

     ```bash
     podman machine init
     podman machine start
     ```

2. If you use Podman, point VS Code at it. The [VS Code documentation](https://code.visualstudio.com/remote/advancedcontainers/docker-options#_podman) recommends setting **Dev › Containers: Docker Path** (`dev.containers.dockerPath`) to `podman` in your user settings:

   ```json
   {
     "dev.containers.dockerPath": "podman"
   }
   ```

   If you also want `docker` commands to work in your terminal, add an alias.

   PowerShell (add to `$PROFILE`):

   ```powershell
   Set-Alias -Name docker -Value podman
   ```

   bash or zsh (add to `~/.bashrc` or `~/.zshrc`):

   ```bash
   alias docker=podman
   ```

   On some Linux distributions, the `podman-docker` package provides the same `docker` shim system-wide.

3. On Windows, enable WSL 2 and hardware virtualization, which both Docker Desktop and Podman need: run `wsl --status`.
4. Keep **at least 15 GB** of free disk space for the images and the dependency caches.
5. Verify the engine and the registry access:

   ```bash
   docker version            # or: podman version
   docker run --rm hello-world
   docker pull ghcr.io/justrebl/ai-sdlc-workshop/devcontainer:latest
   ```

   The last command downloads the Afternoon 2 image ahead of time, which saves several minutes on the day.

6. **Dry run:** clone any repository that has a dev container, run **Dev Containers: Reopen in Container**, and wait until the build finishes.

Alternative engines are not officially supported by the Dev Containers extension. See [Alternate ways to install Docker](https://code.visualstudio.com/remote/advancedcontainers/docker-options) and [Dev Containers system requirements](https://code.visualstudio.com/docs/devcontainers/containers#_system-requirements).

### Option 3: Local tools

Install the tools yourself. Afternoon 2 needs every row. Afternoon 1 needs only the rows marked **A1**.

| Tool | Version | Afternoon | Install | Check |
| --- | --- | --- | --- | --- |
| Git | 2.40 or later | A1, A2 | [git-scm.com](https://git-scm.com/downloads) | `git --version` |
| VS Code + Copilot Chat | Latest stable | A1, A2 | [Section 3](#3-visual-studio-code-all-options) | Chat replies |
| Node.js | 22 LTS | A1, A2 | [nodejs.org](https://nodejs.org/) | `node --version` |
| .NET SDK | 8.x for Afternoon 1 (`albums-api`) and 10.x for Afternoon 2; both can be installed side by side | A1, A2 | [dotnet.microsoft.com](https://dotnet.microsoft.com/download) | `dotnet --version` |
| GitHub CLI | Latest | A1, A2 | [cli.github.com](https://cli.github.com/) | `gh --version` |
| GitHub Copilot CLI | Latest | A1, A2 | `npm install -g @github/copilot` ([docs](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli)) | `copilot --version` |
| APM CLI | Latest | A2 | [APM installation](https://microsoft.github.io/apm/getting-started/installation/) | `apm --version` |
| gh-aw extension | Latest | A2 | `gh extension install github/gh-aw` | `gh aw version` |

## 5. Sign in and verify tools (all options)

Run these commands in the terminal you will use on the day: the Codespace terminal, the dev container terminal, or your local terminal. Open the terminal at your workshop repository root before starting `copilot`.

```bash
gh auth login           # choose GitHub.com, HTTPS, and sign in with the browser
gh auth status
copilot                 # then type /login, complete the device flow, and /exit
git --version
node --version
dotnet --version
gh --version
copilot --version
apm --version           # Afternoon 2 only
gh aw version           # Afternoon 2 only
```

On first start, Copilot CLI may show **Confirm folder trust**. Check that the displayed path is your workshop repository before continuing; the screenshot below shows an example started from `src/front`, but start your workshop session from the repository root.

- Choose **Yes** to trust the folder for this session.
- Choose **Yes, and remember this folder for future sessions** only if you also want to retain that trust.
- Choose **No (Esc)** if the path is unexpected or you do not trust the files.

Use the arrow keys to select an option and press **Enter** to confirm. Folder trust allows Copilot to read files there; edits and code or shell execution still require the permissions described in the prompt.

![Copilot CLI folder-trust prompt with the folder path and options to trust once, remember trust, or decline](assets/copilot-trust-folder.png)

For Afternoon 2, also confirm that your GitHub CLI credential can push workflow files. Afternoon 2 Level 5 pushes files under `.github/workflows`, which needs the `workflow` scope:

```bash
gh auth refresh --scopes workflow
gh auth setup-git
```

In a Codespace, the injected `GITHUB_TOKEN` takes precedence over your own login. Run `unset GITHUB_TOKEN` (bash) or `Remove-Item Env:GITHUB_TOKEN` (PowerShell) before these two commands.

Finally, for Afternoon 2, check that the starter application builds and its tests pass:

```bash
dotnet test
cd src/front
npm ci
npm test
```

## 6. Network and firewall

Skip this section on an unrestricted home network. On a corporate network, proxy, or VPN, share it with your network team **before D-7**.

Several network requirements are often confused. Give your network team the row that applies to each delivery option:

| Requirement | What to use |
| --- | --- |
| Workstation (corporate firewall or proxy) → Codespaces | `gh api meta --jq '.domains.codespaces'` ([troubleshooting guide](https://docs.github.com/en/codespaces/troubleshooting/troubleshooting-your-connection-to-github-codespaces)) |
| Workstation → Copilot (VS Code, Copilot CLI) | `github.com`, plus `gh api meta --jq '.domains.website, .domains.copilot'` and the extra endpoints in the [Copilot allowlist reference](https://docs.github.com/en/copilot/reference/copilot-allowlist-reference) |
| Codespace → public internet (npm, NuGet, APM docs, `ghcr.io`) | Nothing to allow: codespaces [reach the public internet by default](https://docs.github.com/en/codespaces/developing-in-a-codespace/connecting-to-a-private-network) and inbound connections are [blocked](https://docs.github.com/en/codespaces/reference/security-in-github-codespaces) |
| Codespace → private or on-premises resources | Not needed for this workshop. It would require a VPN, because codespace IP addresses are dynamic |
| GitHub organization **IP allow list** | **Incompatible with Codespaces:** codespace creation is disabled for repositories owned by an organization with IP allow lists enabled. Use Option 2 or 3, or run the lab in an organization without IP allow lists. See [Managing allowed IP addresses for your organization](https://docs.github.com/en/enterprise-cloud@latest/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/managing-allowed-ip-addresses-for-your-organization) |

### 6.1 Endpoints to allow

GitHub publishes its current domains in the [meta API](https://docs.github.com/en/rest/meta/meta#get-github-meta-information). Use it as the source of truth, because the lists below can change:

```bash
gh api meta --jq '.domains.website'
gh api meta --jq '.domains.copilot'
gh api meta --jq '.domains.codespaces'
gh api meta --jq '.domains.packages'
```

| Purpose | Domains | Needed for | Reference |
| --- | --- | --- | --- |
| GitHub web, API and Git | `github.com` (apex; `*.github.com` does not cover it), `*.github.com`, `api.github.com`, `*.githubusercontent.com`, `*.githubassets.com`, `*.github.io`, `*.github.dev` | All options | [Allowing access to GitHub's services from a restricted network](https://docs.github.com/en/get-started/using-github/allowing-access-to-githubs-services-from-a-restricted-network) |
| Copilot authentication | `github.com/login/*`, `github.com/copilot/*`, `api.github.com/user`, `api.github.com/copilot_internal/*` | All options | [Copilot allowlist reference](https://docs.github.com/en/copilot/reference/copilot-allowlist-reference) |
| Copilot service | `*.githubcopilot.com` (covers `api.githubcopilot.com` and the `*.individual.`, `*.business.` and `*.enterprise.githubcopilot.com` plan endpoints), `copilot-proxy.githubusercontent.com`, `origin-tracker.githubusercontent.com`, `copilot-reports.github.com`, `default.exp-tas.com` | All options | Same |
| Copilot telemetry | `collector.github.com`, `copilot-telemetry.githubusercontent.com` | All options | Same |
| Codespaces | `*.github.dev`, `*.visualstudio.com` (including `global.rel.tunnels.api.visualstudio.com`), `*.vscode-webview.net`, `*.azureedge.net`, `*.msecnd.net`, `*.windows.net`, `*.microsoft.com` | Option 1 (authoritative list: `.domains.codespaces`) | [Troubleshooting your connection to GitHub Codespaces](https://docs.github.com/en/codespaces/troubleshooting/troubleshooting-your-connection-to-github-codespaces) |
| VS Code | `update.code.visualstudio.com`, `marketplace.visualstudio.com`, `*.gallery.vsassets.io`, `*.gallerycdn.vsassets.io`, `vscode.download.prss.microsoft.com` | All options | [Network connections in VS Code](https://code.visualstudio.com/docs/setup/network) |
| Container images | `ghcr.io`, `*.ghcr.io`, `pkg-containers.githubusercontent.com`, `mcr.microsoft.com`, `*.data.mcr.microsoft.com` | Option 2 (`mcr.microsoft.com` only when rebuilding the image) | `gh api meta --jq '.domains.packages'` |
| Package registries | `registry.npmjs.org`, `api.nuget.org`, `*.nuget.org` | Options 2 and 3 (a codespace reaches them without any allowlist) | — |
| Lab content | `microsoft.github.io` (APM docs), `moaw.dev`, `raw.githubusercontent.com`, the `microsoft/hve-core` repository, `www.w3.org` (accessibility workflow) | All options | — |

Add these only if they apply to you:

- **Enterprise Managed Users:** `github.com/enterprises/YOUR-ENTERPRISE/*`.
- **GitHub Enterprise Cloud with data residency (GHE.com):** `SUBDOMAIN.ghe.com` and `*.SUBDOMAIN.ghe.com`.
- **Subscription-based network routing:** follow the routing guidance in the Copilot allowlist reference instead of the plan-specific `*.githubcopilot.com` entries.

### 6.2 Connectivity tests

Each command should return an HTTP status line, not a timeout or a certificate error. A `401`, `403` or `404` still proves the endpoint is reachable.

```bash
curl -sI https://github.com | head -n 1
curl -sI https://api.github.com | head -n 1
curl -sI https://api.githubcopilot.com | head -n 1
curl -s  https://global.rel.tunnels.api.visualstudio.com/api/version   # Codespaces tunnel
curl -sI https://ghcr.io/v2/ | head -n 1
curl -sI https://registry.npmjs.org | head -n 1
curl -sI https://api.nuget.org/v3/index.json | head -n 1
curl -sI https://marketplace.visualstudio.com | head -n 1
```

On Windows PowerShell, use `curl.exe` instead of `curl`, and drop the `| head -n 1` part.

### 6.3 Proxies and TLS inspection

- **Proxy:** VS Code and Copilot honour the `http.proxy` setting and the `HTTPS_PROXY` environment variable. See [Configuring network settings for GitHub Copilot](https://docs.github.com/en/copilot/how-tos/configure-personal-settings/configure-network-settings).
- **TLS inspection** commonly breaks Codespaces and Copilot. Either exclude `*.visualstudio.com`, `*.github.dev`, `*.githubcopilot.com` and `*.githubusercontent.com` from inspection, or install the proxy's root certificate on the machine **and** inside containers (set `NODE_EXTRA_CA_CERTS` for Node.js-based tools such as Copilot CLI).
- **WebSockets** must be allowed. Codespaces and Copilot Chat both rely on long-lived connections.
- **If Codespaces fails to connect from VS Code desktop**, open the Codespace from [github.com/codespaces](https://github.com/codespaces) in the browser, check [githubstatus.com](https://www.githubstatus.com/), and see the [Codespaces connection troubleshooting guide](https://docs.github.com/en/codespaces/troubleshooting/troubleshooting-your-connection-to-github-codespaces).

## 7. Organization and enterprise settings (Admin)

Enterprise policies take precedence: if an enterprise owner has set a policy, the organization cannot override it. See [GitHub Copilot policies for enterprises and organizations](https://docs.github.com/en/copilot/concepts/policies) and [Managing policies and features for Copilot in your organization](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/manage-policies).

| Area | Setting | Afternoon | Why |
| --- | --- | --- | --- |
| Copilot | Seats assigned to every attendee | A1, A2 | Required for all Copilot features |
| Copilot | Copilot in the CLI enabled | A1 (Levels 8–9), A2 | Copilot CLI is used in both afternoons |
| Copilot | **Copilot cloud agent** (formerly coding agent) enabled, and allowed on the attendees' repositories | A1 (Level 6), A2 (Levels 5 and 6) | Delegating an issue to Copilot |
| Copilot | **Copilot code review** enabled in the Copilot policies | A2 (Level 6) | Reviewing the Copilot cloud agent pull request |
| Copilot | Models policy reviewed: the models you plan to demonstrate are enabled | A1, A2 | Auto model selection only picks from models your policies allow |
| Copilot | Preview features allowed, if you plan to demonstrate preview features | A2 | Some Afternoon 2 features are previews |
| Copilot | MCP servers policy allows MCP in Copilot | A1, A2 | MCP tools in VS Code, Copilot CLI and the cloud agent |
| Copilot | Plugin and marketplace settings allow installing plugins from `microsoft/hve-core` and from a repository marketplace | A1 (Level 9), A2 (Levels 1 and 4) | HVE-Core and marketplace exercises |
| Codespaces | Codespaces enabled for the attendees on private repositories | A2 (and A1 if forks are private) | Option 1 |
| Codespaces | Organization **IP allow list** not enabled (it disables codespace creation) | A1, A2 | Option 1; otherwise use Option 2 or 3 |
| Codespaces | Billing ownership chosen (organization or user), spending limit set, and machine-type, idle-timeout and retention policies reviewed | A1, A2 | Avoid blocked Codespace creation on the day |
| Actions | GitHub Actions enabled on attendee repositories | A2 | gh-aw workflows, the CI workflow and the cloud agent setup steps |
| Actions | Allowed actions include `actions/*` and `github/gh-aw-actions/*` (or all actions) | A2 | Used by the compiled `.lock.yml` workflows and by `copilot-setup-steps.yml` |
| Actions | Workflow permissions allow the workflows to create issues and comments, or the workflow files declare them | A2 | gh-aw safe outputs |
| Repositories | Members can create private repositories and can use template repositories; forking of public repositories allowed (A1) | A1, A2 | Fork for Afternoon 1, template copy for Afternoon 2 |
| Repositories | Repository rulesets available on the attendees' private repositories, and attendees keep the admin role on their own copy | A2 (Level 5) | The branch ruleset that requires the `test` check before delegation; without it, the facilitator demos it |
| Packages | Members can pull public images from `ghcr.io` | A2 | The prebuilt dev container image |
| Code security | Optional: **GitHub Secret Protection** available for the attendees' private repositories, and repository administrators allowed to enable it and add custom patterns | A2 (Level 6) | Push protection demo; without it, the facilitator demos it |
| Extended tracks | Optional: the MCP servers policy allows the GitHub MCP server, so attendees can create issues and sub-issues with Backlog Manager | A2 (Level 2 Product Manager track) | `/backlog-execute` writes issues through the GitHub MCP server |
| Extended tracks | Optional: a **Microsoft 365 Copilot** licence and WorkIQ access for the facilitator | A2 (Level 2, Meeting Analyst demo) | Meeting Analyst reads transcripts only from Microsoft 365 |
| Extended tracks | Optional: the organization's personal access token policy allows a **fine-grained PAT** for the facilitator's sandbox repository (metadata read; actions, contents, issues and pull requests read and write) | A2 (Level 5 security delegation demo) | gh-aw `assign-to-agent` needs the `GH_AW_AGENT_TOKEN` secret; `GITHUB_TOKEN` and GitHub App tokens are rejected |
| Billing | Budgets reviewed for Copilot usage, Actions minutes and Codespaces | A1, A2 | A session with ~20 attendees for 4 hours must fit within your budgets |

**Copilot authentication in agentic workflows.** The Afternoon 2 workflows declare `permissions: copilot-requests: write`, so Copilot requests are authorized through the workflow's GitHub Actions token and billed to the organization. No personal access token is needed. If that path is not available in your tenant, gh-aw also supports a `COPILOT_GITHUB_TOKEN` repository secret holding a fine-grained personal access token whose resource owner is your **user account**, with the **Copilot Requests** account permission. See the [gh-aw authentication reference](https://github.github.com/gh-aw/reference/auth/).

## 8. Usage and billing readiness

- Each experience uses a different usage unit. Check which one applies to your tenant for VS Code, Copilot CLI, the Copilot cloud agent, Copilot code review (AI credits, plus Actions minutes on private repositories), agentic workflows (Copilot requests and Actions minutes), and Codespaces (compute and storage). GitHub Secret Protection is a separate licence. See [GitHub Copilot billing](https://docs.github.com/en/copilot/concepts/billing) and your enterprise billing settings. **Do not rely on prices written in workshop material.**
- Decide whether attendees may use Auto model selection, and which explicit models are allowed.
- **HydraFusion** is a **Research Preview**. Include it only if your tenant has access, and present it as optional.

<div class="warning" data-title="Restricted networks and APM audit">

> `apm audit --ci` replays the install to detect drift, which needs network access. On a restricted network it can be very slow. The facilitator should record one passing and one failing audit ahead of time as a fallback.

</div>

## 9. Checklists

### D-7 (one week before)

Attendee:

- [ ] I can sign in to GitHub, and [github.com/settings/copilot](https://github.com/settings/copilot) shows a Business or Enterprise seat.
- [ ] I chose a delivery option (1, 2 or 3) and installed what it needs.
- [ ] Copilot Chat in VS Code answers a prompt.
- [ ] Option 1: I created and deleted a test Codespace, and the tunnel test in section 6.2 passes.
- [ ] Option 2: `docker run --rm hello-world` (or Podman) works, and I pulled the Afternoon 2 image.
- [ ] Option 3: every command in section 5 prints a version.
- [ ] The connectivity tests in section 6.2 pass on the network I will use on the day.

Admin or facilitator:

- [ ] Copilot seats are assigned to every attendee.
- [ ] The Copilot CLI, cloud agent, models, MCP and plugin policies are set as described in section 7.
- [ ] Codespaces, Actions, allowed actions and repository creation are enabled for the attendees.
- [ ] Network team has the allowlist from section 6.1, including TLS-inspection exclusions.
- [ ] Budgets for Copilot, Actions and Codespaces are reviewed.

### D-1 (the day before)

- [ ] Afternoon 1: fork [Philess/gh-copilot-demo](https://github.com/Philess/gh-copilot-demo) and open it with your chosen option.
- [ ] Afternoon 2: create your private repository from the [Justrebl/AI-SDLC-Workshop](https://github.com/Justrebl/AI-SDLC-Workshop) template and open it with your chosen option.
- [ ] Afternoon 2: complete [Starter readiness (prerequisite)](afternoon-2/workshop.md#starter-readiness-prerequisite) once before the workshop: both test suites pass and the working tree is clean.
- [ ] Run section 5 in that environment, including `copilot` → `/login`.
- [ ] Delete or stop any test Codespaces you no longer need.
