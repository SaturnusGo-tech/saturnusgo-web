# Falcon QA Customization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task by task. Steps use checkbox syntax.

**Goal:** Shared folder appearance, emoji composer controls and refined run review with durable case maintenance flags.
**Architecture:** Feature-owned backend commands/ports and PostgreSQL migrations; generated OpenAPI boundary; shared presentation primitives with scoped query ownership. Existing identity and run rules remain authoritative.
**Tech Stack:** Next/React/TypeScript, Phosphor, Emoji Mart, React Colorful, Fastify/PostgreSQL/private R2, bounded image decoder.
**Spec:** ../specs/2026-11-04-qa-customization-design.md

## Global Constraints

- ≤200 physical lines per handwritten TS/TSX file; ≤2 handwritten code files per directory.
- Current neutral light/dark token system and typography; 22px artwork in 26px fixed box.
- All durable state is tenant-scoped PostgreSQL with authorization, audit, ETag/idempotency.
- Never modify pinned case revisions, historical run content or execution status for maintenance feedback.
- Generated OpenAPI types; no handwritten parallel wire models. Never store signed asset URLs.
- GIF animation preserved; HEIC support requires actual fixture decode, not file accept alone.

## Review Focus

- Rapid icon/color choices or navigation must not commit stale choices into a different folder/project.
- Exact folder ownership must hold for uploaded images and deletion, including referenced/archive cases.
- Emoji insertion must preserve caret, selection, existing markdown and input undo behavior.
- A 100-record history remains bounded/paginated; case navigation cannot leak prior records.
- Maintenance flags belong to the live source case and must not change run outcomes or snapshots.

### Task 1: Run presentation refinement

**Files:** presentation/runs/header/RunExecutionHeader.tsx, presentation/runs/RunsView.tsx, runs.module.css; codex-employee/execution-history; folders/presentation/tree leaf chain.
**Produces:** Header history action, bounded existing history, calmer outcomes and optional run-only overflow title mode. No maintenance implementation in this task.
- [ ] Add behavioral tests for history trigger/focus/pagination/empty content and run-only title mode, watch expected failure.
- [ ] Move existing history feature behind icon; retain query ownership, filters, attempts, authors, stale guards and 30-record paging.
- [ ] Implement subdued semantic outcome styling and opt-in overflow marquee through SelectionTree; preserve ordinary repository.
- [ ] Run targeted run/history/navigation tests, typecheck and architecture check; report exact evidence.

### Task 2: Folder appearance and media backend

**Root:** output/falcon-codex-plugin-20261101/backend, baseline14a693c.
**Files:** test-cases folder domain/command/query/presenter/schema/ports; attachments ownership/key/auth/SQL lifecycle; new image normalization adapter/route; folder OpenAPI fragment and additive migration0078.
**Produces:** Nullable RepositoryFolder.appearance, PATCH/create/read/list; dedicated repository_folder owner, image validation/normalization and orphan cleanup. Root owns schema compatibility rollout and final generated client.
- [ ] Add failing domain/contract/persistence tests for appearance-only version update, validation, tenant scope, ETag/idempotency, immutable archive behavior and exact asset ownership/deletion races.
- [ ] Extend folder commands and durable projection, attachment owner/gateways and cleanup via narrow cross-feature ports.
- [ ] Add bounded transient normalization for accepted formats; prove HEIC conversion and GIF byte/animation preservation using real fixtures, malformed/oversized inputs and cancellation budgets.
- [ ] Add migration with scoped FKs/checks/RLS/grants; verify against real PostgreSQL and old data.
- [ ] Validate OpenAPI, typecheck, architecture, focused contract/integration/media tests; report remaining rollout requirements.

### Task 3: Maintenance backend

**Files:** new test-cases/maintenance vertical slice; live case queries/presenters; case list filter; run-item current-case maintenance projection via port; separate OpenAPI fragment/migration0079. Do not modify Task2 ownership or schema-readiness files.
**Produces:** GET/POST current-case maintenance state and filtered case listing; status current|needs_update, actor/time/optional note and validated run provenance; auditable explicit clear.
- [ ] Add failing tests for mark/clear, duplicate retry, concurrent mark/clear, source relationship, permission/tenant denial and unchanged content revision/run result.
- [ ] Implement narrow domain/application ports, transactional PostgreSQL and HTTP/presenters with bounded note and stable errors.
- [ ] Add projection/filter and additive migration, verify rollback/constraints/isolation on PostgreSQL.
- [ ] Validate OpenAPI/typecheck/architecture/focused tests; report exact API for client integration.

### Task 4: Shared picker and composer emoji insertion

**Files:** new presentation/common/emoji and shared color/catalog primitives; InitializedMarkdownEditor.tsx, ScenarioMarkdownInput.tsx, CommentAttachmentControls.tsx and remaining editable paperclip surfaces.
**Produces:** EmojiPicker({locale,onSelect}), anchored EmojiButton with stable focus/selection callbacks, local lazy native emoji data. No folder HTTP in shared UI.
- [ ] Add needed version-pinned dependencies and license metadata, lazy-load data only on open.
- [ ] Write behavioral tests for selection replacement/caret/focus and preserving markdown/undo, then implement library adapter and themed anchored popup.
- [ ] Add emoji immediately left of paperclip in editable composers; attachment-only nontext surfaces do not insert text.
- [ ] Verify keyboard/Escape/outside close, dark/light, narrow viewport and reduced motion.

### Task 5: Folder appearance frontend

**Files:** folders appearance model/state/data/presentation; shared FolderVisual; all real folder identity renderers and metadata-loss adapters; existing development preview fixture.
**Consumes:** Task2 generated contract, Task4 EmojiPicker, existing FolderResource query ownership.
- [ ] Add failing tests for serialized/coalesced autosave, failure rollback, stale navigation and shared renderer mapping.
- [ ] Implement three-tab autosave picker, folder first selected, color palette/HEX/ReactColorful, native emojis and authenticated upload/normalization.
- [ ] Thread stable folder appearance through tree/architecture/run read-only/drag/suite/path/parent/import selection surfaces. Fix broad span/svg CSS selectors rather than override selected colors.
- [ ] Verify existing folders default correctly, archive/restore and reset; update synthetic fixture only outside published routes.

### Task 6: Maintenance UI and filter

**Files:** new test-cases/maintenance model/data/state/presentation; case header and run header composition; repository filter model/presentation.
- [ ] Add failing state/API/filter tests for mark/clear, source context, latest projection and failure handling.
- [ ] Add golden star with “На доработке”, explicit clear and optional reason; run header action plus accessible explanation tooltip. Preserve outcome and revision controls.
- [ ] Add repository filter “На доработке”, persist via current filter routing conventions; thread authoritative projection into case reads and run header.
- [ ] Verify rapid case changes and retained historical execution state.

### Task 7: Combined verification and release

- [ ] Generate frontend client from combined validated OpenAPI; run typecheck, architecture, appropriate backend unit/integration/contract and frontend behavioral suites, production builds.
- [ ] Inspect local desktop/light/dark/narrow states in one batched browser pass; fix material defects once; run Impeccable detector once and independent focused review.
- [ ] Prepare schema compatibility bridge and test0077→0078→0079 with old data; include notification consumers. Do not migrate while old readiness binaries reject new schema.
- [ ] Publish checked backend/client under existing production authorization only after gates; verify exact source assets, scopes and no preview data; retain production proof.
