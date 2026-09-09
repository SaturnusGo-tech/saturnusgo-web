# Falcon repository and organization refinement — 9 September 2026

## Scope and design decisions

The supplied portfolio/project screenshots guide the full-page layout: contextual navigation, a title and tabs, description and discussion in the main column, and quiet properties alongside. Falcon's sidebar, colors and existing test-case editor remain the navigation and editing foundations. The implemented project overview was compared with the supplied reference; the current workflow/checklist/comment capture is `organization-07-workflow-files.png`.

The repository now has two panes: one folder-and-case tree and the canonical case detail/editor. There is no duplicate case table beside the tree. An unselected repository shows an empty detail state. Opening, creating, editing and expanding a case use the same existing case components inside both the global Cases screen and the project's Cases tab.

- Soft folder icons, aligned case icons and checkboxes, 4 px row gaps and individual rounded hover/selection states keep the tree compact. Nested vertical guides and rounded branch connectors show actual ancestry. The guide button collapses its branch and returns focus to the disclosure control.
- The repository edge resizes by pointer or keyboard; double click restores 304 px. Stored width is bounded so the case pane retains room.
- Search, QL and facets filter the actual tree. Matching ancestors remain visible and expand; unrelated branches disappear. Empty folders remain visible when filters are clear.
- Archived folders use the same search and QL. Including archived cases also exposes individually archived cases in active folders. Archived cases never enter mutation selection.
- Selection survives folder and filter changes. The footer exposes Move, Create test run, Status, Priority, Unfile, Archive and Clear; only Status and Priority have menus. The global floating verification control is hidden while selection actions take priority.
- Folder creation and movement use an expandable destination hierarchy and a breadcrumb. Case leaves belong to their folders, including nested folders. Stable folder IDs distinguish an archived folder from an active folder reusing the same path.
- On narrow layouts, opening a case replaces the tree with the detail pane. Focus moves from the hidden tree into that pane and returns to the case leaf, or a visible fallback, on close. Desktop and hidden project tabs do not capture focus.
- Portfolios and projects use full-page creation/editing, understated properties and the canonical Markdown editor. Projects add a testing plan and an embedded Cases tab. Workflow phase is separate from active/archived lifecycle. Checklists, Markdown comments and private file controls use persisted organization APIs.

## Browser evidence

Actual isolated-workspace captures are retained in `.design-qa/organization-refinement/`. Documentation exports live under `public/falcon/docs/2026-09/`; the adjacent README and screenshots manifest identify the precise state shown. PNG-to-JPEG export uses quality 90 without cropping, resizing, generated UI or retouching; the local export audit records checksums.

The latest tree capture shows the light two-pane repository with no selected case. The selection capture shows two selected cases, the first case open, and all footer actions. Folder creation and move captures show the current hierarchical destination picker. The workflow capture shows a saved phase, a completed checklist item, the Markdown composer and a posted comment; it contains no attachment.

The current import documentation image shows the initial file-selection state and destination, not an import preview or success. The current archive image shows an empty archive alongside an already-open active case, not a restore operation. The legacy `organization-03-project-dialog` identifier now denotes a full-page project form.

Both themes were inspected during refinement. The light-theme primary blue button and icon had computed white foreground (`rgb(255, 255, 255)`). The project form was checked at 390 × 844, with properties stacking and document width remaining 390 px. Desktop documentation captures are 1536 × 1024.

## Functional verification

The browser checks use an isolated PostgreSQL workspace through the real production API composition. Current two-pane checks confirmed:

1. Text search and QL narrow the rendered tree, retaining the correct ancestry.
2. Empty detail, case selection, full-size detail and the existing case creator behave within the project/folder context.
3. All bulk footer actions are visible. Cross-folder selection and active/archived restrictions are covered by interaction tests.
4. Real checklist addition/completion, workflow phase change and a new project comment persisted. The project overview was reloaded and compared with the supplied reference.
5. Fresh full-page creation renders without the former undefined-checklist error. A sandbox project-quota rejection displayed an error and retained the draft until deliberate navigation; it is not counted as a successful creation.


Final browser addendum: after correcting the isolated workspace quota, the release owner successfully created **«Мобильный банк»** with a persisted description, then used its Projects → Create project flow to create **«Оплата счетов»** (`BILLS`, `project_e2226ac8695a41de94079d8ceb9737a2`). The saved project overview correctly links back to «Мобильный банк». The portfolio exposes Attach files and the canonical Markdown/status composer. Both fresh pages were verified through the rendered browser DOM without errors; this is a successful create-flow check, distinct from the earlier correctly handled quota rejection. Attachment controls being present does not establish a completed browser upload.

Earlier real API-backed checks in the same refinement remain valid:

- Created a nested folder; moved two cases between folders and back, with correct counts.
- Imported three draft cases and six folders, including an empty folder, through the native file chooser; all three cases succeeded.
- Archived and restored the imported empty folder through the UI.
- Created a portfolio and project with description/testing plan, posted a persisted project comment, and created a case through the canonical project editor. Project/folder context survived reload and Back.
- Checked full-page edit/cancel, portfolio About/Projects navigation, and repository pointer resize/reset.

Two later file-chooser attempts could not complete in the current automation runtime, so the new import screenshot documents the initial state only. They do not replace or extend the earlier completed import check.

The installed PointerSensor's 260 ms hold activation, early movement/release, single-case drag and selected batches are tested at the sensor and interaction boundaries. A held drag is not claimed as an end-to-end browser check; native immediate drag cannot establish that gesture.

Browser upload success was blocked by the isolated local storage endpoint's self-signed TLS certificate. No TLS or security bypass was used. Separately, the real API composition completed signed PUT, finalize, authorized access and byte-identical download for both project and portfolio files through a byte-preserving isolated storage adapter. This validates the API/storage flow, not browser upload completion.

## Regression and release evidence

The final frontend adapter log `/tmp/falcon-release-adapters.log` records **429 + 165 = 594 passed**, zero failed and zero skipped. The latest focused two-pane review passed **15/15** in `/tmp/falcon-two-pane-final-review.log`. Earlier independent gates passed: auth/public media **49**, attachments **7**, Worker **43**. Typecheck, architecture (**768 files**) and `git diff --check` passed. The repository's standalone lint command is a no-op and is not presented as an ESLint run.

Regression coverage includes canonical editor reuse, archive retrieval, filtered ancestry, cross-folder selection, explicit create destination, reused folder paths, mobile focus, disabled bulk actions and failed mutations. Organization coverage includes ETag conflicts, idempotent retries, navigation cancellation, fresh create forms, retained drafts during same-object refresh, refresh failures, attachment permission changes, and deletion tombstones overriding locally confirmed uploads.

Backend migration **0037** is deployed at `6d36ccb6e2d56fad89fb0203b087c7c65ce1ba6e`. Its final suite passed **596/596**, with lint, typecheck, architecture, OpenAPI, migration and build gates passing. Read-only production verification preserved all 11 protected table counts/digests, including **414 test cases**. Backup/rehearsal, deployment IDs, checksums, health observations, hosted-CI billing failure and recovery constraints are recorded in `../release-evidence/falcon-organization-workspace-2026-09-09/RELEASE.md`.

Final frontend production build/publication proof is pending at the time of this report; the release owner will append the exact artifact, deployment and smoke-check evidence after publication.
