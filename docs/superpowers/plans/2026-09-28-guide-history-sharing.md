# Implementation plan: guide history and answer sharing

Design: `../specs/2026-09-28-guide-history-sharing.md`.

1. Add migration 0067, owner-aware RLS, scoped share access, constraints, indexes,
   provisioning support and real PostgreSQL upgrade/isolation tests.
2. Implement feature-owned chat queries, turn lifecycle and share commands behind
   narrow domain ports. Add canonical-context/evidence capture, lease/CAS,
   idempotence, current-principal authorization and safe audit metadata.
3. Document bounded DTOs, errors, cursors and accepted/text_delta/complete events
   in OpenAPI; add HTTP and lifecycle tests; regenerate the frontend contract.
4. Replace the in-memory chat owner with a server-backed controller. Implement
   history search/paging, cancellation/reconciliation, stable IDs and saved locale.
   Add private/shared Help links to both local and central URL normalization.
5. Add compact history and answer-sharing controls, read-only shared answer view,
   focused permalink targets and accessible loading/error/retry states.
6. Independently implement shared-element screenshot opening/closing with native
   dialog semantics, reversible geometry, safe fallbacks and reduced motion.
7. Update RU/EN guide content and feature documentation; regenerate the canonical
   knowledge corpus and verify images/locale/source drift.
8. Run focused lifecycle, HTTP, PostgreSQL and frontend tests, all required
   architecture/type/lint/contract/build checks; review authorization and races.
   Inspect the actual local UI, image motion, history/reload and shared links.
9. Freeze clean artifacts. Bridge all schema-sensitive services, back up and
   rehearse restore, migrate, deploy API services, publish frontend. Verify exact
   deployment hashes/schema, public assets and production behavior.

Ownership during implementation: backend agent owns feature runtime and OpenAPI;
frontend agent owns history/share/navigation UI; motion agent owns screenshot
viewer/callers; root owns SQL, migration/RLS verification, documentation and release.
No edits to case/run/domain product data are required by this feature.
