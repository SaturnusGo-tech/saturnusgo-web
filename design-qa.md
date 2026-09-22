# Repository filters and drag QA, 2026-09-23

Approved source: the **right-hand filter panel only** in
`/Users/mercuryrucks/.codex/generated_images/01a07862-f88a-7701-bf0e-179ddf13e9b1/exec-1b529b3d-1d11-4d44-98f4-83f7eca034d2.png`.
The user explicitly excluded the new-folder redesign. Existing folder-dialog files have no diff against the published `a5daf101` source.

Evidence: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/output/falcon-filters-drag-20260923/evidence/`.
Source image and `filters-dark.png` were viewed together in the same comparison call. The source is a paired concept board; only its filter portion is relevant. Actual screenshots use native 1280 × 720 CSS px, without zoom; the layout retains Falcon's compact typography rather than scaling the whole board.

## Review result

- Layout: two columns, categories left, options right, close at top right, archive/reset below options. No nested cards or drilldown pages.
- Typography: existing Geist; 14 px panel title, 13 px navigation and options, 11–12 px secondary controls. No oversized type.
- Theme: existing Falcon tokens for graphite/light surfaces, faint edge, 16 px radius, restrained shadow, calm blue selected rows. Status/priority rings remain readable in both themes.
- Content: actual domain values replace the generated reference's fictional review status. No new statuses introduced. Existing fields and custom run filters are preserved.
- Icons: existing Lucide outline family; selected values use a separate check. Hover and selected backgrounds are independent.
- Responsive: `filters-narrow.png` verifies 390 × 600. `filters-short.png` verifies 700 × 360 with internal scrolling and reachable footer. Temporary viewport overrides were reset.
- Keyboard: vertical tab navigation, right-arrow entry into options, Escape close/focus restoration verified. Inputs and buttons retain focus indications.
- Drag: `multi-case-pickup.png` shows compact stacked preview and subdued selected source rows; `multi-case-result-dark.png` shows the destination still open after a cross-folder move.

Fixed during QA: destination could collapse when its first direct cases arrived; explicit idempotent reveal now survives data refresh. Fixed short-height popup clipping by allowing content to shrink and using full available height when neither side of the trigger has enough space.

Verdict: **PASS for approved filters and repository drag scope**. This is not a claim of exact whole-screen pixel parity: the reference also redesigned folder creation and the surrounding toolbar, which were excluded from this request.

---

# Previous: Import library and repository toolbar QA

Date: 2026-09-22. Local branch `feature/import-file-library`; no deployment.

## Source and evidence

Source visual truth:
`/Users/mercuryrucks/.codex/generated_images/01a07862-f88a-7701-bf0e-179ddf13e9b1/exec-fb7c2741-0852-443d-a3d4-399df914ac03.png`.
The 1402 × 1122 image contains a 1402 × 952 import screen and a separate toolbar
detail below it. The detail is not a footer for the import page.

Evidence directory:
`/Users/mercuryrucks/Desktop/SaturnusGo-Universe/output/falcon-import-library-20260922/`.

- Final full-view comparison: `comparison-refined-full.png`.
- Final focused toolbar comparison: `comparison-refined-toolbar.png`.
- Final implementation: `import-refined-light.png`, `import-refined-dark.png`.
- Menu: `import-final-menu.png`.
- Final repository widths: `repository-refined-compact.png`, `repository-refined-wide.png`.
- Final dark toolbar: `repository-refined-dark.png`.
- MacBook-sized verification: `import-macbook-1280.png`.

Local URL: `http://127.0.0.1:8960/?theme=light`.
The fixture mounts production components with synthetic data and mock transports.
It is not evidence of a production deployment or a live R2 upload.

## Viewport and normalization

Final native viewport: 1087 × 701 CSS px, DPR 2, visualViewport scale 1, CSS zoom 1.
CUA screenshots are already 1087 × 701 pixels. Do not halve their dimensions because
the device reports DPR 2. Source and implementation are combined without scaling
their text. The source has a larger frame, so this is a responsive composition
comparison, not an exact full-frame pixel comparison.

