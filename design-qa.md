# TMS redesign — design QA

Date: 2026-08-29

## Sources and evidence

- Selected visual direction: `/Users/mercuryrucks/.codex/generated_images/01a0440e-06cc-7502-bcc3-ba6fb932d6c7/exec-d9f43ff0-27e6-4fe2-81f0-03a845d99f33.png`
- Final dashboard comparison: `design-qa-evidence/redesign-dashboard-comparison.png`
- Final drawer comparison: `design-qa-evidence/redesign-drawer-comparison.png`
- Final browser-rendered dashboard: `design-qa-evidence/redesign-final-dashboard.png`
- Final browser-rendered case drawer: `design-qa-evidence/redesign-final-case-drawer.png`
- Combined dashboard comparison: `design-qa-evidence/dashboard-drawer-comparison.png`
- Combined dense-drawer comparison after the second design pass: `design-qa-evidence/dense-drawer-comparison.png`
- Current dense test-case drawer: `design-qa-evidence/dense-drawer-implementation.png`
- Desktop dashboard: `design-qa-evidence/dashboard-desktop.png`
- Desktop test-case drawer: `design-qa-evidence/case-drawer-desktop.png`
- Desktop run drawer: `design-qa-evidence/run-drawer-desktop.png`
- Tablet dashboard: `design-qa-evidence/dashboard-tablet.png`
- Mobile dashboard: `design-qa-evidence/dashboard-mobile-390.png`
- Mobile test-case drawer: `design-qa-evidence/case-drawer-mobile-390.png`

## Viewports and states

- Desktop: 1153×648 CSS px, collapsed icon navigation, dashboard and test-case/run drawer states.
- Tablet override: requested 820×900; effective in-app viewport 738×811, collapsed icon navigation and two-column KPI ledger.
- Mobile override: requested 390×844; effective in-app viewport 351×760, bottom icon navigation, full-width dashboard and drawer.
- English and Russian catalogs compile with matching typed keys; visual QA used Russian to exercise longer labels.
- Dashboard empty state uses the real empty demo project. No synthetic history or KPI values were injected.

## Comparison findings and fixes

1. P1 layout: the KPI ledger initially shrank inside the fixed-height workspace and became unreadable. Fixed by keeping dashboard sections from flex-shrinking; the dashboard is now the scroll owner.
2. P1 layout: the demo-mode notice overlaid the dashboard primary action and stayed over content while scrolling. Moved it into a non-overlapping system strip above the stage content.
3. P1 responsiveness: the tablet KPI ledger produced an unbalanced 3+2 layout. Changed it to 2+2 plus a full-width pass-rate total below 820px.
4. P1 behavior: the run launcher still used the old large centered modal. Converted it to the same right-side drawer system as case, suite, integration, and defect creation.
5. P1 behavior: case details and suite/run panes inherited hidden overflow without a durable inner scroll owner. Added the complete min-height/flex/overflow chain for repository, list, execution, and detail panes.
6. P1 stability: an older local demo cache could omit newer collection fields and crash derived workspace state. Added fail-safe collection normalization; a fresh reload and demo re-entry now render without a new console error.
7. P0 visual mismatch from the first pass: moving the old forms into drawers preserved large wizard rails, template cards, segmented button blocks, oversized controls, and empty-state panels. Rebuilt case, run, suite, integration, and defect creation as dense data-entry surfaces instead of restyling the old card composition.
8. P1 density mismatch: the first drawer used a 460–520px clamp, 82px header, 42px controls, 82px textareas, rounded panel corners, and a native file picker. The final drawer follows the reference at 420–468px, square viewport edge, 70px header, 38px controls, 68px textareas, thin dividers, compact file rows, and a persistent 62px action bar.
9. P1 hierarchy mismatch: the case and run creation flows spread a single task over wizard screens. Both now expose the complete editable scope in one independently scrollable panel; suite mode is a normal select, integration fields are part of the form grid, and bug creation uses the calm primary action instead of an aggressive red CTA.
10. P0 execution UX: failed and blocked step taps sent empty evidence fields and received a production `400`. The mutation now supplies localized editable evidence defaults while preserving any tester-entered text.
11. P1 motion: conditional bug-report, popover, feedback, evidence, and dialog surfaces mounted abruptly. They now share restrained 160–220ms entrance motion and disable it under `prefers-reduced-motion`.
12. P1 dashboard framing: the five headline metrics were still enclosed by one rounded white panel, unlike the selected open ledger reference. Removed the enclosing surface entirely; metrics now sit on the page with only thin vertical separators.
13. P1 drawer density: the intermediate drawer still exposed too many equal-weight controls and read as a long form wall. Reworked it around Jira-like progressive disclosure: one clear title, compact section headings, a single scroll owner, restrained 6px controls, and collapsed secondary fields/evidence until requested.

## Final visual review

- Typography: one compact sans-serif hierarchy, readable Russian labels, no clipped project name at tested widths.
- Layout: the selected dense ledger/chart/table structure is preserved without generic floating card stacks or gradients.
- Surfaces: headline metrics are deliberately unboxed; only analytical regions retain restrained 8px panels. Creation drawers are square to the viewport edge, avoid nested card stacks, use 6px controls, and keep one fixed footer.
- Icons: existing Lucide family used consistently; no custom SVG or CSS-drawn asset substitutions.
- Responsiveness: no horizontal overflow at desktop, tablet, or mobile checks. KPI and chart sections reflow; mobile navigation remains usable.
- Interactions: burger collapse, drawer Escape close, focus return, bidirectional focus wrapping, body-scroll lock, drawer internal scroll, case step editing, case/suite/run selection, and dashboard page scroll were exercised in the in-app browser.
- Accessibility: semantic dialog labeling, keyboard focus containment, 44px compact targets, chart aria labels, and reduced-motion chart behavior are present.
- Console: after the final server restart and cache normalization, no new browser error was recorded during the final dashboard, case-drawer, and run-drawer checks; visible historical entries predate the fix.

## Verification

- `npm run typecheck`
- `npm run architecture:tms` — 157 files
- `npm run test:tms-auth` — 17/17
- `npm run test:tms-attachments` — 4/4
- `npm run test:tms-adapters` — 21/21
- dashboard snapshot test — 1/1
- `npm run build:standalone` — 61/61 pages generated

final result: passed
