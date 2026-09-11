# Test-case discussion and shared editor QA

Date: 2026-09-11

Scope: the latest supplied editor and quotation references, Screenshot 2026-09-11 at 3.49.44 AM and 3.50.01 AM, plus the recipient strip shown at 3.37.19 AM. Earlier collapsed and inline reply editor designs are superseded.

## Visual result

- The shared Markdown editor is always open above the flat discussion. No extra reply forms below messages and no Cancel button for the shared editor.
- A single thin outline with no shadow, including focused state. Paperclip, divider, Mention and Post are inside the editor.
- A reply shows the original content below the formatting toolbar with a blue rule. A subtle strip below the editor contains the recipient/avatar and removal control. Clearing it removes the quote and strip while retaining the draft.
- Posted replies quote the parent content above their own body. Thread relationships, collapse controls, member avatars and action menus remain.
- Comments have transparent backgrounds, no card borders or radii. Existing Falcon typography and light/dark colors remain.
- Desktop and narrow-screen screenshots were compared with the user's references. No airplane badge or unsupported toolbar actions were added.

Evidence: `/tmp/falcon-comment-redesign/final-editor-dark.png`, `final-editor-light.png` (1280 × 720), and `final-editor-mobile.png` (390 × 844).

## Functional checks

- Exactly one shared textbox. No Cancel control in its idle/reply states. It remains open and clears after a successful post.
- Replying to the first or last/nested message targets the same editor. Removing the recipient retains the text. Existing parent IDs and threaded navigation are preserved.
- Computed editor-shell focus shadow: none. Document width equals viewport width at 390 px; footer controls fit without overlap.
- Isolated actual comment API and disposable PostgreSQL: posted text and two attachment references persist and render after save. Upload transport in this UI check was a local delayed fixture, not production R2. One failed upload blocked Post; retry retained the first successful file and draft. No production messages or notification events were created for QA.
- Attachment unit tests cover multiple files, failure/retry, operation-key reuse, cancellation/late responses, filename escaping, private reference round-trip and legacy text. Existing private attachment client tests cover intent/PUT/finalize, recovery and expiring access.
- Browser console showed no errors/warnings in the isolated preview.
- In-app documentation updated after the UX checks to match the always-open editor, contextual replies, attachments, mentions, notification channels, editing/deletion and sharing.

TypeScript, architecture, comment attachment, private attachment, comment link/state and documentation checks passed. Release verification is reported separately after deployment.

No unresolved P0/P1/P2 visual findings within the reviewed scope.

final result: passed

Follow-up, 2026-09-11: removed the decorative curved elbows at each nested reply, as requested in the 3.57.17 AM screenshot. Straight nesting rails and collapse/reopen behavior remain. Verified computed pseudo-element content is `none` for all nested replies and exercised collapse/reopen in the local browser. Evidence: `/tmp/falcon-comment-redesign/straight-threads-light.png`. CSS-only change; no data or reply logic changed.

## Bug-report discussions, 2026-09-11

Reused the test-case discussion controller, editor, thread renderer and private attachment controls for defects. The overview has the same always-open composer, reply quote/recipient tray, author actions, mentions and comment links. Header copy icon precedes a 30 px circular blue Play button for the existing linked run. Enter moves left to right; exit reverses it, respecting reduced motion. Removed the competing whole-page animation on defect selection.

Verified against the actual defect comment API with disposable PostgreSQL in Chrome and WebKit: create, reply through one shared editor, edit, reload, deep-link focus, close/reopen, light/dark blue-button contrast, and 390 px layout. Fixed the grid's implicit minimum width so description/editor stay within the mobile panel. No production comments or messages were sent for QA. Integration-link errors in the isolated fixture are from its intentionally absent connector routes.

Evidence: `/tmp/falcon-comment-preview/defect-webkit-1789119619035-mobile.png` and corresponding `-dark.png`; browser checks `/tmp/falcon-defect-browser.log`. Backend integration tests cover guarded deletion, concurrent versions, idempotency/pagination, reporter permissions, tenant isolation and Telegram/browser/Slack recipient routing. Frontend adapter, navigation and architecture checks passed. Public documentation now covers both discussion targets.

## Reply composer tray contour, 2026-09-11

Moved the reply recipient tray inside the shared editor frame. The editor and tray now share one outer border; the tray uses an 11px inner bottom radius inside the 12px frame. Removed the negative-margin join. No overflow clipping was introduced, so editor and mention menus remain unrestricted.

