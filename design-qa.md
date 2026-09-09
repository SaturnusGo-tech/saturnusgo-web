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

Local fixture UI was used for dense, empty and failure states; the temporary harness was removed from the shipping app and retained only with QA artifacts. No production fixture route is published. Production verification found a long component rail, which now scrolls independently and brings the selected component into view. Execution counts have their own Checks tab rather than being labelled as run counts. A real failed check opened its exact run and run-item URL. Production screenshots are recorded in the release report.

The final rail search height was measured at 36 px; remaining rail space is reserved for its independently scrolling navigation.

Open P0/P1/P2 visual issues: none at the verified desktop viewport.

A production component-to-runs check exposed an unsupported launched/component query. Related component history now uses the documented completed-run basis, labels that scope explicitly, and rejects obsolete incompatible deep links before querying. The adapter regression covers named and empty components, valid empty data, and unscoped launch history.

# Test-suite catalog — 2026-09-09

Selected target: option 2, classic full-width catalog. The generated reference and final local screenshot were viewed together at 1488 × 1058. Evidence lives in `../output/falcon-suite-catalog-20260909/`.

- One catalog on entry. No automatic suite detail, split rail, inspector or resizable overlay.
- Project context, heading/count, blue create action, flat table, manual/tag composition, case count, updated date and discrete run/open icons follow the approved layout.
- Reference refinements: increased title and row typography, 74 px rows, 42 px primary/search controls, consistent column baselines. Existing Falcon navigation/header and priority/status semantics retained.
- Deliberate adaptations: mock-only overflow control omitted; dates show the real update timestamp; dynamic summary zero is not presented as resolved coverage. Exact tag scope count appears only with matching hydrated detail or in the existing run builder.
- Detail is a full page with a short metadata line, existing case-list renderer, case search, configuration and run actions. Configure waits for hydrated detail.
- Neutral focus is drawn on the search shell; inner input has transparent background and no outline/shadow. Primary text/icons verified white in light mode. Global sidebar stays dark.
- 1488 px desktop, 768 px tablet, 390 px mobile inspected. No document horizontal overflow. Secondary columns fold away at narrow widths; name/count/run/open remain visible.
- Browser interactions passed: composition filter; normalized search; clear/reset; sorting; open detail; browser back preserves filter/search and focuses prior row; sidebar returns to catalog; direct suite URL; configure existing suite; create a local test suite and see its 1-case row; run from row opens the existing builder without opening detail; error retry restores cases; genuine empty state.
- Local dense/failure test harness is not a production route. No production fixture data is created.
- Added catalog and scoped navigation tests; updated resource-loading and neutral-focus regression checks. 400 adapter tests passed. Typecheck and architecture checks passed. Documentation now describes catalog search, composition, count semantics, scope editing and launch.

Open P0/P1/P2 visual issues: none in tested states.

final result: passed

Production acceptance found one archived member counted by the summary API. Catalog counts now prefer the authoritative resolved scope for matching suite/project/type/revision; unhydrated static counts explicitly describe saved membership. Added a regression with two stored members and one runnable case. Suite detail, browser back, configured scope and run builder use existing production entities.

final result: passed

## Suite launch and workspace history — 2026-09-09

- Run drawer: inset rounded panel, neutral Falcon light/dark surfaces, compact scope summary and property rows, one fixed footer. Suite/case title supplies the default name; environment/build remain separate metadata. Current selection is shown after changing the source; an empty resolved suite is not described as still loading.
- Navigation: shared native history entries preserve framework state and exact project/entity/drill URLs. Global Back/Forward controls, popstate restoration, per-entry search/filter state and scroll restoration. Cross-project navigation uses the same restoration boundary and workspace loader.
- Browser QA with production components and isolated local data: filtered suite catalog → suite → case → linked run → Back → case → Back → same suite/search → Back → same catalog/filter → Forward. Verified suite switching updates name/count and summary after collapsing the chooser. Dark/Russian and light/English launch panels inspected.
- Local API access: direct production requests rejected by CORS; attempted read-only proxy could not establish stable local authenticated access. Temporary proxy, auth prompt and preview fixtures removed from the shipped source. Production session verification follows deployment.
- Verification: 409 adapter/domain tests pass, including 8 new navigation lifecycle cases; TypeScript and architecture checks pass. No backend schema changes. Repository lint command is an existing no-op.
- Evidence: ../output/falcon-launch-navigation-20260909/ (screenshots and retained local harness, outside production routes).
