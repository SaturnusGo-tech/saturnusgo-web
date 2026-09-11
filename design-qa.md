# Comment presentation QA

Date: 2026-09-11

Scope: test-case comment rendering and action bar. Preserve threaded replies, collapse, editing, deletion, mentions, permissions and comment links.

## Reference and implementation

User references: Screenshot 2026-09-11 at 2.53.44 AM and 2.54.06 AM. Compared the supplied reference and rendered implementation together during review.

Evidence directory: `/tmp/falcon-comment-redesign/`.

- `light-final.png`: desktop light theme, 1280 × 720.
- `light-menu-viewport.png`: desktop light theme with action menu, 1280 × 720.
- `dark.png`: desktop dark theme, 1280 × 720.
- `mobile.png`: dark theme, 390 × 844.

## Visual review

- Typography: Falcon font retained; compact author/date header; readable Markdown with consistent paragraph and list spacing.
- Spacing: avatar and content align; actions occupy a separate compact header group; small screens wrap the header without horizontal overflow.
- Colors: existing Falcon light/dark surface and text tokens; blue quotation rule; restrained rounded hover states.
- Images: existing member avatar component retained, including production employee photographs. Isolated preview identities use initials. No airplane/status badge introduced.
- Content: original comment bodies and mentions retained. No artificial reactions, task creation or other unsupported actions introduced.
- Surfaces: transparent comment background with no card radius, fill or border; existing menu styling retained. Nested branches retain their connecting rails and collapse controls.

## Comparison history

Initial review found a P2 mismatch: inherited Markdown rules muted quotation text and overrode the blue quotation rule. Scoped CSS corrected the rule, text contrast and spacing. Recaptured and reviewed desktop and mobile evidence. Author typography was scoped to the header so bold Markdown retains body sizing.

## Functional verification

- Actual frontend components against a disposable backend fixture: reply, cancel, edit, cancel editing, copy comment link, collapse and reopen.
- Mobile viewport: document width equals viewport width (390 px); action group remains within the viewport.
- Browser console: no warnings or errors observed in the isolated preview.
- TypeScript and TMS architecture checks passed (917 files).
- Existing comment-link suite: 8 passed. Existing adapter suite: 189 passed.

User correction: separate rounded comment surfaces made short discussions look like stacked cards. Removed comment fills and radii, tightened header/body spacing and the collapse-control gap. Verified transparent backgrounds and zero radius in the rendered DOM in the dark theme; reviewed light theme and collapse/reopen behavior. Updated evidence: `/tmp/falcon-comment-redesign/flat-dark.png` and `/tmp/falcon-comment-redesign/flat-light.png` (1280 × 720). Earlier rounded-surface screenshots are superseded.

No unresolved P0/P1/P2 visual findings within this scope. Production verification is recorded in the release handoff.

final result: passed