Validated actual shared bug-report composer in Chrome and WebKit, light and dark themes. Removing the recipient hides the tray and preserves the draft. Typecheck, architecture (928 files), and diff whitespace checks passed. Screenshots: `/tmp/falcon-comment-preview/reply-tray-chrome-light.png`, `/tmp/falcon-comment-preview/reply-tray-webkit-dark.png`.

## Compact Markdown scenario fields, 2026-09-11

Scenario actions now edit as one multiline string instead of splitting each newline into an independent input. The shared compact field exposes bold, inline code, fenced code, and list tools while editing; otherwise it renders Markdown with a pencil. Expected results and existing step data use the same field. Original IDs, attachment ownership, revision strings, and save transport remain unchanged. Shared-step snapshots and run execution render the same Markdown. Updated authoring documentation.

Chrome and WebKit checks on actual ScenarioStepEditor/ScenarioStepView: multiline JSON and tables, formatting a selected request, new empty case, Enter within a step, Escape, editing and saving/reloading a local fixture, light/dark themes, mobile width, no browser exceptions. Screenshots in `/tmp/falcon-step-preview/`. The fixture stores revisions locally; it does not claim a production write. Typecheck and architecture passed (932 files); 20 focused Markdown/attachment tests plus related run/documentation/scenario tests passed. Attachment upload and backend contracts were not changed.

## Transparent narrative editors, 2026-09-11

Added an opt-in plain appearance to the existing MarkdownField: transparent toolbar/content/footer, no outer box or focus shadow, rounded toolbar controls. Descriptions/preconditions can also activate through text or placeholder; pencil controls and existing section apply/cancel behavior remain available. Applied to case creation/editing and additional data, organization editor narratives, and defect creation descriptions. Defect detail renders saved description/expected Markdown. Case, organization and defect form action buttons use 12px radii. Comment composer appearance is not opted into the new variant.

Defect descriptions may contain code copied from scenario steps, so the shared rich editor now supports lightweight fenced-code editing. The sanitizer retains literal HTML/XML within fences while suppressing raw markup outside them.

Validated actual shared sections in Chrome and WebKit: text/placeholder activation, pencil, cancel restores original, apply retains draft, generic defect and organization narrative fields, code import, light/dark and mobile layout. Computed editor/toolbar backgrounds transparent, outer border 0 and shadow none in both engines. Screenshots: `/tmp/falcon-narrative-preview/chrome-dark.png`, `/tmp/falcon-narrative-preview/chrome-light.png`, `/tmp/falcon-narrative-preview/webkit-mobile.png`. Typecheck and architecture (936 files) passed; 31 focused tests passed. Backend transport is unchanged; fixture QA does not write production data.

## Structured clipboard paste in compact scenario fields, 2026-09-11

Added deterministic HTML-to-Markdown conversion with pinned Turndown 7.2.4. Browser clipboard headings, nested/ordered lists, strong text, links, preformatted payloads and tables preserve their structure in the existing action/expected/data fields. Conversion happens synchronously before saving. Plain-text-only paste and paste inside existing code stay literal. Existing attachment handling runs first. HTML remains inert, source controls/scripts are discarded and remote images are not fetched or treated as uploaded attachments. Oversized/unsupported HTML falls back to native plain text. No AI requests, backend/schema changes or rewriting of existing stored content.

Chrome and WebKit browser checks passed using actual ScenarioStepEditor/ScenarioStepView: source-like GET article, three list levels with disc/circle/square markers, exact query parameters, indented JSON, table, selection replacement, undo/redo, light/dark themes and 390px width. Save/reload used the local revision fixture, not production writes. WebKit grouped execCommand insertion with prior typing, so replaced that path with a bounded editor draft history and explicit paste transactions. Screenshots: `/tmp/falcon-step-preview/paste-chrome-dark.png`, `/tmp/falcon-step-preview/paste-webkit-light.png`, `/tmp/falcon-step-preview/paste-webkit-mobile.png`. Authoring documentation describes paste and plain-text limitations.

## Narrative edit motion and attachment hit areas, 2026-09-11

Plain narrative fields retain rendered content while the lazy Markdown editor initializes. A shared transparent transition frame then crossfades the content and animates its measured height in both directions. CSS transitions retain their final opacity rather than resetting on a Web Animations completion frame. Read/exit layers are inert, rapid close/reopen is supported, focus is applied after the editor becomes interactive, and reduced-motion preferences disable movement. Existing comment editor loading stays unchanged. The narrative attachment footer has a 1px vertical divider to the right of the paperclip. Scenario attachment text and icon now form one native button; pending uploads and saved evidence remain separate controls.

