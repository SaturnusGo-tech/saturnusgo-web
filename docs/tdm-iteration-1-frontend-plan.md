# TDM Iteration 1 — frontend integration

## Scope and prerequisites

Implement the supplied Iteration 1 spec: inline static bindings, pinned single-record datasets,
protected credential resources, step variables and per-attempt data manifests. Existing narrative
`testData` is preserved. Generated values, locks, external health, multirow execution and executor
materialization are not exposed.

Production code changes start only after the backend architecture prerequisite passes. Transport
types are generated from the checked backend OpenAPI; UI domain models are mapped at the data
boundary. Secrets never enter case drafts, resource query caches or persistent browser storage.

## Feature ownership

All new feature code lives under `app/src/modules/core-tms/test-data/`. Each handwritten TS/TSX file
stays within 200 lines; each directory contains at most two code files. Test subdirectories mirror
ownership. CSS belongs with its presentation component.

- `core/tms/contracts/test-data/`: immutable binding types shared by case revisions and TDM.
- `model/resources/`: dataset, credential, version, usage and environment presentation models.
- `application/ports/`: typed library/validation/reveal operations, without HTTP dependencies.
- `data/datasets/`, `data/credentials/`: generated DTO mapping and scoped library adapters.
- `data/execution/`: generated manifest/reveal DTO mapping and execution adapter.
- `application/catalog/`: one cancellable library query owner; pagination, search and stale responses.
- `application/editor/`: binding draft operations; validation findings from the server.
- `application/variables/`: caret token matching, insertion and draft suggestion filtering.
- `application/reveal/`: ephemeral reveal controller scoped to actor/project/resource/attempt.
- `presentation/library/`: project library with Datasets and Credentials tabs, accessible status states.
- `presentation/dataset/`: typed dataset field editor and immutable version comparison/update.
- `presentation/credential/`: metadata and protected secret-write forms.
- `presentation/bindings/`: compact case section, source picker and static form.
- `presentation/variables/`: keyboard-accessible draft variable suggestions.
- `presentation/execution/`: safe manifest and short-lived controlled reveal view.
- `composition/`: authenticated HTTP/session wiring and one configuration owner for navigation,
  library, case editor and execution panel; no transport imports in views.

## Existing seams

1. Extend generated contract then map optional `testDataBindings` in
   `test-cases/data/test-case-api.ts` and `test-case-mapper.ts`; include it in the client revision
   model and copy/restore helpers. Do not overwrite legacy `testData`.
2. Insert case Test Data after Preconditions in `CaseCreationSections.tsx` and
   `CaseInspectorContent.tsx`; pass project and draft ownership. Existing case authoring guard
   already fingerprints the whole revision and will protect the added binding data.
3. Add variables to `ScenarioMarkdownInput.tsx` through draft-aware context/props, used by action
   and expected-result editors only. Insert at the active caret, retain text and selection history.
4. Add project-scoped `test-data` view through workspace view union, navigation catalog,
   capability policy and `WorkspaceStage.tsx`. Deep links use stable IDs.
5. Insert an execution feature after Preconditions in `RunsView.tsx`. Scope to the actual run item
   and attempt, read authoritative manifest and preserve previous attempt history. The backend must
   enforce preparation atomically when an execution starts.
6. Reuse existing session reauthentication and the action-bound one-use reveal proof.
   Reveal responses are excluded from shared caches, removed on close/timeout/navigation/actor
   changes/window blur/document hiding. Unsupported sign-in verification and unavailable regional
   secret storage are reported from the server configuration without presenting working controls.

## UI requirements

Reuse Falcon typography, neutral `--falcon-*` tokens, existing Falcon-skinned HeroUI controls,
shared positioned popovers and existing modal keyboard/focus handling. Avoid blue focus outlines and square inner
outlines. Do not reintroduce popup scale/layout animation or scroll locking that causes flicker.
Use compact lines with clear labels, inline errors, skeletons, retry and permission states.

## Verification

- Application tests: caret insertion/escaping, asynchronous stale response discard, search
  cancellation, mutation conflict/reconciliation and reveal lifetime/scope cleanup.
- Component tests: section ordering, empty/permission/error/loading states, keyboard source picker,
  draft token completion and protected values without raw secret content in ordinary views.
- Contract tests: data adapters consume regenerated OpenAPI DTOs, exact decimal/integer strings
  survive round trips, credential metadata responses cannot populate secret fields.
