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