A temporary 1280 × 800 viewport verified the MacBook-sized layout: heading 24 px,
filename/body 13 px, no horizontal document overflow. The override was reset
immediately afterwards. The user-facing tab uses the native window size.

The user explicitly rejected oversized type after the initial mock comparison.
That instruction supersedes the enlarged typography in the image. The compact
Falcon type scale is therefore an intentional change, not a fidelity defect.

## Comparison history and fixes

1. [P1, fixed] Initial preview depended on a forced frame and enlarged typography.
   Removed the permanent viewport override and returned the page to 13 px body,
   12 px secondary text, 18 px section headings and 24 px page title. Confirmed
   native 100% scale and the same sizes at 1280 × 800. Evidence: final light image
   and MacBook-sized image.
2. [P2, fixed] Dark mode inherited an extra rectangular input background inside
   the rounded search field. Added a scoped transparent background override.
   Evidence: `import-final-native-dark.png` after the fix.
3. [P2, fixed] Narrow repository controls left too little space for search.
   The final selection control is a compact text-only button at all widths,
   following the user's subsequent rejection of the checkbox icon. Folder
   creation has a compact icon at narrow widths. Import remains a text button.
   Evidence: both refined repository captures.
4. [P1, fixed after user feedback] The repeated Back/Repository action, inactive
   Import action and large outlined toolbar buttons added unwanted visual weight.
   Removed the back action. Import is rendered only with importable input or an
   active/retryable attempt. File selection is a 32 px pill, the blue add control
   is 29 px. Import has a soft neutral fill, New folder is unboxed with a muted
   purple icon, and Select/Done has no checkbox. Entry uses 220–240 ms opacity
   and 4 px translation, disabled for reduced motion. Final source/render
   comparisons show these intentional user-requested deviations.

## Final fidelity review

- Typography: rendered system font stack matches the existing Falcon shell;
  font synthesis is disabled by the shell. Production font assets also remain
  available in the fixture. The import page does not introduce a separate family.
  Body and secondary type remain compact across the tested widths. Primary
  actions now use 12 px type, per the latest request for smaller controls.
- Layout: upload and destination remain two clear columns on desktop, followed by
  an open file list. No nested card grid. On narrow screens the composer stacks;
  the existing shell and repository resize behavior are retained.
- Color: existing Falcon light/dark tokens, blue primary actions, muted secondary
  text, red deletion action. Both themes visually inspected after the fixes.
- Assets: existing Falcon logo and Lucide icons reused; no illustrative artwork
  added. MemberAvatar uses the real member directory; synthetic fixture members
  have initials rather than the reference's generated portraits.
- Copy: project/folder labels, source filenames, dated groups, author and actions
  correspond to the chosen design. Sample timestamps and file sizes differ.
- Interaction: synthetic JSON imported successfully; source opened; copied link
  verified by pasting into a local field; source deletion left a deleted history
  entry; menu and Escape focus behavior checked. No console warnings/errors in
  the final browser inspection.
  After the last refinement, verified that the empty screen has no Import or
  Back/Repository button, choosing a valid JSON reveals Import, and Select
  toggles the selection actions. Typecheck, architecture and production build
  passed again.

## Residual verification limits

The browser automation did not receive a download event for the fixture's Blob
URL; actual downloaded bytes were not verified through that API. Real R2 upload
and download require a separate integrated staging smoke test. These are not
visual acceptance claims. Server persistence, authorization and RLS are covered
by separate real-PostgreSQL tests.

No remaining actionable P0/P1/P2 visual findings in the inspected states.

## Implementation checklist

- [x] Repository toolbar and full-page import use the selected combined design.
- [x] Compact typography rechecked at native scale and MacBook-sized viewport.
- [x] Light/dark comparison and focused toolbar evidence saved.
- [x] Temporary viewport override reset.
- [x] Local tab retained for review; no production publication.

final result: passed
