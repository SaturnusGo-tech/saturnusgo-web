# Bug reports from test cases

The shared test-case inspector now offers “Завести баг-репорт” as its fourth overflow action. The existing drawer receives the selected case's title, description, component and priority, and keeps its project even when the repository spans several projects. Creating a report preserves a direct source-case relationship, refreshes case activity, and offers a link back from the report. The action follows defect-management permissions and requires restoring an archived case first.

The API must have migration 0061 and sourceCaseId support before deploying this frontend. Case history explicitly requests includeDirect=true; old API clients retain occurrence-only history. Existing run/step defect creation is unchanged. Direct defects do not manufacture runs or retest evidence.

Validation: menu and drawer component tests, source/project isolation, source metadata submission and retry, adapter suite, TypeScript, architecture checks and production build. Backend integration tests cover persistence, idempotency, paginated history, immutable source and rejected foreign/archived sources.

Deployment status: published to production on 2026-09-21 (Asia/Almaty).

- Frontend source: `ac7d8221ae0508b5017477ee7313be0a78aa2bff`; Pages: `8be57383c23c7a7286568b71fe2c9def2d6b21ab`.
- Backend source: `ef5162d728aeb4992e65f98835fd9aa2caef50c0`.
- Cloudflare Worker: `ca4df00f-a4e7-413f-876f-e2db11e000d6`, 100% traffic; seven company domains verified.
- Railway primary: `7042766c-95a7-4936-a9fc-4837ebc50447`.
- Railway managed access: `3326fa1a-eb83-4d61-970c-c8f48225ce37`.
- Railway notifications: `330da964-b037-4ca3-9335-ce86b6313db5`.
- Migration 0061 applied after a verified database backup and a schema-compatible bridge release. The migration verified all 60 previous checksums and preserved existing defect rows.
- Both API health endpoints returned HTTP 200. Production browser smoke verified the fourth menu action, source-case label, prefilled title/description/component/priority, and loaded integration routing. The form was closed without creating a production defect; persistence was covered by PostgreSQL integration tests.
