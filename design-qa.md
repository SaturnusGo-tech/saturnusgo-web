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
