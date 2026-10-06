---
name: add-api-endpoint
description: Adds a minimal API endpoint to src/api following Music Catalog conventions. Use when asked to create or extend an /api route.
---

# Add an API endpoint

1. Map the route in `src/api/Program.cs` under the `/api` prefix with `app.MapGet`, `app.MapPost` or `app.MapDelete`.
2. Keep state in memory through a singleton service registered with `builder.Services.AddSingleton`. Never add a database or file persistence.
3. Return `Results.Ok`, `Results.Created`, `Results.NotFound` or `Results.Conflict` with a JSON body; never return bare strings.
4. Add an xUnit test in `tests/api` that calls the endpoint through `WebApplicationFactory<Program>`.
5. Run `dotnet test` and confirm it passes before finishing.