Verified actual components in Chrome and WebKit: sampled every frame for nonblank crossfade and intermediate heights; cold editor initialization, autofocus, apply/cancel/reopen, rapid toggles, light/dark themes, reduced motion, 390px overflow, file chooser opened by clicking the visible label and by Enter, and correct draft field ownership for two files. Local fixture only, no production writes/uploads. Existing Markdown, safe-code and saved-attachment checks: 19 passed; typecheck and architecture (941 files) passed. Evidence: `/tmp/falcon-narrative-preview/motion-webkit-dark.png`, `/tmp/falcon-narrative-preview/motion-chrome-light.png`, `/tmp/falcon-motion-final.log`, `/tmp/falcon-narrative-regression.log`.


# Test run organization and filters — 2026-09-12

Local implementation and production verification: passed after explicit user approval of backend, migration 0057 and frontend. Published frontend code `65bfdce6d3464dfe69238bacca007cdd8c401445`; backend code `63464a95b01224e131b3594294702cd38629e439`.

## Reference and final UI

Compared the supplied repository bulk-action reference (Screenshot 2026-09-11 at 11.56.51 PM) alongside the final light-theme capture in one visual review. The global blue bar is centered across both panels, with one row of labeled actions and the same shared repository styles. It is not constrained to the left case tree. The QA menu has full-width rows with avatars, names and emails, a thin outlined search input, rounded corners and subtle hover. It opens above its trigger using the existing measured-height transition plus opacity/translation.

Evidence:
- `/tmp/falcon-run-bulk-light-final.png`, `/tmp/falcon-run-bulk-dark-final.png`: 1280 × 800, two selected cases, assignment menu open.
- `/tmp/falcon-run-footer-desktop.png`: 1280 × 800, active run, navigation left and labeled result actions right, 52 px reserved at the right edge.
- `/tmp/falcon-run-footer-narrow.png`: 820 × 740, narrow execution pane; icon-only result/navigation controls with accessible names. The final threshold also handles the intermediate 1024 px layout.

Intentional differences from the repository reference: run-specific actions replace Create run/Status; current-run selector, state and circular lifecycle buttons remain; New run is blue with a white plus and label. The local fixture shows an open case detail and two projects, whereas the source reference shows an empty detail. Preview-only theme toggle, fixture members and missing organization avatar lookup are not shipped. No unsupported generated filters were adopted.

## Functional verification

- Global selection can span projects; selecting, filtering and grouping retain unique run item identities.
- Multiple assignees, projects and results were selected in the browser; component/type/priority/status/tag/folder OR-within and AND-across semantics are covered by unit tests. Grouping supports project, component and tags together without collisions between duplicate project names or duplicate tags.
- Click outside the filter closes it without clearing choices; Escape also closes and returns focus. No separate owner/project/result filter blocks remain.
- Assignment, priority, move to a new folder, archive, restore and removal were exercised with real presentation components and a local API fixture. The original all-actions failure was a missing organization route in this isolated fixture; that route now handles the same contract, idempotency and stale-version checks.
- Archive UI regression fixed: Include archived now passes archived cases through the selection tree and allows explicit run-only selection for Restore. Repository archive selection and dragging remain disabled. Browser archive → show archived → select → restore → remove completed without alerts.
- Real PostgreSQL HTTP/integration tests cover all organization mutations, atomic rollback on stale versions, tenant isolation under the restricted runtime role, idempotent replay, immutable case/revision/snapshot preservation and retained execution history.
- New run, start/pause and the red finish control retain their established lifecycle semantics. The footer has text at laptop widths and switches only when its available panel width is too small. At 1024 px, the initially discovered overlap was fixed and DOM bounds no longer intersect.
- Browser console: no errors in the final preview. No horizontal document overflow at checked 820/1024/1280 widths. Viewport overrides reset after testing.
- Existing floating verification action is hidden while the bulk bar is active; on desktop its expanded state is lifted above the execution footer. Production smoke with the actual verification queue confirmed this at 1280×720: the expanded verification action is above the labeled footer and does not intersect result buttons.

## Gates and limits

Frontend: 760 tests passed; typecheck and architecture (970 files) passed; export build passed. Backend: 695 tests passed against PostgreSQL; typecheck, lint, architecture, migration verification, OpenAPI and build passed. The frontend lint command remains the repository's existing no-op, not a substantive lint gate. No physical Windows/Linux/mobile browser testing performed; browser checks used Codex's in-app browser. Production smoke additionally verified persistence through the API and a read-only database audit. No physical Windows/Linux/mobile browser testing was added.


