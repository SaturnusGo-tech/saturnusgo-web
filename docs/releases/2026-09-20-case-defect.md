# Bug reports from test cases

The shared test-case inspector now offers “Завести баг-репорт” as its fourth overflow action. The existing drawer receives the selected case's title, description, component and priority, and keeps its project even when the repository spans several projects. Creating a report preserves a direct source-case relationship, refreshes case activity, and offers a link back from the report. The action follows defect-management permissions and requires restoring an archived case first.

The API must have migration 0061 and sourceCaseId support before deploying this frontend. Case history explicitly requests includeDirect=true; old API clients retain occurrence-only history. Existing run/step defect creation is unchanged. Direct defects do not manufacture runs or retest evidence.

Validation: menu and drawer component tests, source/project isolation, source metadata submission and retry, adapter suite, TypeScript, architecture checks and production build. Backend integration tests cover persistence, idempotency, paginated history, immutable source and rejected foreign/archived sources.

Deployment status: source changes prepared; not published by this task.
