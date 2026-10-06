# OWASP Security Assessment Report

**Date:** 2026-10-01
**Repository:** Music Catalog (workshop participant repository)
**Agent:** Security Reviewer
**Skills applied:** owasp-top-10, secure-by-design

> [!CAUTION]
> This report is AI-assisted and for assistance only. It does not replace a professional security assessment. Validate every finding with a qualified reviewer before you act on it.

> [!NOTE]
> Reference output for the Afternoon 2 Security Architect track. Written by hand to show the expected shape. The findings are illustrative. Findings marked **Verified** apply to the starter code in this repository. Findings marked **Unverified** describe issues that are common in a participant's playlist implementation; check them against your own code.

## Executive Summary

| Metric | Value |
| --- | --- |
| Findings | 5 |
| Verified | 2 |
| Unverified | 3 |
| Disproved | 1 |

| Severity | Count |
| --- | --- |
| Critical | 0 |
| High | 0 |
| Medium | 2 |
| Low | 3 |

Verification summary: two findings were confirmed in the starter configuration. Three depend on how the participant implemented the playlist endpoints. One candidate finding was disproved.

## Findings by Framework

### owasp-top-10

| ID | Title | Status | Severity | Location | Finding | Recommendation | Verdict | Justification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OWASP-01 | Host filtering disabled | FAIL | Low | `src/api/appsettings.json` | `"AllowedHosts": "*"` accepts any `Host` header. | Set the expected host names for any non-local deployment. | Verified | Value present in the starter file. Low because the API only runs locally or in a Codespace. |
| OWASP-02 | Unvalidated `trackId` route value | PARTIAL | Medium | Playlist endpoint in `src/api/Program.cs` | A typical implementation passes `trackId` to the lookup without checking format or length. | Constrain the route parameter type and return 404 for unknown ids before any other work. | Unverified | Depends on the participant's code. The PRD requires 404 for unknown ids (AC-006). |
| OWASP-03 | Unauthenticated state change | PARTIAL | Low | `POST /api/playlist/{trackId}` | Any caller can change the playlist. | Accepted for the workshop scope. Add authentication before any shared deployment. | Unverified | Out of scope per BRD CON-003. Recorded so it is not forgotten. |

### secure-by-design

| ID | Title | Status | Severity | Location | Finding | Recommendation | Verdict | Justification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SBD-01 | No rate limiting | FAIL | Medium | `src/api/Program.cs` | The API registers no rate limiter, so a client can grow the in-memory state or load the process. | Add the ASP.NET Core rate limiting middleware with a fixed window before any shared deployment. | Verified | No rate limiter is registered in the starter `Program.cs`. |
| SBD-02 | Shared mutable state without synchronisation | PARTIAL | Low | Playlist store in `src/api` | A plain `List<T>` singleton is not thread-safe under concurrent adds. | Use a lock or a concurrent collection, and keep the duplicate check and the add in one atomic step. | Unverified | Depends on the participant's store. See [ADR 0001](../planning/adrs/0001-in-memory-playlist-state.md). |

## Detailed Remediation

### SBD-01: No rate limiting

Register `AddRateLimiter` with a fixed-window policy and apply it to the `/api` group. Keep the limit generous for local use. Add an integration test that checks a 429 response after the limit.

### OWASP-02: Unvalidated `trackId`

Use a typed route constraint and look the id up in the catalog before touching the playlist. Return 404 early. The existing AC-006 test covers the behaviour.

### SBD-02: Shared mutable state

Wrap the duplicate check and the add in one lock, or use a collection with an atomic add-if-absent operation. A concurrency test is optional for the workshop.

## Disproved Findings

| ID | Title | Reason |
| --- | --- | --- |
| OWASP-X1 | Cross-site request forgery on `POST /api/playlist` | The API uses no cookies or ambient credentials, so a forged cross-site request carries no user identity. Antiforgery tokens add no value here. Revisit if cookie authentication is added. |

## Remediation Checklist

- [ ] SBD-01: add rate limiting before any shared deployment.
- [ ] OWASP-02: confirm `trackId` validation and the 404 path.
- [ ] SBD-02: confirm the playlist store is safe under concurrent requests.
- [ ] OWASP-01: restrict `AllowedHosts` outside local development.
- [ ] OWASP-03: add authentication before any shared deployment.

## Appendix: Skills Used

| Skill | Purpose |
| --- | --- |
| owasp-top-10 | Checks the code against the OWASP Top 10 web application risks. |
| secure-by-design | Checks design-level controls such as rate limiting and safe shared state. |
