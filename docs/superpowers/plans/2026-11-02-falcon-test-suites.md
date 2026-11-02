# Test Suites — local implementation

Scope: catalog, create/edit, detail and isolated synthetic preview data. Preserve the existing Falcon shell, neutral Integrations/Docs identity, locale support and suite/run permissions. No production publication.

- Replace the suite drawer with a route-backed page. Keep create/update contracts, ETag concurrency and idempotent retries.
- Use a compact named form, optional shared Markdown description, explicit manual/tag modes and a folder-aware case picker. Preserve selections outside the current filter and retained dynamic criteria.
- Use flat catalog rows and a readable suite detail with clear Configure and Run suite actions, search and folder context. Preserve archive, loading, error and empty states.
- Populate only the local preview API with synthetic cases, folders, suites and runs; support the actual create/edit flow without touching production.
- Verify suite route/state/API behavior, TypeScript and architecture. Inspect desktop and narrow layouts plus creation, save, dynamic preview, empty/search states and long names in one browser review pass.
