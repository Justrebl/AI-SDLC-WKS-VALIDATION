#!/usr/bin/env bash
set -euo pipefail

# The Node feature installs Node through nvm; its binaries are not on PATH during feature builds.
if [ -d /usr/local/share/nvm/current/bin ]; then
  export PATH="/usr/local/share/nvm/current/bin:${PATH}"
fi

echo "Installing GitHub Copilot CLI (@github/copilot@${COPILOTVERSION:-latest})"
npm_config_ignore_scripts=false npm install --global "@github/copilot@${COPILOTVERSION:-latest}"
npm cache clean --force >/dev/null 2>&1 || true

echo "Installing APM CLI under /usr/local (launcher in bin, bundle in lib/apm)"
# The installer requires an explicit destination when run as root.
curl -fsSL https://aka.ms/apm-unix | sh -s -- --prefix /usr/local
# The bundle is staged in a 0700 mktemp dir; let the non-root remote user follow the launcher symlink.
chmod -R a+rX /usr/local/lib/apm

command -v copilot
command -v apm
apm --version

if [ -n "${_REMOTE_USER:-}" ] && [ "${_REMOTE_USER}" != "root" ]; then
  su "${_REMOTE_USER}" -s /bin/sh -c 'PATH=/usr/local/bin:$PATH apm --version'
fi
