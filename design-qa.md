# Dashboard detail pages — design QA

final result: passed

Approved targets: «Точный список», «По прогонам», «Контекст компонента» from the three user-approved mockups (2026-09-09).

Comparison: reference and application screenshots were opened together. References use a 1488 × 1058 canvas; application was inspected at the actual 1087 × 814 browser viewport. The comparison accounts for the narrower content width and existing Falcon shell. Full visible-page captures are in `../output/falcon-dashboard-pages-20260909/`.

- Defects: full page, quiet toolbar, flat rows, component, status, priority and date. No modal, resize handles or grow/shrink transition.
- Checks: full page, compact freshness tabs, collapsible run groups, real run progress when available, direct run and execution links.
- Component: persistent component rail, case/run/defect tabs and case selection. Case title above key; optional run creation uses only selected existing IDs.
- Dark and light themes keep the existing dark global navigation and Falcon tokens.
- Desktop narrow-width table review fixed clipped right columns and excessive title truncation. Long labels truncate within their column and retain full title tooltips.
- A contrast issue inherited from the global button rule was found and fixed: record titles use the primary text token.
- Focused search input is transparent with no inner border/shadow; the enclosing shell uses the shared neutral gray focus ring.

Intentional domain adaptations: existing Falcon priority icons are retained; no fabricated last-test result or component description is shown. Component rows show the actual case lifecycle. Run progress is omitted when the authoritative run summary is unavailable. Counts are shown only when known; local filters explicitly describe their loaded-record scope when pagination exists.

Interaction checks: query filtering; facet reset; Escape restores filter-button focus; group collapse/reopen; component tabs; exact selected case IDs passed to run creation; reload restores the detail URL; back returns to the dashboard. Successful empty data renders a calm empty state. A simulated transport failure remains an explicit retryable error.

Local fixture UI was used for dense, empty and failure states; the temporary harness was removed from the shipping app and retained only with QA artifacts. No production fixture route is published. Production verification and documentation screenshots are recorded in the release report.

Open P0/P1/P2 visual issues: none at the verified desktop viewport.
