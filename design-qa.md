# Design QA — report status and YouTrack link

- source visual truth: `.design-audit/2026-09-04-report-status-links/02-reference-draft-pill.png`
- implementation screenshot: `.design-audit/2026-09-04-report-status-links/03-local-after-dark.png`
- production linked-issue screenshot: `.design-audit/2026-09-04-report-status-links/08-production-issue-link-visible.png`
- production case-history screenshot: `.design-audit/2026-09-04-report-status-links/09-production-case-history-links.png`
- full-view comparison: `.design-audit/2026-09-04-report-status-links/05-comparison-dark-full.png`
- focused status comparison: `.design-audit/2026-09-04-report-status-links/06-comparison-status-focus.png`
- viewport: 1087 × 814 CSS px, desktop, device scale factor 1
- source pixels: 1087 × 814
- implementation pixels: 1087 × 814
- density normalization: none required; source and implementation were captured at the same viewport and density
- state: dark-theme local reference comparison plus authenticated light-theme production verification of linked defect `HOST-BUG-021` and test case `HOST-TC-6`

## Findings

- No actionable P0, P1, or P2 differences remain for the requested status treatment.
- Typography: the report status preserves the same compact weight, size, line height, and dashed-circle/icon rhythm as the Draft reference.
- Spacing and layout: the pill height, horizontal padding, icon gap, metadata alignment, and header rhythm match the reference treatment. The new task-link section occupies the existing side-rail rhythm and does not introduce an extra card surface.
- Colors and tokens: open defects now use the Draft neutral gray foreground/background/border tokens in both light and dark themes. Reopened defects retain the existing danger treatment because they represent a regression state.
- Image quality: no new raster or decorative assets are involved. Existing Falcon and Lucide assets remain sharp and unchanged.
- Copy and content: “Ссылка на задачу” is explicit and understandable; the unavailable state says that no YouTrack task has been created instead of exposing a technical null value.
- Accessibility and interaction: the YouTrack link is a semantic anchor with an external-link icon and visible keyboard focus. The status remains readable without relying on color alone because it includes the dashed-circle icon and text label.
- Production behavior: `HOST-BUG-021` renders `umbrellandroid-9` in the requested section and exposes the authoritative YouTrack URL. `HOST-TC-6` History exposes both the Falcon defect deep link and the YouTrack link with reported date and failed-step context.

## Focused comparison evidence

The combined crop in `06-comparison-status-focus.png` puts the Draft source and Open implementation in one image. Both use the same neutral fill, border, rounded geometry, dashed-circle icon, compact text scale, and metadata baseline. No focused comparison beyond the status header was needed because the task-link section is a new functional addition rather than a copied visual target.

## Comparison history

- Initial production capture: `.design-audit/2026-09-04-report-status-links/01-before-open-status.png` showed open defects using the aggressive red danger token.
- Fix: separated `open` from `reopened`, applied the established Draft neutral tokens, added `CircleDashed`, and moved the YouTrack destination into a labeled side-rail section above labels.
- Post-fix evidence: `.design-audit/2026-09-04-report-status-links/03-local-after-dark.png`, `.design-audit/2026-09-04-report-status-links/04-local-after-light.png`, and the two combined comparisons show the corrected dark and light states.
- Production verification: `.design-audit/2026-09-04-report-status-links/08-production-issue-link-visible.png` confirms the real linked issue above labels; `09-production-case-history-links.png` confirms the case-history navigation state.

## Implementation checklist

- [x] Neutral Open status in report list, report header, and report properties
- [x] Dashed-circle status icon
- [x] Explicit YouTrack issue section above labels
- [x] Empty YouTrack state without technical identifiers
- [x] Existing Falcon and YouTrack links in test-case History preserved and covered by tests
- [x] Typecheck, focused UI tests, and production build passed

final result: passed