- Integration flows: case create/revise with static/dataset/credential; pinned version update;
  execution manifest; rotate/disable while open; denied/expired step-up; old case and run.
- Run architecture check, real lint for changed code, typecheck, relevant component/application
  tests, contract generation check and production build, followed by both-theme browser inspection.

The default `npm run lint` now delegates to the real `lint:tdm` gate instead of the legacy no-op.
It verifies the complete changed TDM vertical slice, not unrelated legacy frontend modules.
`npm run lint:tdm` uses JavaScript and TypeScript recommended rules,
declared pinned dependencies and no rule suppressions. It includes the entire handwritten feature,
tests, shared binding contracts and modified integration files, excluding generated transport.
`npm run test:tms-test-data` runs the TDM regressions. Both gates are registered in the frontend CI.

## Verification checkpoint — 2026-11-14

- A production Next.js build passed at the earlier checkpoint. The final export build after the
  last form correction remains pending; interrupted build logs do not establish a completed build.
  Existing unrelated CSS `start`/`end` compatibility warnings remain in billing, product
  documentation, dashboard, profile and impact styles.
- Typecheck and architecture checks passed (2,931 handwritten source/test files checked).
- TDM/application/component/data-adapter checks passed (34 tests), plus 6 navigation model checks
  and 2 saved-attachment checks (42 combined). Default/scoped ESLint passed for 88 files with no
  errors or warnings. Final small-fix logs are `/tmp/falcon-tdm-client-final-fixes-*.log`.
- Full navigation regression suite passed (71 tests); existing case/scenario/run regression
  suites passed (40 tests). Independent reviewer ran 18 focused integration regressions.
- Actual frontend adapters exercised the isolated HTTP server backed by PostgreSQL: 17 checks
  passed, including exact decimal round trips, immutable environment versions, case revision,
  usage, archive/restore, unchanged execution manifest, masked credential metadata, and retained
  archived dataset pins validated against the stored case revision.
- Canonical OpenAPI and copied source are semantically identical; regeneration from the current
  canonical source reproduces the generated transport byte for byte (SHA-256
  `605d44650217a12be6a32e567f92e9857ce0adc96f05805fe49c4ebcb9c08d7c`). JSON whitespace and
  Unicode escape formatting are not treated as a contract change.
- Browser checks by the coordinating agent confirmed the dark English and light Russian library,
  rounded dataset forms, source-selection round trip, pinned v1 and environment/lifecycle summaries,
  dirty-form Escape/keep-editing/discard flow, protected credential metadata and execution panel,
  and the honest unsupported-reveal state. The actual UI created a dataset preserving Decimal
  `0.0100` and saved/reloaded an empty String binding. Keyboard completion inserted
  `{{admin.password}}` without revealing a value. Screenshot evidence is saved as
  `/tmp/falcon-tdm-library-dark.png`, `/tmp/falcon-tdm-library-light.png`,
  `/tmp/falcon-tdm-dataset-light.png`, `/tmp/falcon-tdm-credential-light.png` and
  `/tmp/falcon-tdm-execution-light.png`.
  The external local preview uses actual production components and the isolated HTTP backend.
  It is outside the product source tree and is not a production route or adapter fallback.
- The HTTP preview intentionally has no live regional KMS/managed identity. It proves masked
  metadata and fail-closed availability, not live production secret creation or reveal.
- Electron and physical-device testing, production deployment, and a managed Reveal GUI session
  were not performed by this frontend workstream.
- Nested forms and Escape are isolated at the portal boundary. Async validation freezes the
  submitted static draft; retained archived pins include the actual stored case revision; rich
  scenario steps are mapped to the strict validation DTO. Read-only viewers do not make a forbidden
  binding-validation request. Configuration invalidates immediately on actor or project changes.
- Execution manifests and preflight results are bound to the exact actor/project/run/item/attempt
  owner before rendering, rather than waiting for an effect to clear the previous state. Tests
  capture every commit and reject both first-frame stale data and late replies. The execution
  panel includes preparation time and compact immutable version identifiers. Credential rotation
  and disablement produce allowlisted guidance to start a new attempt; the old reveal form cannot
  silently retry against another version.
- Protecting an existing Email field switches its type to String without losing the input text;
  protected fields cannot select unsupported types. The component regression was observed failing
  before the correction and passing afterward. The legacy saved-step attachment test loader now
  isolates the newly integrated data-findings component without weakening attachment assertions.
