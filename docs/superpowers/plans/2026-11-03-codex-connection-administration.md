# Codex connection setup and company administration

User request: simplify the existing Codex connection settings and move seat and access management to the company administrator's console. Preserve Falcon's current ChatGPT/Linear visual vocabulary, palette, typography and existing OAuth connection behavior.

## Boundaries

- Workspace plugin settings explain how to connect the current company. They do not manage company seats, disable the employee or revoke grants.
- `/admin/?page=codex` is the company administrator's management surface. The server authorizes these commands with the tenant-scoped `workspace_admin` role.
- QA may connect to an already active employee within their current project rights. A QA manager cannot provision the company employee through initial OAuth consent.
- Existing owner-only and protocol-level OAuth revocation remain compatible; hiding workspace management controls must not make a person unable to disconnect their OAuth client.
- Do not change existing grants, roles, seat limits, secrets or customer data during development or capture.

## Presentation direction

The selected implementation direction is a scoped refinement of the existing plugin manager, not a replacement application shell.

1. Show a compact server name and URL pair with in-field copy actions.
2. Present the three meaningful steps: add the server, authenticate the saved server, start a new chat and verify the company. Keep each instruction short and use the verified Codex menu labels.
3. Place TOML, CLI, issuer/resource and raw scopes behind a secondary manual-configuration disclosure. Opening/closing it must animate and support keyboard/reduced motion.
4. Keep a single guide link and the existing plugin identity/About layout. Remove nested company/grant management from this page.
5. In administration use compact rows with person and project names, connection status, expiry, meaningful permission labels and deliberate lifecycle/revocation actions. Do not display raw project IDs as product copy.

Keeping the existing all-in-one block was rejected by the user's explicit separation request. A modal wizard would add an unnecessary navigation layer. The inline connection procedure retains the familiar plugin manager and makes advanced setup optional.

## Implementation ownership

- Root: workspace setup/manager presentation, copy, progressive disclosure and corresponding guide/screenshot refresh.
- Backend slice: administrator-only lifecycle, bounded company connection projection, audited revocation, versioned contract and authorization/concurrency tests.
- Admin client slice: administrator route/navigation, contract adapter and resource state, list/mutation UI; remove workspace/profile company management entry points.

## Verification and release

- Characterize role/tenant and state transition changes before implementation; test all new server boundaries.
- Sync generated client transport from checked OpenAPI. Keep presentation free of transport/business rules.
- Verify setup interaction, keyboard behavior, admin navigation, stale requests, retry and mutation reconciliation.
- Run architecture/type/contract checks and appropriate feature tests; run required backend quality gates and production builds.
- Inspect desktop/mobile and light/dark in one bounded browser pass, fix confirmed defects together and confirm once.
- Publish reviewed backend/client commits with existing protections. Verify normal TLS health and published assets.
- Capture actual new production screens for both guide locales without altering customer records, then export the same guide to the assistant corpus.
- If browser control remains unavailable, report the missing visual/capture verification explicitly; never manufacture screenshots.
