FROM mcr.microsoft.com/devcontainers/dotnet:1-10.0

# Links the GHCR package to the publishing repository (set by .github/workflows/devcontainer-image.yml).
ARG IMAGE_SOURCE=""
LABEL org.opencontainers.image.source="${IMAGE_SOURCE}" \
      org.opencontainers.image.description="Toolchain image for the Agentic SDLC with GitHub Copilot workshop"

# The upstream image currently contains an expired Yarn APT signing key.
# Yarn is not needed by this workshop, and the stale source breaks feature installation.
RUN rm -f /etc/apt/sources.list.d/yarn.list /etc/apt/sources.list.d/yarn.list.save
