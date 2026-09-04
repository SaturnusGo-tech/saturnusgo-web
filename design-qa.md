# Design QA — dashboard analytics explorer

- source visual truth: `/var/folders/m4/ss0ghsrd5dl5chxys5v0rgqm0000gn/T/codex-clipboard-3301dc23-f328-4ae9-9953-fbacdb2d498a.png`
- implementation screenshot: `.design-audit/2026-09-04-dashboard-drill-redesign/production-testcases-final.png`
- compact-state screenshot: `.design-audit/2026-09-04-dashboard-drill-redesign/production-compact-final.png`
- normalized source: `.design-audit/2026-09-04-dashboard-drill-redesign/reference-testcases-normalized.png`
- combined comparison: `.design-audit/2026-09-04-dashboard-drill-redesign/reference-vs-production-testcases.png`
- production URL: `https://tms.saturnusgo.com/testcases/umbrella-home/work/?projectId=project_59c48ce2121f461c8e604f35a9706aa3`
- viewport: 1087 × 814 CSS px for the final matching-state comparison; interaction geometry also verified at 1280 × 720
- state: authenticated production, light theme, `Запущено ранов` drill, test-case/run/defect tabs

## Findings

- No actionable P0, P1, or P2 visual differences remain for the requested redesign.
- The analytics drill now opens as a full-screen surface from the bottom and uses the same dense table identity as the canonical test-case listing.
- The old empty `Обзор` surface and detached blue action bar are removed. The selected entity list is the primary content, with a quiet `Перейти в раздел` action beside sorting.
- Filter semantics are preserved while each facet supports multi-select. Two component filters were selected simultaneously in production and returned the expected four test cases with a selected-count badge of `2`.
- Test cases, runs, and defects use entity-specific columns, compact semantic pills, gray identifiers, saturated priority/status colors, and restrained dividers.
- The filter rail, search field, sorting menu, list rows, and empty/loading states stay within the Falcon typography, spacing, and radius system.
- Full-screen geometry is `0 px` radius with no visible outer border. Dragging the top handle down produces a 48 px total gutter, an 8dvh height reduction, and an `18 px` animated top radius. Dragging upward restores the exact full-screen state.
- Pointer tracking continues outside the panel while dragging, so the upward return gesture completes reliably.
- Production console check returned no warnings or errors.

## Comparison history

- The supplied source showed the earlier compact technical modal, duplicate separators, a secondary overview, single-select filters, and detached navigation buttons.
- The first production comparison confirmed the full-screen information hierarchy, list density, and reduced chrome.
- Interaction QA then exposed two cascade/gesture issues: the global panel radius token overrode the adaptive radius, and the compact-to-full threshold exceeded the available top offset.
- The final production pass verified `0 px → 18 px → 0 px` radius and successful `full → compact → full` transitions.

## Verification

- [x] `npm run typecheck`
- [x] 13 focused dashboard analytics and rendering tests
- [x] `npm run build:once`
- [x] full-screen and compact drag states in production
- [x] multi-select component filters in production
- [x] test-case, run, and defect list tabs in production
- [x] no production console warnings or errors
- [x] source and implementation judged together in one normalized comparison image

final result: passed

---

# Design QA — listing priority geometry and persistent dark navigation

- source visual truth: `.design-audit/2026-09-04-listing-priority-status/01-before-new-feedback.png`
- production screenshot: `.design-audit/2026-09-04-listing-priority-status/04-production-final-1280.png`
- combined comparison: `.design-audit/2026-09-04-listing-priority-status/05-before-vs-production.png`
- production URL: `https://tms.saturnusgo.com/testcases/umbrella-home/work/?projectId=project_59c48ce2121f461c8e604f35a9706aa3`
- viewport: 1280 × 720 CSS px for the final matching-state comparison
- state: authenticated production, light theme, priority-sorted test-case listing with split detail

## Findings

- The global navigation stays dark in both application themes and uses the restrained existing cold charcoal gradient. The production computed background is `#252a36 → #282936 → #292731 → #25232c` and the foreground is `#e7e9ec`.
- Priority markers and the sort chevron share the same horizontal center (`86.8 px`) in the production table.
- The priority and case-type tracks are now distinct (`32 px` and `36 px`), giving the neutral hand/robot icon clear separation from the diamond or triangle.
- The case ID track was reduced to `90 px` while status remains a fixed `92 px`, removing the oversized visual gap before the status pill.
- The same priority/type spacing is applied to the reusable embedded case list, run navigator, and dashboard drill list.
- Priority sorting was verified in production: the first activation places `Критический` first and the reverse direction places `Низкий` first.
- No production console warnings or errors were recorded after deployment.

## Verification

- [x] `npm run test:tms-adapters` — 188/188 passed
- [x] `npm run typecheck`
- [x] `npm run build:once`
- [x] production source SHA `a78e80a6`
- [x] production Pages SHA `bd1ec046`
- [x] persistent dark navigation verified in light theme
- [x] priority/type spacing and ID/status density verified in production
- [x] priority sort direction verified in production
- [x] source and implementation judged together in one same-viewport comparison image

final result: passed