## Production follow-through

Published Pages `5ec95cb26e8b81b6603cedc07de25ee46e73d274` / Worker `a8e35760-fb3f-4e9b-9385-6def7ad0962e`. Created only one isolated QA iteration/run (`run_fc696942-b53c-4690-8302-329f68a59824`). Verified priority, move, archive/show/restore, reload persistence, removal, no-op unassignment, two assignees + two result filters and outside dismissal. Start/pause/resume, incomplete completion → stop/archive → restore passed. The empty QA run was completed at the end; no product result was marked passed/failed. Database audit confirmed original repository folder/snapshot priority and all 1,414 pre-existing snapshot digests unchanged.

Production screenshots: `/tmp/falcon-0057-production-assignees.png`, `/tmp/falcon-0057-production-multifilter.png`, `/tmp/falcon-0057-production-footer.png` (1280×720, light). Detailed deployment/recovery evidence is in backend `docs/releases/2026-09-12-run-organization.md`.

New user report after publication: execution detail and Next/Previous must follow the filtered tree; defect-create drawer needs redesign and opaque assignee popup. These subsequent fixes are not covered by the release evidence above.


# 2026-09-12 — Filtered execution and defect creation follow-up

The execution detail, counter, keyboard and previous/next actions now use the exact same filtered, deduplicated folder order as the run repository. Cross-project transitions retain confirmed item versions before navigating, so a completed case cannot reappear from an older list cache. Empty filters hide the detail and execution controls. Failed requests do not advance; pending writes and unsaved actual-result drafts block navigation. New server versions supersede cached versions. Optional preview metadata is retained when updating from a detail response.

Both defect creation entry points now use the same 680px maximum drawer, compact two-column properties, rounded thin fields, collapsible routing help, fixed footer and reduced-motion-aware entry/exit. The shared assignee picker has a solid theme background, elevated stacking, bounded list height, search and smooth appearance. File additions preserve previously selected files, deduplicate and permit reselecting a removed file.

CUA at 1280×720: Anna filter returned API-1 and HOST-1; previous crossed projects within this set; passed API-1 advanced to HOST-1. With result `not_run`, saved API-1 disappeared and stayed absent after project change; blocked HOST-1 produced an empty selection without showing any other case. Tested both defect forms, both themes, QA search/selection and Escape. No production defect or external notification was submitted for this follow-up.

Evidence: `/tmp/falcon-filter-next-project.png`, `/tmp/falcon-filter-empty.png`, `/tmp/falcon-defect-standalone-light.png`, `/tmp/falcon-defect-inline-dark.png`. Regression adapters + organization: 625 tests passed, including 10 new navigation/cache tests. Typecheck, architecture and static export are release gates. The browser fixture uses actual production components with isolated synthetic API responses; real backend writes are covered by the preceding release smoke, not this fixture. No new database migration or backend change.

## Follow-up publication and production smoke

Published source `c166d3945c5b491c03c7f326af45ae5d0391cfb8`, Pages `bfd4f1746f83e6fbf951f3f386293d5b0c70c717` and Worker `d74f781e-c839-4604-ae24-263d68e8e000` at 100%. The release script verified the exact Pages source revision and all seven Worker domain bindings. Typecheck, architecture (977 files), static export, 625 adapter/organization tests, 23 managed tests and 53 Worker tests passed. The last source change also blocks repository Refresh during a pending mutation or unsaved actual-result draft.

Read-only production verification in the authenticated Umbrella tenant: opened the redesigned defect form, loaded the actual QA member list, searched for Mercury, and closed the unsent form. The menu is opaque and elevated above the surrounding fields. In the existing paused run, selecting Mercury with no assigned cases produced an empty tree and empty detail. Selecting unassigned cases and searching `HOST-TC-40` produced exactly three cases; keyboard navigation visited HOST-TC-403 → HOST-TC-402 → HOST-TC-401 with counters 1/3, 2/3, 3/3 and stayed on 3/3 at the boundary. No lifecycle action, result mutation, defect submission or external notification was performed in this follow-up production smoke. Automatic advance after confirmed results and cross-project cache behavior were exercised in the local actual-component fixture and automated tests described above.

Production evidence: `/tmp/falcon-defect-production-menu.png`, `/tmp/falcon-filter-production-empty.png`, `/tmp/falcon-filter-production-navigation.png` (Codex in-app browser, 1280×720). Release logs: `/tmp/falcon-filter-pages-release-final.log`, `/tmp/falcon-filter-worker-release.log`. No physical Windows, Linux or mobile browser testing was performed.
