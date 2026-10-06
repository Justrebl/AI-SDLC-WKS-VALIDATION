# Music Catalog — repository instructions for GitHub Copilot

This repository is a small mono-repo used in the *Agentic SDLC with GitHub Copilot* workshop.

## Layout

- `src/api` — ASP.NET Core minimal API targeting .NET 10. Entry point: `Program.cs`. Listens on `http://localhost:5080`.
- `src/front` — React 19 + TypeScript + Vite front end. The Vite dev server proxies `/api` to the API.
- `tests/api` — xUnit integration tests using `WebApplicationFactory<Program>`.
- `src/api/Data/tracks.json` — the synthetic track catalog (read-only seed data).

## Conventions

- Keep the API as minimal API endpoints under the `/api` prefix. Return JSON with camelCase properties.
- State is kept **in memory** only. Do not add a database, file writes or external services.
- Front end: function components and hooks only, no additional state-management or UI libraries.
- Use accessible markup: semantic elements, labelled buttons, `role="alert"` or `aria-live` for status messages.
- Every behaviour change comes with tests: xUnit in `tests/api`, Vitest + Testing Library in `src/front`.

## Commands

- API: `dotnet run --project src/api` · tests: `dotnet test`
- Front: `npm install` then `npm run dev` · tests: `npm test` · build: `npm run build` (run from `src/front`)
