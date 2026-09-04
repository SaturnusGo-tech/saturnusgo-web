# TMS redesign — design QA

Date: 2026-08-29

## Sources and evidence

- Selected visual direction: ImageGen session asset `exec-d9f43ff0-27e6-4fe2-81f0-03a845d99f33.png`.
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
- Final production integrations: `design-qa-evidence/workbench-final-integrations.png`
- Final production suites: `design-qa-evidence/workbench-final-suites.png`
- Final production test-case detail: `design-qa-evidence/workbench-final-cases.png`
- Final production run execution: `design-qa-evidence/workbench-final-runs.png`
- Combined before/after evidence: `design-qa-evidence/comparisons/{integrations,suites,cases,runs}-before-after.png`
- Final production v3 test-case workbench: `design-qa-evidence/workbench-v3-cases.png`
- Final production v3 integrations workbench: `design-qa-evidence/workbench-v3-integrations.png`
- Final production v3 suites workbench: `design-qa-evidence/workbench-v3-suites.png`
- Final production v3 run workbench: `design-qa-evidence/workbench-v3-runs.png`
- Final same-route before/after comparisons: `design-qa-evidence/workbench-v3-comparisons/{cases,integrations,suites,runs}-before-after.png`

## Viewports and states

- Desktop: 1153×648 CSS px, collapsed icon navigation, dashboard and test-case/run drawer states.
- Tablet override: requested 820×900; effective in-app viewport 738×811, collapsed icon navigation and two-column KPI ledger.
- Mobile override: requested 390×844; effective in-app viewport 351×760, bottom icon navigation, full-width dashboard and drawer.
- English and Russian catalogs compile with matching typed keys; visual QA used Russian to exercise longer labels.
- Dashboard empty state uses the real empty demo project. No synthetic history or KPI values were injected.
- Final production verification used the signed-in `Umbrella-mobile` workspace at an effective in-app browser viewport of 812×814 CSS px and device pixel ratio 2. The supplied desktop captures are wider, so they were aspect-preserved and centered on an 812×814 comparison canvas rather than stretched; the comparison is intentionally limited to hierarchy, surface density, and responsive behavior.

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
14. P1 integration hierarchy: the overview counter strip repeated information before the actual contracts workspace and created the exact extra upper block called out in the supplied screenshot. Removed the entire strip; heading, search, empty state, and primary action now form one open workspace.
15. P1 suite composition: the suite screen used a boxed scope banner, a full-size duplicate create button, and a fully bordered table. Replaced them with a compact list action, an open ruled scope line, and a row-led table without an enclosing card or vertical cell grid.
16. P1 test-case detail: the decorative type tile, boxed four-column metadata surface, and rounded steps container competed with the case content. Removed the tile and container chrome; metadata is now a quiet fact ledger and steps use horizontal rules.
17. P1 run execution: the completed run retained a dense bottom action bar full of disabled controls, while every step was presented as a wide spreadsheet row. Completed runs now show only their terminal status; execution metadata and step evidence use compact open sections with fewer borders.
18. P1 responsive layout found in the first v3 production capture: at the 812px QA viewport, the hidden context pane still created an implicit 252px grid track. The case detail collapsed to 220px even though the pane itself was `display:none`. The compact grid now explicitly defines `268px minmax(0,1fr) 0`; post-fix browser evidence is `268px 472px 0px`, with the detail ending exactly at the 812px viewport edge.

## Final visual review

- Typography: one compact sans-serif hierarchy, readable Russian labels, no clipped project name at tested widths.
- Layout: the selected dense ledger/chart/table structure is preserved without generic floating card stacks or gradients.
- Surfaces: headline metrics are deliberately unboxed; only analytical regions retain restrained 8px panels. Creation drawers are square to the viewport edge, avoid nested card stacks, use 6px controls, and keep one fixed footer.
- Icons: existing Lucide family used consistently; no custom SVG or CSS-drawn asset substitutions.
- Responsiveness: no horizontal overflow at desktop, tablet, or mobile checks. KPI and chart sections reflow; mobile navigation remains usable.
- Interactions: burger collapse, drawer Escape close, focus return, bidirectional focus wrapping, body-scroll lock, drawer internal scroll, case step editing, case/suite/run selection, and dashboard page scroll were exercised in the in-app browser.
- Accessibility: semantic dialog labeling, keyboard focus containment, 44px compact targets, chart aria labels, and reduced-motion chart behavior are present.
- Console: after the final server restart and cache normalization, no new browser error was recorded during the final dashboard, case-drawer, and run-drawer checks; visible historical entries predate the fix.
- Production workbench pass: integrations, suites, cases, and runs were opened after the Pages release while authenticated. Browser console warnings/errors were empty. At the narrow QA viewport the suites table intentionally owns horizontal overflow (`overflow-x:auto`, 401px client / 650px content) rather than clipping or widening the page.
- Final v3 production pass: all four rebuilt workbenches were recaptured from `https://tms.saturnusgo.com/testcases/umbrella-home/work/` after the final Pages deployment. The document remains exactly 812px wide at the 812px viewport. The integrations table is the only horizontal overflow owner (`672px` client / `820px` content, `overflow-x:auto`), so its columns remain reachable without widening the application shell.

## Final workbench comparison history

- Earlier evidence: the supplied captures showed repeated metric cards above integrations, nested bordered containers in suites, decorative case chrome, and a completed run with an inert action footer.
- Fix applied: removed the integrations counter strip, de-cardified suite/case/run content, reduced header and control height, made labels and thin rules carry hierarchy, and removed inactive completed-run actions.
- Post-fix evidence: the four production captures and four combined comparisons listed above. The intentionally different viewport was normalized without distortion and responsive overflow was tested separately.
- V3 comparison method: each supplied desktop screenshot was aspect-preserved, scaled down to fit an 812×814 canvas, and vertically centered without stretching; the production capture remained native 812×814 at DPR 2. The combined files place source on the left and implementation on the right. Because source and production viewports differ, the comparison is limited to hierarchy, density, container treatment, and responsive behavior rather than pixel matching.
- V3 post-fix evidence: the initial narrow case capture exposed the implicit third grid track; commits `5f6b9102` and `9fe598c0` removed it. The final v3 case screenshot and computed `268px 472px 0px` grid are the post-fix comparison evidence.
- Fonts and typography: existing product sans stack retained; hierarchy reduced to one page title, compact labels, and normal-weight body copy. No new display font or decorative type was introduced.
- Spacing and layout rhythm: desktop-scale padding was reduced in work surfaces, large empty chrome was removed, and narrow layout retains scroll ownership.
- Colors and visual tokens: the existing dark shell and restrained blue action color remain; no gradients or new decorative color system were introduced.
- Image quality and asset fidelity: these workbench screens contain no photographic or branded raster assets; existing Lucide icons remain sharp and consistent.
- Copy and content: production Russian content and real imported records were used; no synthetic counts or placeholder records were added.

## Selected test-case hybrid — final pass

- Direction: the typography, document composition, and quiet repository hierarchy from option 1 are combined with the persistent property inspector from option 2.
- Sources: selected option 1 (`exec-4275286b-e6a8-43d6-9ef0-1f711d751896.png`) and option 2 (`exec-de8c5b57-e866-4ff8-8459-84ede8fd71f5.png`).
- Browser state: Russian locale, collapsed global navigation, populated selected case `UHQ-TC-006`, nested repository visible, inspector open. Focused in-app viewport was 979×378 CSS px at DPR 2.22; desktop track geometry is 344px repository / flexible document / 248px inspector and the inspector becomes a 288px dismissible overlay below 1380px.
- Same-size comparison input: `design-qa-evidence/test-case-hybrid-final.jpg`; local final browser states additionally remain under ignored `.design-qa/` evidence.
- P0 resolved: selecting demo cases now hydrates the matching full detail instead of leaving an empty document; the default collapsed rail preserves the intended desktop reading width; mobile no longer requires an impossible repository-plus-document minimum width.
- P1 resolved: the selected branch truly collapses, repository controls use ordinary keyboard-operable navigation semantics, and the inspector open/close transfers and restores focus. Below 1380px it defaults closed; when opened it becomes a labelled modal rail with scrim, inert background, focus containment, and Escape dismissal. Focus indicators use a solid high-contrast blue ring, with a lighter high-contrast ring on dark navigation.
- P1 visual resolved: restored the option-1 metadata strip and narrative rhythm, removed the redundant inspector heading, preserved tag casing, and kept the inspector as a flat information rail rather than a stack of cards.
- P2 resolved: command row, document padding, narrative gap, and compact tag typography were aligned to the measured target; the final browser comparison contains no new gradients, floating cards, or decorative asset substitutions.
- Interaction verification: repository collapse/expand, case selection after reload, inspector collapse/reopen, focus restoration, and Escape dismissal were exercised in the in-app browser.

## Verification

- `npm run typecheck`
- `npm run architecture:tms` — 177 files
- `npm run test:tms-auth` — 17/17
- `npm run test:tms-attachments` — 4/4
- `npm run test:tms-adapters` — 42/42
- dashboard snapshot test — 1/1
- `npm run build` — 61/61 pages generated
- production browser console — 0 warnings/errors after the v3 release
- production document width — 812px client / 812px scroll width

## Run-planning and history release candidate

- Browser state: Russian locale, collapsed navigation, right-side run planner open at 979×731 CSS px.
- Scope evidence: the planner presents one flat result list with loaded, matched, and selected totals, project-wide search, scenario/platform/component/folder/priority/lifecycle filters, stable selection, and a sticky count-bearing action.
- Data evidence: cursor collection tests cover every test-case and run-item page; production data separately verifies all 240 Umbrella-Host cases exist, including 162 positive, 45 negative, and 33 corner cases.
- History evidence: active and archived run tabs remain in the client model, archived evidence is read-only, and restore/archive controls are capability-gated.
- Mutation evidence: sequential step transitions consume the strong ETag returned by each mutation, while stale archive/run ETags receive one bounded refresh-and-retry.
- Accessibility evidence: dialog focus containment/return, Escape dismissal, labelled filter groups, selected-count status, keyboard-operable uploads, removable evidence rows, and reduced-motion fallbacks are implemented and covered by static/browser review.

final result: passed

## Inline case comments and explicit bulk-selection mode — final production pass

- Visual sources: the user-supplied 1 September test-case listing reference at 1280×827 and case-inspector editing reference at 1280×802. The focused source/production comparisons are `.design-qa/case-comments-selection/comparison-selection-toolbar.png`, `comparison-selection-bar.png`, and `comparison-comments-editor.png`.
- Production evidence: `.design-qa/case-comments-selection/production-default.png`, `production-selection.png`, and `production-comments.png`, captured from the authenticated Falcon production route at a 1280×720 CSS viewport after the CDN served source release `ac930c14`.
- Comments: the separate Comments tab is removed. A labelled `Комментарии` region now follows the case procedure inside General, so history and discussion remain part of the same case document rather than a parallel screen.
- Markdown behavior: the new-comment composer reuses the established client-only WYSIWYG Markdown editor and sanitized saved renderer. The compact toolbar exposes undo/redo, bold, italic, strike, code, block type, lists, and link controls without showing raw Markdown syntax during editing.
- Selection hierarchy: no row or header selection checkbox is rendered in the default list. `Выбрать тест-кейсы` sits immediately before List/Groups, exposes pressed state, and reveals or removes the checkbox column with restrained width/opacity/transform motion. Leaving selection mode clears the prior selection instead of keeping hidden bulk state.
- Bulk feedback: selecting the first case reveals the blue action bar with the production `caseBulk_bulkBarReveal` top-to-bottom animation (`0.22s`). The existing Run, lifecycle, priority, overflow, compact-container, keyboard, and focus-return behavior remains intact.
- Production interaction QA: default mode contained zero case-selection checkboxes; selection mode exposed all 240 hydrated case checkboxes; one selected case produced the action bar; disabling selection returned to zero checkboxes and removed the bar. General exposed Comments inline and no Comments tab. Browser console errors and warnings were empty.
- Visual review: the implementation preserves the accepted Falcon graphite palette, compact table rhythm, restrained blue controls, dense inspector composition, and existing icon language. Equal focused crops were used where the source and production viewport heights differed. No P0, P1, or P2 visual or interaction regression remained.
- Verification: focused collaboration/selection tests passed 22/22; TMS adapters 134/134, auth 27/27, attachments 4/4, typecheck, 260-file architecture, generated contract, production build 61/61, and `git diff --check` passed before the release. Pages deployment `58b04f10` serves source release `ac930c14`.

final result: passed

## Test-case WYSIWYG, bulk actions and run handoff — final pass

- Sources: the eleven user-supplied 1 September references covering full-list selection, group/project selection, the persistent bottom action bar, lifecycle and priority menus, parameter editing, and test-run creation. The previous accepted inspector references remain the source for fullscreen geometry and inline editing.
- Combined comparisons: `.design-qa/case-bulk/compare-priority-source-left.png` and `.design-qa/case-bulk/compare-run-source-left.png` place the normalized references beside the implemented priority and run states. Inspector evidence is stored under `.design-qa/case-visual-refinement/`; all evidence is ignored and is not shipped.
- Fullscreen inspector: fullscreen preserves the normal case-document composition and expands from the 68px navigation boundary to the viewport edge with no centered max-width or oversized side gutters.
- Metadata controls: lifecycle, priority, type, and estimate are single semantic controls with an integrated chevron. View and edit states retain the same semantic color treatment and use keyboard listboxes rather than system menus.
- WYSIWYG: Description, Preconditions, execution data, checklist text, and step action/result/data fields use a client-only in-place editor. Bold and italic appear immediately as formatted content without raw Markdown markers; saved rendering suppresses raw HTML and rejects unsafe link protocols. Dark and light captures confirm visibly stronger emphasis.
- Listing semantics: List and Groups use white active text on `#3574f0` in light mode. Every row exposes a priority triangle—red Critical, amber High, blue Medium, and green Low—alongside the manual/checklist indicator and real case key.
- Selection workflow: one case, a group, the current filtered result, or every active case in the project can be selected without losing out-of-filter selections. Archived cases and summaries without authoritative ETags are unavailable. The bottom bar exposes Create test run, Change status, Change priority, and Clear with keyboard navigation and focus restoration.
- Responsive action bar: the full-list state retains complete labels. Inspector-narrow layouts use compact visible labels without horizontal overflow; the 414px state and its 190px priority menu were recaptured. At phone-sized list widths the bar becomes two rows, reserves 94px below the table, right-aligns the final menu, and keeps failure alerts visible and announced above the bar. The final phone recapture was blocked when the selected in-app browser became unavailable; source/container behavior and cleanup were verified without substituting another browser.
- Run handoff: Create test run reuses the production run dialog with the exact selected IDs. Active non-archived runs add an accessible red navigation dot and opening Runs selects the active run.
- Mutation contract: `PATCH /api/v1/test-cases/bulk` accepts 1–1000 unique case IDs with strong per-case ETags and one idempotency key. The backend authorizes the entire workspace/project scope, validates and locks the full batch before writing, preserves request order, creates immutable revisions only for changed cases, and returns changed/unchanged counts atomically. Stale, missing, and archived scopes produce no partial writes; the client refreshes on 412, 404, and 409.
- Security cleanup: all temporary visual harnesses and authentication exceptions were reverted byte-for-byte. No QA marker, credential literal, generated cache, or ignored screenshot enters the release stage.
- Recovery hardening: legacy raw HTML is normalized into the parent draft as soon as the WYSIWYG editor opens. Scope-changing 404/409 failures refresh the list, use localized copy, and also reach the global notice surface if selection reconciliation removes the bottom bar.
- Verification: frontend TypeScript, 244-file architecture, 27/27 auth, 4/4 attachments, 116/116 adapter/UI tests, focused bulk recovery, exact regenerated OpenAPI, clean production build with 61/61 pages, and `git diff --check` passed. Backend 210/210 tests, build, typecheck, lint, architecture, 72-operation OpenAPI validation, 15 migrations, and `git diff --check` passed.

final result: passed

## Run selector readable names — production pass

- Source: the user-supplied 31 August crop showing all active run names truncated in the trigger and list. Production evidence: `.design-qa/run-picker-readable-production.png`; focused comparison: `.design-qa/run-picker-before-after.png`. The evidence assets are ignored and are not shipped.
- Production state: authenticated TESSIQ Test Runs at 1280×720 CSS px, dark theme, three active real runs. The selector was opened after Pages propagation and checked against the actual production records.
- Trigger: the selected run name now wraps to its natural multi-line height instead of ellipsizing; its immutable run key is shown on a separate secondary line.
- Options: every run name wraps without line-clamp or text-overflow. The full HOST-TC-90 run, HOST-1 smoke run, and Android regression run are readable while their HOST-TR keys remain separate and aligned.
- Interaction: listbox semantics, Arrow/Home/End navigation, Escape dismissal, focus restoration, selected marker, and the existing restrained opening animation are unchanged.
- Accessibility: the complete name remains the accessible option name and is also available through the native `title` tooltip.
- Verification: TypeScript passed; architecture passed for 208 files; focused layout regression 1/1; TMS adapter/UI tests 63/63; `git diff --check` passed; production build and approved Pages publish generated 61/61 pages.
- Release evidence: source commit `774499c8` is on `saturnusgo-web/main`; Pages commit `5da38156` is on `saturnusgo-web.github.io/main`. The authenticated production selector was recaptured after deployment.

final result: passed

## Responsive active-run action bar — final pass

- Source: the user-supplied 31 August active-run capture at 2880×1562 device pixels, normalized to its 1440×781 CSS viewport. It showed the persistent run actions wrapping into two rows while completion progress occupied a third vertical alignment.
- Production evidence: `.design-qa/run-toolbar-responsive/implementation-production-1087x814.png` and `.design-qa/run-toolbar-responsive/implementation-production-collapsed-1087x814.png`; focused source/implementation comparison: `.design-qa/run-toolbar-responsive/footer-comparison.png`. These are ignored QA artifacts and are not shipped.
- Responsive behavior: the action group is a single non-wrapping row. At wide widths all labels remain visible; at constrained run-shell widths status actions, pager labels, and then evidence/defect labels progressively collapse to icon buttons instead of moving to another line.
- Measured improvement: the source footer was 84px high with actions at two different vertical positions. The deployed footer remains 48px high at a stricter 1087×814 viewport with both expanded and collapsed global navigation; actions and `Выполнено: 0%` share one row.
- Layout safety: a horizontal overflow fallback preserves every action at intermediate widths. The existing mobile layout remains intentionally stacked below 720px, where a desktop-style single row would no longer meet touch-target and readability requirements.
- Accessibility: hidden visual labels retain localized `aria-label` and tooltip text. Previous/next controls now have explicit localized accessible names, and no focus or command behavior changed.
- Fidelity review: typography, YouTrack-derived light tokens, semantic pass/fail/block colors, borders, icons, run data, and execution behavior remain unchanged. The fix is limited to responsive action-bar geometry.
- Production verification: the live TMS loaded the new page/CSS chunks, authenticated through the existing SSO session, rendered the active run at 1087×814, and produced no browser console errors or warnings during expanded/collapsed navigation checks.

final result: passed

## TESSIQ identity replacement — final local pass

- Source visual truth: `app/src/modules/core-tms/assets/brand-exploration/02-tessiq.png` (1536×1024 px), the user-selected second identity direction.
- Production assets: `app/src/modules/core-tms/assets/tessiq/tessiq-mark-dark.png` and `app/src/modules/core-tms/assets/tessiq/tessiq-mark-light.png` (512×512 px, transparent PNG). The other three approved explorations remain under `app/src/modules/core-tms/assets/brand-exploration/`.
- Browser-rendered implementation: `.design-qa/tessiq-dark-collapsed.png`, `.design-qa/tessiq-dark-expanded.png`, and `.design-qa/tessiq-light-expanded.png` (1153×649 px exports from a 1153×648 CSS viewport, DPR 2.22). The comparison input is `.design-qa/tessiq-source-vs-implementation.png`; the source was aspect-preserved at 1100×733 and the implementation focused regions were cropped to 600×260 without stretching.
- State: local development demo behind a temporary QA-only authentication bridge, Russian locale, selected Test Cases workspace; collapsed/expanded navigation in dark mode and expanded navigation on the unchanged legacy light theme. The bridge was fully reverted before final gates.
- Full-view evidence: the cube remains fully visible and uncropped in the 68px collapsed rail; the expanded 269px rail adds the TESSIQ wordmark without shifting the icon or changing the surrounding navigation hierarchy.
- Focused comparison evidence: the selected 3×3 verification-matrix cube, red top-center module, white/graphite inverse, compact uppercase wordmark, and flat technical identity all remain recognizable in the 40px production slot. No Saturn artwork, CSS-drawn approximation, inline SVG, emoji, or placeholder remains.
- Typography: the wordmark is a fixed-width 21px/750 uppercase lockup with stable letter spacing. Its 156px layout width is constant during motion, so letters fade/translate as one unit instead of compressing.
- Spacing and layout rhythm: the 40px mark and 13px wordmark gap align to the existing 48px brand row and the YouTrack-derived navigation density.
- Colors and tokens: dark navigation uses the white/red cube; the light inverse asset is bundled for light content/loading surfaces. Existing light-theme product colors are unchanged.
- Image quality: both marks were inspected at original 512×512 detail after background removal and de-fringing; edges are sharp, transparent, and free of crop or halo artifacts at the rendered 40px/82px sizes.
- Copy/content: the visible product lockup is exactly `TESSIQ`; the old visible Saturn identity and loader names are removed. Technical API/schema compatibility names were intentionally not renamed.
- Interaction evidence: collapse and expand were exercised from the visible bottom chevron. Computed wordmark width stayed 155.997px in both states; opacity changed 0→1 with the configured 140ms fade and 190ms translation. `prefers-reduced-motion` disables these transitions.
- Console: no TESSIQ runtime error was recorded. The only warning is the pre-existing unrelated investor stylesheet autoprefixer warning.
- Comparison history: the initial integration used the correct cube but had not yet been verified in both navigation states. Post-fix evidence confirmed stable icon geometry, non-compressing wordmark motion, dark/light theme behavior, and removal of the obsolete tracked Saturn raster.
- Verification: TypeScript, architecture (206 files), adapters 61/61, production build 61/61, and `git diff --check` passed.

final result: passed

## YouTrack sidebar utilities and gradient — final pass

- Source visual truth: `.design-qa/sidebar-utilities/source-youtrack.png`, copied from the user-supplied YouTrack sidebar capture. Source dimensions are 446×1552 device pixels; the browser capture is consistent with a high-density sidebar reference rather than a 446px CSS navigation rail.
- Implementation evidence: `.design-qa/sidebar-utilities/implementation-expanded.jpg`, captured from the local TESSIQ workspace in the Codex in-app browser at a 1153×648 CSS viewport with `devicePixelRatio=2.2200000286102295`. The screenshot artifact is 1153×649 pixels because the browser capture is normalized to CSS-pixel output.
- State: dark theme, Russian locale, populated development demo, expanded global navigation, and the Create pop-up open. A separate collapsed-navigation pass verified that the pop-up escapes the 68px rail without clipping or an oversized invisible hit target.
- Full-view comparison evidence: `.design-qa/sidebar-utilities/full-comparison.png` places the complete YouTrack reference beside the final TESSIQ sidebar. The source was proportionally normalized to the implementation capture height; the implementation was cropped to its 269px visible navigation region.
- Focused comparison evidence: `.design-qa/sidebar-utilities/focused-comparison.png` places equal 269×458 crops together for the logo, upper navigation, gradient spot, active row, and Create interaction. This focused crop was necessary because the complete reference and implementation use different viewport heights.
- Layout and spacing: Create, Settings, Help, and Notifications form a dedicated bottom utility group above the existing collapse chevron. Row height, icon alignment, label rhythm, and the restrained Create surface follow the reference without importing unrelated YouTrack product items.
- Colors and gradient: the old full-height linear navy treatment was replaced by a localized 430×700px radial spot anchored beyond the upper-left edge. It moves from `#172352` through `#172244`/`#171d2d` and resolves into the `#18191b` graphite base, matching the reference's uneven upper-left glow rather than painting the whole rail blue.
- Typography and copy: the existing system font and compact TESSIQ shell scale are preserved. Russian utility labels are explicit and the Create menu uses short action titles with one-line contextual descriptions.
- Icons and imagery: the approved TESSIQ raster mark remains sharp and uncropped. All utility actions use the established Lucide icon system; no emoji, generated decoration, or code-drawn logo was introduced.
- Interaction evidence: Create opened an animated keyboard menu; New test case opened the Test Case drawer; New bug report opened the Defect drawer; Settings navigated to Configuration and acquired current-page state; Escape/outside dismissal and arrow-key cycling are implemented; Help and Notifications are intentionally presentational shells for later behavior.
- Console: the in-app browser recorded no error-level console entries during expanded, menu-open, drawer-open, settings, and collapsed states. Only React development info and expected Fast Refresh logs were present.
- Comparison history: the first collapsed-state check exposed that allowing navigation overflow also left 280px button hit areas outside the 68px rail. The collapsed brand, item list, utility group, buttons, and chevron were constrained to 68/48px, then recaptured; the Create menu opened to the right without clipping and no oversized focus outline remained.
- Verification: TypeScript passed; architecture passed for 207 TMS files; the adapter/UI suite passed 61/61; production build generated 61/61 pages; `git diff --check` passed; the temporary local visual-QA authentication bypass was fully reverted.

final result: passed

## YouTrack identity redesign — final local pass

- Direction: the selected list-first concept was rebuilt with the actual YouTrack visual language instead of the former blue TMS skin.
- Reference evidence: `.design-qa/reference-crop.png`; local implementation evidence: `.design-qa/cases-dark-expanded.jpg`, `.design-qa/cases-light.png`, and `.design-qa/youtrack-vs-tms.png`.
- Shell: full-height navy-to-charcoal navigation, compact system typography, 40px rows, flat selected states, thin `#43454a` dividers, and `#3574f0` reserved for primary, focus, and selection.
- Cases: all loaded project cases are presented in a dense list-first workspace with resizable repository, keyboard-roving rows, document detail, persistent information rail, and a mobile list-to-detail transition with an explicit return action.
- Surfaces: API testing, selects, configuration, drawers, run planning, hooks, integrations, reports, and run navigation share the same light and dark token system without floating card stacks or old dark-blue panels.
- Visual checks: dark desktop, light responsive layout, filter popovers, creation drawer, dashboard, case selection, mobile detail/back flow, expanded navigation, and reference/implementation side-by-side comparison.
- Accessibility checks: selected list and repository items are the only tab stops in their respective collections; Arrow keys, Home, and End move selection; mobile detail has a labelled return control; focus indicators remain high contrast.
- Security note: visual QA used a temporary local-only preview path that was fully reverted. The final source retains the normal Auth0 boundary and contains no preview bypass marker.
- Verification: adapters 58/58, auth 17/17, attachments 4/4, TypeScript, 204-file architecture gate, production build 61/61, and `git diff --check` all passed.
- Final result: passed.

## Saturn identity and dark theme — final pass

- Source: ImageGen-produced minimal ringed Saturn on a transparent background, with no lettering; the first selected concept was reused as the single brand mark.
- Implementation: `app/src/modules/core-tms/assets/saturn-mark.png` is bundled into `_next/static/media` and rendered as a `currentColor` CSS mask, so the same uncropped geometry is white in the fixed dark header and adapts safely without a second raster asset.
- Viewport: in-app browser at 1153×648 CSS px, authenticated demo workspace, collapsed navigation; light dashboard and dark configuration states were captured at the same viewport.
- Comparison: the generated source asset and `.design-qa/theme-light-dashboard.png` were inspected together at original detail. The full planet and both ring tips remain visible inside a 44×40 brand slot; the `TMS` wordmark is absent.
- Light mode: the pre-existing production palette was restored exactly—`#101b24` header/navigation, `#edf1f4` workspace canvas, original control, border, action, status, and chart colors. No monochrome redesign remains in the light theme.
- Dark mode: the content surface uses the same blue-graphite family as the original header (`#101b24`, `#16242e`, `#1b2a36`) rather than black; text and primary actions invert to restrained white values without introducing blue or yellow panels.
- UX: language, appearance, and sign-out controls now live under Configuration; the dashboard no longer renders the global test-case search field. Sidebar width, labels, and content animate with a 240ms easing curve and honor `prefers-reduced-motion`.
- Differences found and fixed: an early light-theme recolor made the navigation white and changed legacy surface colors; that entire recolor was removed after review. The final light state is the legacy visual system plus only the new Saturn identity and settings controls.
- Production runtime: the authenticated dashboard smoke exposed a second frozen-intrinsics incompatibility in `decimal.js`. Its constructor shadowing now uses an own property definition, and the child-process regression freezes both `Function.prototype` and `Object.prototype` before exercising Decimal and Recharts together.
- Final result: passed.

## Workspace orbital loader — final pass

- Reference: CodePen `Neon Flux Node — Pure CSS 3D Orbital Loader` (`https://codepen.io/respectforcreators/full/yygbgge`), selected for its compact layered orbit and absence of a surrounding card.
- Implementation: the reference motion language was adapted to the existing production Saturn raster mask; no CodePen code, neon palette, foreign branding, text, custom SVG, or decorative CSS drawing was copied.
- Visual state: centered transparent motion layer over the native workspace canvas. The former eyebrow, heading, description, white panel, border, radius, and shadow are absent.
- Light mode: original light TMS canvas with the dark Saturn asset. Dark mode: original blue-graphite canvas with the same asset inverted through `currentColor`.
- Motion: two different-duration perspective orbits, a restrained breathing core, and one fading asset echo. Computed transforms changed across a 420ms browser sample.
- Accessibility: the status remains announced with screen-reader-only localized copy; there is no visible loading text. All animation stops under `prefers-reduced-motion` while the Saturn mark remains visible.
- Same-viewport comparison: the CodePen reference, light TMS implementation, and dark TMS implementation were opened together in the in-app browser at 1153×648 CSS px. The final implementations keep the compact focal point while matching TMS identity and theme surfaces.
- Console: no new browser error was recorded during the final light/dark loader pass.
- Final result: passed.

## Compact project header and dark workbenches — final pass

- Source evidence: four user-supplied 29 August captures covering the header, dark Test Cases, dark Run execution, and dark Suites at the same desktop scale.
- Header: removed the duplicated global test-case input and its obsolete `⌘/Ctrl K` listener. Environment and Build now occupy the final right-aligned grid column instead of inheriting the removed search track.
- Project control: removed the `PROJECT/ПРОЕКТ` label, native operating-system select, and detached plus button. The active project name and chevron form one unboxed trigger; its custom keyboard-dismissible menu contains the project list, selected-state check, and Create project action.
- Dark Test Cases: repository folders/cases, selected rows, command bar, case document, property strip, step table, and inspector now use the shared graphite surface, text, border, control, hover, and selected tokens. Light-only white and pale-blue literals no longer leak into the dark state.
- Dark Runs: navigator, summary, selected item, title, metadata strip, preconditions, step header/rows, evidence state, and footer now use the same dark tokens; text no longer renders dark-on-dark and metadata no longer becomes a white strip.
- Dark Suites: list, selected suite, detail header, scope line, table head/body, empty state, priority, and owner cells now remain readable on the graphite canvas instead of mixing white table surfaces with near-white text.
- Motion and accessibility: the custom project menu enters in 140ms, the chevron rotates in 160ms, Escape closes and restores trigger focus, outside pointer dismisses, and reduced-motion disables both effects. The native select has been removed without losing an accessible menu label or selected state.
- Build evidence: TypeScript, 181-file architecture check, 17/17 auth tests, 4/4 attachment tests, 45/45 adapter tests, static export 60/60, and production build 61/61 passed. The only build warning remains the unrelated legacy investor stylesheet `flex-end` warning.
- Production artifact evidence: source commit `27547929` and Pages commit `b283021e` are on their respective `main` branches. The live TMS bundle contains the custom `menuitemradio` selector and dark-theme stylesheet, and contains zero `tms-command-search` elements.
- Visual verification limit: the post-release in-app browser session reached the production Auth0 boundary without an authenticated TMS session, so the final signed-in pixels could not be recaptured in that browser. The implementation comparison is grounded in the accepted user-supplied screenshots plus the shipped production CSS/DOM artifact; no authenticated visual state was fabricated.
- Final result: passed, with the named authenticated-browser capture limitation.

## YouTrack total-system redesign — release pass

- Reference: the supplied YouTrack Issues screenshot, inspected at original detail for its full-height gradient navigation, graphite content surfaces, compact system typography, 40px rows, thin dividers, and restrained `#3574f0` selection/action color.
- Combined comparison: `.design-qa/youtrack-total-final/final-comparison.jpg` places the reference beside the final Dashboard, Test Cases, Integrations, Configuration, and Run Planner states. The file is intentionally ignored release evidence and is not shipped to production.
- Coverage: the application shell, Dashboard, Test Cases, Test Runs and history, run execution, Run Planner, Suites, Integrations, Hooks, Reports, API Testing, Configuration, shared drawers, popovers, filters, buttons, fields, and animated selects now use one flat light/dark YouTrack-derived system.
- Dark tokens: content `#1e1f22`, navigation `#18191b`, controls `#2b2d30`, hover `#393b40`, borders `#43454a`/`#4e5157`, muted text `#9da0a8`, primary `#3574f0`, and links `#99bbff`. The selected full-navigation navy-to-charcoal gradient remains the only large gradient treatment.
- UX corrections: Russian component labels are presentation-only while API payloads keep canonical values; run scope sorting and filters use the same custom animated listbox control as other TMS selectors; keyboard navigation, focus return, table semantics, active/history state, and responsive density are preserved.
- Visual states: dark desktop Dashboard, Test Cases, Integrations, and Runs; dark responsive Configuration and Run Planner; light responsive Dashboard; active/history navigation and archived-run controls. The Hooks demo could render only its authenticated-service recovery state locally, so its populated state was verified by source, types, architecture, and focused tests rather than fabricated browser data.
- Security cleanup: the temporary local visual-QA authentication bypass and its query marker were removed before the release gate.
- Verification: TypeScript passed; architecture passed for 204 files; Auth0 17/17; attachments 4/4; TMS adapters and UI models 58/58; generated OpenAPI contract unchanged; `git diff --check` passed; production build generated 61/61 pages.
- Final result: passed.

## Test Case workspace geometry hotfix — final pass

- Source: the two user-supplied 31 August captures showing the compact Test Case workspace and the shifted six-column table. The full-layout source was normalized from 2880×1560 device pixels to the matching 1440×780 CSS viewport before comparison.
- Implementation evidence: `.design-qa/case-geometry/implementation-populated-1440x780.png` and `.design-qa/case-geometry/implementation-overlay-open-1280x780.png`; combined source/implementation evidence: `.design-qa/case-geometry/comparison-before-after.png`. These files are ignored local QA artifacts and are not shipped.
- Root cause: `display:flex` was applied directly to the ID and title `<td>` elements. That removed them from table-cell formatting, stacked both values in the first column, shifted Status/Priority/Component/Estimate one column left, left Estimate empty, and doubled row height from 40px to about 80px.
- Table correction: all six `<td>` elements now retain native table semantics; flex alignment lives in inner wrappers. A six-column `<colgroup>` assigns 132px to ID, 104px to Status, 112px to Priority, 126px to Component, 78px to Estimate, and the remaining width to Title. Header and row boundaries match exactly and rows remain 40px high.
- Workspace correction: at a 1372px Cases workspace the measured desktop geometry is 230px repository + 802px list + 340px inspector. The list has an 800px floor, the inspector no longer shrinks below 340px, and property labels/values use readable vertical alignment rather than 35px value slots.
- Responsive correction: below the inline threshold the inspector becomes a 340px overlay with an explicit scrim/back action; below the repository threshold the repository is removed so the table keeps its readable floor. Both repository and inspector separators support pointer and keyboard resizing with persisted, ResizeObserver-clamped widths.
- Fidelity review: typography, graphite tokens, 40px density, borders, selection blue, Saturn asset, localized copy, button sizing, and the accepted YouTrack-derived shell remain unchanged. The hotfix only repairs geometry and responsiveness.
- Security cleanup: the temporary local visual-QA authentication bypass was fully reverted; the final source contains no preview query marker or authentication exception.
- Verification: TypeScript, 204-file architecture gate, focused Cases 6/6, TMS adapters/UI models 58/58, Auth0 17/17, attachments 4/4, production build 61/61, and `git diff --check` passed.
final result: passed

## Test Case detail controls and deep links — final pass

- Source: the user-supplied 31 August dark Test Case workspace capture plus the accepted YouTrack-derived shell and compact table density.
- Combined comparison: `.design-qa/case-detail-controls/comparison-reference-current.png`; implementation states: `.design-qa/case-detail-controls/default-panel-dark-1440x780.png`, `.design-qa/case-detail-controls/fullscreen-dark-1440x780.png`, and `.design-qa/case-detail-controls/folder-drawer-dark-1440x780.png`. These are ignored local QA artifacts and are not shipped.
- Detail geometry: the default inspector is now 510px instead of the legacy 340px. The repository remains 230px, the document list receives the remaining 633px at the measured 1441×780 browser viewport, and the 800px table owns horizontal overflow (`scrollWidth=800`, `clientWidth=633`) instead of compressing its six columns.
- Resizing: the detail separator exposes vertical separator semantics and supports pointer, Arrow, Home, End, and double-click reset. Browser evidence measured 510→494→340→623→510 while preserving the list floor.
- Detail header: the redundant Test Case ID was removed. Run is the first action; Copy link, Full screen, Edit, Clone, and Archive follow in a stable order, with Full screen immediately before Edit.
- Full screen: the document expands over the complete Cases content area while retaining the fixed global shell; the same control exits full screen, and Escape restores the split workspace.
- Deep links: Copy produces a canonical same-origin URL containing only `projectId` and `caseId`. Reload selects the linked project and case; temporary release/debug parameters are deliberately stripped. The browser clipboard matched the visible canonical URL exactly and announced localized success through `role=status`.
- Folder creation: the former square mixed-theme modal is now a flat right drawer using the shared graphite controls, custom animated parent-folder selector, continuous path preview, and sticky action footer.
- Security cleanup: the localhost-only visual-QA Auth0 bypass was fully reverted before release verification. No production authentication exception or preview marker remains.
- Accessibility: every icon action has a localized accessible name and tooltip; link copy reports nonvisual status; resize controls remain keyboard-operable; the drawer retains dialog focus management and Escape dismissal.

final result: passed

## Light-mode polish and workspace motion — final pass

- Source: authenticated production TESSIQ in the light theme at `https://tms.saturnusgo.com/testcases/umbrella-home/work/`; implementation: the same light-theme surfaces in the local demo workspace. Evidence is stored under `.design-qa/light-polish/`.
- Combined comparison inputs: `cases-light-comparison.png`, `dashboard-light-comparison.png`, and `reports-light-comparison.png`. Source and implementation captures are shown together; production and local data differ, so the comparison is limited to shell geometry, typography, controls, colors, and content framing rather than record-for-record pixels.
- Primary actions: the shared workspace button inheritance previously overrode the Cases primary-button foreground. `Новый кейс` and `Запустить` now compute to `#fff` on `#3574f0` in light mode.
- Test-case markers: draft, ready, deprecated, and archived checklist marks now use darker foregrounds, explicit borders, and restrained semantic fills. The checked-list glyph remains visible against the light selected row.
- Priority semantics: low, medium, high, and critical chips now use distinct neutral, blue, amber, and red systems with stronger foreground/border contrast; labels and payload values are unchanged.
- Navigation: `Интеграционное тестирование` wraps into two complete lines in the existing 280px expanded sidebar. It no longer ellipsizes, and its label retains a fixed text measure while opacity/transform animate independently of the 240ms sidebar width transition.
- Dashboard and Reports: both page roots now use the full stage width with 16px inline padding and no max-width cap. Browser-computed values were `max-width:none` and `16px` left/right padding.
- Cases resizing: pointer movement updates CSS variables in animation frames without re-rendering the 240-row list on every event; React state and persistence commit once after the gesture. Keyboard QA changed repository width from 230px to 278px and detail width from 510px to 531px while preserving the 420px list floor.
- Motion: repository, detail, handles, shell navigation, brand area, nav collections, and utility controls use the shared restrained easing. Direct pointer drag remains one-to-one by disabling interpolation only while the pointer is held; programmatic, keyboard, breakpoint, and burger transitions animate over 170–240ms.
- Accessibility: both resize separators remain keyboard-operable; the full integration label is exposed; no semantic role or visible focus treatment was removed.
- Browser console: no application error occurred during Cases, Dashboard, Reports, sidebar, or keyboard-resize QA. The only warning is the existing unrelated investor stylesheet Autoprefixer notice.
- Security cleanup: the temporary local design-preview authentication condition was removed before final verification; the auth boundary has zero diff.

final result: passed

## Test Suites identity refresh — final pass

- Source: the two user-supplied 31 August captures showing the legacy dark Test Suites detail and Create Suite drawer. The source exposed three concrete regressions: a dark shell containing white case rows, the old oversized segmented-card treatment, and legacy typography/spacing that no longer matched the accepted TESSIQ/YouTrack system.
- Implementation evidence: authenticated production Test Suites in light and dark themes plus the local light/dark drawer states. Files are stored under `.design-qa/suites-refresh/`; `detail-comparison.png` and `drawer-comparison.png` place the source and implementation together for the final visual judgement.
- Viewport and state: the populated production suite was verified at 1087×814 CSS px with one real static suite and two real Host cases. The drawer was verified locally at 979×733 CSS px and in production at 1087×814 with the full 240-case repository. Source captures were cropped to the same surface and normalized to the implementation viewport before comparison.
- Suite workspace: the left rail is now a 280px flat navigation surface with compact 60px rows, thin dividers, a restrained selection line, current graphite controls, and no legacy card chrome. The detail uses a 116px header, a 46px scope line, and a dense four-column table with one fluid Test Case column.
- Drawer: the panel is 720px on desktop and full-width on narrow screens. Fields, mode selector, search, case rows, priority chips, and sticky footer now use the shared TESSIQ tokens in both themes. Dark mode contains no white case-row or light-field leak; light mode keeps the accepted white canvas and dark readable text.
- Content hierarchy: case titles are primary; key and folder form the secondary line; priority is a compact semantic chip. The selected mode uses a bottom action line instead of a large blue card. The case list remains bounded and scrollable for all 240 records.
- Motion and accessibility: drawer sections and case picker use restrained 150ms entry motion; the expand chevron animates; reduced-motion removes these effects. Dialog labelling, focus management, mode `aria-pressed`, picker `aria-expanded`, checkbox names, and close focus restoration remain intact.
- Interaction verification: opened and closed the drawer, expanded and collapsed the 240-case picker, switched between static and dynamic modes, and returned to the populated suite without creating or mutating production data.
- Console and gates: production browser console reported zero errors. TypeScript, the 207-file TMS architecture gate, 61/61 TMS adapter/UI tests, `git diff --check`, production build 61/61, SHA-bound Pages prepare, and approved Pages publish passed. The only build warning is the pre-existing unrelated investor stylesheet Autoprefixer notice.
- Release evidence: source commit `22c0c5fe` is on `saturnusgo-web/main`; Pages commit `49848cb6` is on `saturnusgo-web.github.io/main`. The authenticated production route served the new scoped suite CSS and rendered the real `HOST-1` suite in both themes.

final result: passed

## Run defect drawer — final pass

- Source: the user-supplied 31 August capture of the former inline defect composer, a 2190×1150 image in which the form occupied the entire execution canvas and competed visually with the active run.
- Production implementation: `.design-qa/inline-defect-drawer-production.png`, captured from the authenticated live TESSIQ release at 1087×814 CSS px with real run `HOST-TR-10`, failed step 2, and the defect form open. The combined before/after evidence is `.design-qa/inline-defect-drawer-comparison.png`.
- Composition: the defect flow is now a 540px right drawer over the still-visible run context. The former two-column canvas, oversized upload drop zone, broad snapshot panel, and persistent saved-state strip were removed from the execution document.
- Hierarchy: title and run context form a compact header; severity and priority share one row; component, YouTrack destination, description, reproduction steps, immutable run snapshot, evidence, and deep link follow in one predictable vertical sequence. The sticky footer contains only context, Cancel, and the primary create action.
- Behavioral parity: the defect payload still carries severity, priority, localized component display with canonical payload value, YouTrack target, run/item/step identity, reproduction steps, deep link, and attachments. Successful creation still reports through the existing toast and now closes the drawer instead of leaving a large saved form embedded in the run.
- Interaction and accessibility: the shared dialog supplies labelled dialog semantics, focus trap, outside-click dismissal, Escape behavior, and focus restoration. Production QA opened the drawer from `Завести баг`, closed it without mutation, and confirmed focus returned to that trigger.
- Responsive and visual fidelity: desktop uses the compact right panel; narrow screens switch to a full-width single-column drawer. Controls, borders, typography, graphite overlay, white panel, semantic selectors, and `#3574f0` primary action match the accepted TESSIQ/YouTrack identity without adding cards or decorative chrome.
- Console and gates: production browser console reported zero errors. TypeScript, the 209-file TMS architecture gate, focused layout regression 1/1, full TMS adapters/UI models 64/64, `git diff --check`, production build 61/61, SHA-bound Pages prepare, and approved Pages publish passed. The only build warning remains the unrelated legacy investor stylesheet Autoprefixer notice.
- Release evidence: source commit `cad3006c0a46abba47295ad0fa344db51cb3b4a8` is on `saturnusgo-web/main`; Pages commit `6c04fe3f9d34762e46bd460b0a25d8371a128be5` is on `saturnusgo-web.github.io/main`.

final result: passed

## Compact test-run selector and overflow marquee — final pass

- Source: the user-supplied compact run-navigation capture from 31 August plus the later focused regression capture in which the selected run and every menu option expanded into tall multiline blocks. The focused source image is 554×380 pixels.
- Production evidence: `.design-qa/run-selector-marquee/production-closed.png` and `.design-qa/run-selector-marquee/production-open.png`, captured from the authenticated live TESSIQ release at 1087×814 CSS pixels with real active runs. The focused before/after comparison is `.design-qa/run-selector-marquee/before-after.png`; these local QA artifacts are ignored and not shipped.
- Root cause: commit `774499c8` added a second key line to the trigger and allowed `white-space: normal` plus `overflow-wrap: anywhere`, so long names increased the control and option heights instead of staying within the established navigation rhythm.
- Geometry: the selected-run trigger is again a fixed 32px single-line control; list options are fixed 40px rows. Production measurements were exactly 32px for the trigger and 40px for all three real options, with no height change for long names.
- Overflow behavior: the trigger measures its real hidden distance and uses a slow 7–18 second alternate left/right pan only when content overflows. Menu names remain still until their row is hovered or keyboard-focused, avoiding a noisy list; the selected production name measured 286px of overflow with a 15.21 second cycle.
- Discoverability: every run-name viewport retains the complete native `title` value. Production inspection returned the full selected name and all three full option names, so the operating-system tooltip remains available without another custom surface.
- Motion and accessibility: ResizeObserver keeps the travel distance correct after layout changes; `prefers-reduced-motion` disables both automatic and interaction motion. Arrow, Home, End, Tab, Escape, selected-state, listbox semantics, focus return, and Create-run behavior are unchanged.
- Visual review: the compact hierarchy, graphite/white theme surfaces, typography, four-pixel menu radii, option key secondary line, selected blue focus treatment, and surrounding run execution layout match the accepted TESSIQ/YouTrack identity. No P0, P1, or P2 visual regression remained after the production comparison.
- Console and gates: authenticated production console reported zero errors. TypeScript, the 210-file architecture gate, focused selector regression, 64/64 TMS adapter/UI tests, `git diff --check`, clean production build 61/61, SHA-bound Pages prepare, and approved Pages publish passed.
- Release evidence: source commit `b452b201926e04efcd60d8493bf1c456b22f2da5` is on `saturnusgo-web/main`; Pages commit `3d1df1af` is on `saturnusgo-web.github.io/main`.

final result: passed

## Unified test-case listing and inspector — final pass

- Sources: all nine user-supplied dark test-management references from 1 September 2026. They consistently define a dense case list on the left and one persistent document inspector on the right, with create and edit states rendered in that same inspector rather than in a separate modal or drawer.
- Comparison evidence: `.design-qa/test-cases-unified/reference-vs-view-final.png` and `.design-qa/test-cases-unified/reference-vs-edit-final.png` place the supplied references beside the implemented desktop states. Additional verified captures cover view, create, section edit, groups and filters at 1440×900, plus the 900×800 overlay state.
- Information architecture: the obsolete repository column and separate case dialog are removed from the Cases workspace. Folder hierarchy remains available through QL, grouping, and multi-select filters; the main canvas is now the horizontally scrollable list plus the resizable 680px inspector.
- Listing fidelity: the toolbar provides title search, QL, List/Groups modes, grouping, dependent folder/component filters, priority/lifecycle/tag filters, accurate visible counts, and natural case-key sorting. Rows use the real case identifiers, statuses, titles, components, estimates, and 240-case cursor-hydrated project collection without placeholder records or truncation.
- Inspector fidelity: General, Comments, Attachments, and History stay in one right document. The General view exposes description, functionality, preconditions, execution details, steps, tags, owner, test data, revision note, and attachments. Section pencils use local Apply/Cancel while one stable global Save/Cancel commits the complete revision.
- Create and edit behavior: New case opens the same inspector at the title field with every editable section available; it never opens a second drawer. Manual and checklist cases enforce a valid non-empty procedure, protect the final step/item, preserve every revision field, upload pending evidence once, and prevent duplicate submissions or silent draft replacement.
- State correctness: editor actions are locked while a draft is active; failed project switches preserve the draft; successful project switches reset project-local list state; selected-case hydration exposes a retryable error instead of a false empty or endless loading state.
- Responsive and accessibility: the inspector is keyboard-resizable on desktop, becomes a labelled modal overlay at narrow widths, transfers and restores focus, traps Tab, makes the background inert, and closes predictably. Tabs support Arrow/Home/End; row focus remains valid after search/group changes; popovers and panels use restrained motion with `prefers-reduced-motion` fallbacks.
- Visual result: graphite-violet surfaces, compact controls, 46px list rhythm, restrained semantic badges, thin separators, and the persistent document composition match the supplied direction while retaining the established TESSIQ shell and real application behaviors.
- Verification: browser QA covered view, create, section edit, filters/groups, desktop, and narrow overlay states. TypeScript passed; the 223-file TMS architecture gate passed; TMS adapters/UI models passed 97/97; auth passed 27/27; attachments passed 4/4; `git diff --check` passed; production build generated 61/61 pages. The only build messages are pre-existing dependency/Autoprefixer advisories outside TMS.

final result: passed

## Test-case editing, filters, metadata and unified palette — final pass

- Sources: the two user-supplied 1 September captures defining the compact QL/filter menus and the nine previously supplied inspector references defining inline Markdown editing, metadata chips, and a persistent right-side case document.
- Browser evidence: `.design-qa/test-case-editor-polish/listing-dark-1440x900.jpg`, `edit-markdown-dark-1440x900.jpg`, `filters-dark-1440x900.jpg`, `ql-dark-1440x900.jpg`, and `folder-dialog-dark-1440x900.jpg`. The requested viewport was 1440×900; the in-app browser normalized the captured CSS viewport to 1297×811.
- Combined comparisons: `.design-qa/test-case-editor-polish/comparison-edit.jpg`, `comparison-filters.jpg`, and `comparison-ql.jpg` place each supplied reference beside the corresponding implementation state. These ignored QA artifacts are not shipped.
- Markdown editing: Description, Preconditions, execution data, checklist content, and every step action/expected result/test-data field use the same compact Markdown toolbar. Bold, italic, strike, headings, lists, quote, link, code, and safe rendered Markdown were exercised. Functionality remains a compact non-Markdown field as requested.
- Concurrent editing: Description and Steps remained open simultaneously, and the metadata pencil opened without forcing either section to save or cancel. Each section keeps its own Apply/Cancel snapshot while one global Save/Cancel commits the case revision.
- Focus and icons: the browser exposed and confirmed the former black toolbar-SVG fill and doubled native focus outlines. Toolbar icons now inherit the graphite theme, native textarea/search/QL outlines are removed, and the owning control renders one restrained 1px focus border with no second glow.
- Metadata: lifecycle, priority, type, and estimate use custom keyboard listboxes rather than native platform menus. The visible and editable states share the same compact semantic chips; browser QA opened the lifecycle menu and verified the localized Draft, Ready, and Deprecated options. Archive remains a separate case action.
- Listing controls: the former large filter canvas is replaced by a compact 264px contextual menu with independent searchable Folder and Component multiselects plus Priority, Status, Tag, Archive, and Reset controls. The folder submenu and QL `lifecycle:` autocomplete were exercised with Arrow/Home/End/Escape focus behavior.
- Creation surfaces: the New Case/New Folder actions share one compact popup. New Folder opens as a centered 420px dialog with current graphite controls instead of the former mixed-theme oversized surface.
- Palette: browser-computed primary stage color was `rgb(45, 43, 53)` across Test Cases, Dashboard, Integrations, Runs, Suites, Hooks, Reports, API Testing, and Settings. Screen-local legacy dark colors no longer create visible palette breaks.
- Final interaction audit: an active section can no longer overwrite its original Cancel snapshot; QL keyboard focus and Enter are bounded to the ten options actually rendered; Markdown toolbars are no longer nested inside field labels; and Escape closes the open folder selector without dismissing the parent dialog or losing its draft.
- Console and assets: browser console reported zero application errors. The only message was the pre-existing unrelated investor stylesheet Autoprefixer warning. Existing Lucide icons and TESSIQ brand assets are preserved; no improvised SVG, emoji, or CSS illustration was introduced.
- Verification: TypeScript, TMS architecture, authentication, attachment, adapter/UI, generated-contract, production-build, and `git diff --check` gates passed after the final visual fixes.

final result: passed

## Markdown block-type popup and Falcon sidebar palette — final production pass

- Source capture: authenticated pre-release Falcon production at 1087×814 with the Description block-type selector open. Because MDXEditor portals its listbox to `body`, the former editor-scoped theme never reached it; `Абзац`, `Цитата`, and headings were painted as uncontained text across the inspector document.
- Combined comparison: the in-app browser placed the captured pre-release state and the corrected dark-theme state in one review input at the same viewport. The corrected popup is a bounded 156px surface anchored to the toolbar trigger, with a graphite background, 1px border, six-pixel radius, restrained shadow, selected row, highlighted row, stable scrollbar gutter, and a 224px responsive height cap.
- Shared behavior: the fix targets the single portal class under `html[data-tms="1"]`, so Description, Preconditions, execution data, every step field, checklist content, and inline Comments receive the same menu without per-field forks. Production QA opened the menu in both Description and Comments.
- Theme parity: light mode uses the existing white/control-border palette; dark mode uses the established case tokens mirrored as `#34323c`, `#57545f`, `#413f47`, and the restrained primary selection tint. The menu enters in 130ms and respects `prefers-reduced-motion`.
- Keyboard and semantics: the Radix listbox/option contract is preserved. Production QA moved active focus from `Абзац` to `Цитата` with ArrowDown and kept the selected state distinguishable from hover/focus.
- Sidebar: the former concentrated blue radial surface is replaced by a 160-degree linear graphite/slate progression (`#252a36 → #282936 → #292731 → #25232c`). It retains enough separation from the `#2d2b35` workspace while no longer reading as a separate saturated blue product shell.
- Verification: focused visual/source tests passed 9/9; TMS adapters 135/135, auth 27/27, attachments 4/4, typecheck, 260-file architecture, generated contract, `git diff --check`, standalone production build 61/61, and Pages export 60/60 passed. Production source commit `ddea52d3` is served by Pages commit `b91e6b72`.
- Final production review found no remaining P0, P1, or P2 visual, accessibility, or interaction issue in the requested scope.

final result: passed

## 2026-09-01 — YouTrack evidence and case-toolbar layering

- Source: user-provided filter-count screenshot plus the signed-in production project menu at the same desktop state.
- Browser: Codex in-app Browser only; production before and local after were captured at the same 979×733 viewport. Dark-mode comparisons are stored in `.design-qa/youtrack-evidence-toolbar/`.
- Project selector: passed. Its menu now remains above the search and QL layers; the QL border/text no longer cuts through the menu.
- Filter count: passed. The count is a compact circular corner badge on one unchanged 30px filter control, not a second blue button segment. The accessible name includes the active count and the visible badge is hidden from assistive technology to avoid duplicate speech.
- Keyboard/interaction: passed. Existing button/menu semantics and focus-return behavior are unchanged.
- Responsive/theme: passed for light and dark desktop captures. The badge border inherits the case surface token, so it remains visually separated in both themes.
- Evidence sync is server-side and has no new visual surface in this pass: private Cloudflare R2 media is streamed to YouTrack issue attachments and referenced by stable Markdown filenames.
- Evidence: `project-popup-before.png`, `project-popup-after-dark.png`, `project-popup-dark-comparison.png`, `filter-badge-after-clean.png`, `filter-badge-after-dark.png`, and `filter-reference-comparison.png`.

final result: passed

## Guided creation surfaces — local review pending

- Selected source: Product Design option 2, `Guided Sections`, at `/Users/mercuryrucks/.codex/generated_images/01a0440e-06cc-7502-bcc3-ba6fb932d6c7/exec-9a039bae-eea6-4ad4-940e-46d42ac51ae9.png` (1440×1024).
- Implemented surfaces: the existing test-case inspector create mode and the existing project create/edit dialog. No new route or second test-case drawer was introduced.
- Test-case create mode now uses numbered `Основное`, `Содержание`, `Условия и шаги`, and collapsed optional-detail sections, labelled metadata controls, restrained tinted headers, and one integrated bottom action bar. All Markdown, step, folder, component, metadata, attachment, and validation behavior remains wired to the existing editor state.
- Project create/edit now uses the same guided hierarchy, compact required fields, an optional description disclosure, and actions on the same modal surface. The former promotional block and detached white footer are removed.
- Code verification passed: TypeScript, 261-file TMS architecture, focused creation-source assertions, 137/137 TMS adapter/UI tests, 27/27 auth tests, 4/4 attachment tests, generated-contract drift check, `git diff --check`, and the 61-page production build.
- Visual verification blocker: the Codex in-app Browser rejected navigation to the running localhost preview under its URL policy. Per the Product Design/browser rules, no alternate browser or standalone Playwright substitute was used. Light/dark same-state screenshots and the combined source/implementation comparison therefore remain pending user-visible local preview access.

final result: blocked — in-app Browser localhost policy

## Hybrid quality dashboard — local same-state pass, production verification pending

- Selected source: Product Design hybrid dashboard at `/Users/mercuryrucks/.codex/generated_images/01a0440e-06cc-7502-bcc3-ba6fb932d6c7/exec-97fdd115-e101-4660-be11-a1d73cd5c28f.png` (1488×1058). The implementation stays inside the existing Falcon Dashboard route and shell.
- Required desktop state: authenticated connected workspace, Dashboard selected, current Project scope, Russian, dark theme, 30-day period, inspector closed, and a 1488×1058 CSS viewport. Capture the implementation in this exact state and compare it beside the complete source image before judging differences.
- Composition review: verify the preserved Falcon shell; compact title/filter header; five-KPI ledger; Run Flow and risk-hotspot primary row; type, tag, and Product/Component coverage row; and defect lifecycle. Check typography, borders, radii, density, alignment, clipping, overflow, sticky risk header, and the absence of overlapping controls.
- Data-state review: workspace scope must switch risk and coverage to Project; project scope must switch them to Component. Verify 7/30/90-day changes, UTC bucket labels, zero/empty states, loading, stale refresh, and local fallback. Fallback must not fabricate item pass rate, item counts, or execution coverage.
- Exact drill review: exercise every KPI, Run Flow series, keyboard bucket selector, type, tag, coverage bar, uncovered gap, risk failed/blocked/open/critical signal, and lifecycle state. The drawer must show the matching workspace/project, preset or exact custom `[from,to)` window, entity, and filter; `/run-items` totals must reconcile with the selected item signal.
- Interaction and accessibility: complete a keyboard-only pass over chart proxy controls, scope/period selectors, risk table, coverage gaps, lifecycle, drawer close, retry, pagination, and links. Verify visible focus, Escape and focus restoration, safe external-link behavior, reduced motion, and no keyboard path that depends on a Recharts pointer target.
- Responsive/theme states: repeat the overview in light theme and at 390×844. Confirm KPI wrapping, single-column primary/breakdown layouts, horizontally scrollable risk data without hidden blocker columns, full-width drawer, readable charts, and no clipped filter controls.
- Evidence to retain: initial desktop overview, one opened risk drill with exact filter chips, light-theme overview, mobile overview, console output, and network requests for summary plus at least one test-case, run, run-item, and defect drill. Store a complete reference/implementation comparison using the same viewport and state.
- Code verification passed after the final edge-case fixes: focused dashboard tests 7/7, full TMS adapters/UI 157/157, TypeScript, 275-file TMS architecture, `git diff --check`, and the 61-page optimized production build. Backend `BACKEND_STABLE_V2` passed 286/286 with the bounded coverage EXPLAIN regression; OpenAPI remained SHA-256 `ca2d36ae0c244f939d40b8dc9896dbb1277540985e1074c48664344e73bc6f70`.
- Root Browser evidence: `.design-qa/hybrid-dashboard-desktop-dark-1489x1059.png`, `.design-qa/hybrid-dashboard-desktop-light-1489x1059.png`, `.design-qa/hybrid-dashboard-risk-drill-dark.png`, `.design-qa/hybrid-dashboard-mobile-light-390x844.png`, `.design-qa/hybrid-dashboard-mobile-light-flow-risk.png`, and `.design-qa/hybrid-dashboard-mobile-light-drill.png`. The required complete comparison input is `.design-qa/hybrid-dashboard-reference-vs-local.png`.
- Same-state desktop review: the in-app Browser used an explicit 1489×1059 CSS viewport, matching the 1488×1058 source within one CSS pixel. The Falcon shell, title/filter header, five-KPI ledger, Run Flow/risk primary row, three breakdown cards, and lifecycle continuation preserve the selected composition. Empty local fallback data remains visibly honest and does not fabricate execution coverage or run-item rates.
- Interaction review: Project↔Workspace changes the risk dimension from Component to Project; 7/30/90-day periods normalize the active bucket safely; KPI and component-risk controls open the native analytics drawer with exact workspace/project/period/entity/basis/component filters; Escape closes it and restores focus. The browser console contained no TMS/dashboard error.
- Responsive/theme review: light and dark desktop states passed. At 390×844 the header, selectors, KPI grid, Run Flow, type/tag/coverage cards, and full-width drawer remain readable; the 720px risk table scrolls inside its 368px card while the document stays exactly 390px wide, so blocker columns are reachable without page overflow.
- Connected production pass: backend Stage B deployment `1d2d985f-4b69-49ed-b655-775e3ce5f565` served schema 0018 with automation, analytics, and the verified YouTrack workflow guard enabled. The signed-in Browser loaded 240 current cases, 18 launched runs, 6 active runs, 100% completed-run pass rate, 19 open defects, and 21 linked defects from the HTTP source. Project and Workspace scope, 7/30/90-day periods, and the exact test-case, run, run-item, defect, component, link, coverage, and lifecycle drill filters were exercised against live records.
- Production transport evidence: Railway returned 200 for authenticated summary, test-case, run, defect, and `/dashboard-analytics/run-items` requests; the exact run-item drill completed in 13 ms and CORS preflight in 3 ms. An unauthenticated summary request returned the intended 401. The Browser console contained zero errors and zero warnings.
- Final production evidence: `.design-qa/hybrid-dashboard-production-final-dark-1488x1058.png`, `.design-qa/hybrid-dashboard-production-final-light-1488x1058.png`, `.design-qa/hybrid-dashboard-production-final-mobile-light-390x844.png`, `.design-qa/hybrid-dashboard-production-final-mobile-risk-390x844.png`, and `.design-qa/hybrid-dashboard-production-final-mobile-risk-right-390x844.png`. The exact source/production comparison is `.design-qa/hybrid-dashboard-reference-vs-production-final.png`.

final result: passed in production

## Dashboard color, Run Flow, and risk-signal correction — production pass

- Source visual truth: `.design-audit/2026-09-04-dashboard-colors-flow/01-dashboard-dark-before.png` and `.design-audit/2026-09-04-dashboard-colors-flow/02-dashboard-light-before.png`, each 1280×720 px at a 1280×720 CSS viewport and density 1. These are the exact production states identified by the user: washed semantic colors, a sparse pass-rate spike, and visually duplicated progress bars.
- Browser-rendered implementation: `.design-audit/2026-09-04-dashboard-colors-flow/03-dashboard-light-after.png` and `.design-audit/2026-09-04-dashboard-colors-flow/04-dashboard-dark-after.png`, captured from the signed-in production project at the same viewport, locale, scope, 30-day period, and density. Lower-dashboard palette evidence is `06-dashboard-dark-lower-after.png` and `11-dashboard-light-lower-after.png`.
- Full-view comparison evidence: `.design-audit/2026-09-04-dashboard-colors-flow/07-comparison-light.png` and `.design-audit/2026-09-04-dashboard-colors-flow/08-comparison-dark.png` place the exact before and after frames side by side at 2560×720 px. Focused region evidence: `09-comparison-light-focused.png` and `10-comparison-dark-focused.png` compare the Run Flow and risk table at readable density.
- State: Russian locale, Umbrella-Host project, 30-day dashboard, both light and dark themes. The final Browser state was returned to the user's dark theme.
- Fonts and typography: the existing Falcon system sans stack, compact dashboard scale, weights, line heights, truncation, and hierarchy remain unchanged. The redesign removes the competing 0–100% chart axis and turns pass rate into one clearly labelled, tabular KPI.
- Spacing and layout rhythm: the two-column primary grid, card geometry, table density, radii, and existing page rhythm remain stable. The new KPI and date selector share one bounded toolbar and do not reduce the plot or collide with the risk table.
- Colors and visual tokens: light and dark modes now have separate dashboard-local semantic tokens for blue, teal/success, coral/danger, amber/warning, plum, olive, and slate. Marks keep text labels and values, so color is never the only carrier of meaning.
- Image quality and asset fidelity: no photographic or generated imagery participates in this dashboard. Existing Falcon logo and Lucide icon assets are unchanged; chart marks remain native Recharts output rather than replacement CSS art.
- Copy and content: existing Russian product language is preserved. `Поток ранов`, `Процент прохождения`, `Успех`, and `Покрытие` make the two risk signals explicit instead of presenting two unlabeled bars.
- Interaction and accessibility: the run-outcome legend remains keyboard-operable; the date listbox was opened in production and `30 авг.` selected, changing the displayed pass rate from `80%` to `—` for a day without completed runs. The `Local Protection` row exposes one pass-rate score and exactly one progressbar for `77.8%` coverage. Complete accessible names remain present for all signals.
- Comparison history: the first audit found three actionable P2 defects: one pale cross-theme chart palette, the sparse pass-rate line dominating the chart as a vertical spike, and pass/coverage bars visually merging in risk rows. The fix introduced theme-specific semantic tokens, removed the percentage line and secondary axis, added a period-aware KPI, and retained a progress bar only for coverage. The post-fix combined evidence shows no remaining P0/P1/P2 mismatch in the requested desktop scope.
- Primary interactions tested: dashboard navigation, light/dark theme switching, Run Flow date-listbox selection and reset, risk-row progressbar count, upper and lower dashboard rendering. The signed-in production console contained zero errors and zero warnings.
- Verification: focused dashboard tests passed 10/10; full TMS adapter/UI tests passed 177/177; TypeScript, 306-file TMS architecture, optimized production build, Pages export, and production asset propagation passed.
- Residual test gap: this visual comparison is scoped to the user's 1280×720 desktop dashboard. Existing responsive CSS rules and test gates passed, but a same-target mobile screenshot was not part of this correction.

final result: passed

## Shared-step number, attachment preview, and history count — production hotfix

- Source visual truth: `/var/folders/m4/ss0ghsrd5dl5chxys5v0rgqm0000gn/T/TemporaryItems/NSIRD_screencaptureui_Ib8dBJ/Screenshot 2026-09-04 at 2.48.40 AM.png` (1490×1440 px), preserved in the combined evidence as `.design-qa/2026-09-04-shared-step-evidence-hotfix/comparison-full.png`.
- Implementation evidence: `.design-qa/2026-09-04-shared-step-evidence-hotfix/production-overview-collapsed.png`, `production-overview-expanded.png`, and `production-attachments-tab.png`, captured from the signed-in production route at a 1490×1440 CSS viewport in Russian dark mode. The implementation screenshots are 1490×1440 px at normalized browser capture density.
- State: `HOST-TC-397`, Overview and Attachments tabs, shared step 2 expanded, saved step image collapsed by default and then expanded through its dedicated outer chevron.
- Full-view comparison evidence: `.design-qa/2026-09-04-shared-step-evidence-hotfix/comparison-full.png` places the user-reported state and the live production implementation in one same-size input. Focused evidence: `.design-qa/2026-09-04-shared-step-evidence-hotfix/comparison-focused.png` keeps the attachment row, preview, shared-step rail, order number, and following scenario step readable in one comparison.
- Typography: the existing Falcon text scale, weights, line heights, and muted metadata colors remain consistent. The attachment title and size stay on one compact row; no technical loading copy or fallback filename block is visible.
- Spacing and layout rhythm: shared-step order `2` now owns a fixed gutter to the left of the purple rail and remains fully visible. The attachment chevron is outside the preview, the default state is one flat row, and expansion preserves the compact scenario rhythm instead of introducing the previous heavy container.
- Colors and tokens: existing dark-theme semantic tokens are preserved for the purple shared-step rail, teal expected-result rail, muted attachment chrome, and focus states. No new hard-coded accent palette or elevated card treatment was introduced.
- Image quality and asset fidelity: the saved image renders as the actual sharp production asset when expanded, supports the existing open-in-full-size action, and is not replaced with technical MIME text, a placeholder, CSS drawing, or duplicate preview shell.
- Copy and content: `Вложения 1` and `История 4` are derived from the selected case. The former default `История 20` value is absent. The Attachments tab lists the same step-owned image and contains no attachment-loading label.
- Interaction evidence: collapsed-by-default presentation, smooth explicit expansion, full-size action availability, Overview→Attachments navigation, and preserved attachment metadata were exercised in production. Reopening the Attachments tab displayed cached metadata without a user-visible reload state. The signed-in production console contained zero errors and zero warnings after these interactions.
- Comparison history: the reported P1/P2 defects were the shared-step order hidden by its rail, saved step media not represented consistently across Overview and Attachments, a visually heavy/technical expanded file block, repeated attachment fetch/loading UI, and the hard-coded history count. The production pass shows the order number in its own gutter, one collapsible media component in both surfaces, a real image preview, cache-backed metadata/access reads, and current-case counts. No actionable P0/P1/P2 finding remains in the requested scope.
- Verification: TypeScript, TMS architecture (306 files), focused attachment tests 6/6, full TMS adapter/UI tests 175/175, optimized production build, signed-in production interactions, and console checks passed.

final result: passed

## Shared-step insertion menu guide separation — final production pass

- Source visual truth: `.design-qa/shared-step-menu-2026-09-04/production-before.png` (1280×720, density 1, Russian locale, dark theme, fullscreen case editor, bottom `Добавить шаг` menu open). The shared-step purple guide entered the menu's rounded left edge because both started on the same horizontal coordinate.
- Implementation: `.design-qa/shared-step-menu-2026-09-04/production-after.png` (1280×720, density 1, identical route, viewport, theme, content, and interaction state). The add-trigger menu now starts 8px to the right of its anchor; measured production geometry places the shared guide at x=135 and the menu at x=137, fully outside the popup surface.
- Full-view comparison: `.design-qa/shared-step-menu-2026-09-04/production-comparison.png` (2560×720) preserves both complete states side by side. Focused comparison: `.design-qa/shared-step-menu-2026-09-04/menu-focused-comparison.png` (800×285) makes the corrected guide, rounded menu edge, `Общий шаг` label, and `тест 4` row directly readable.
- P2 comparison history: before the fix, the 3px shared-step rail reached into the popup corner and visually cut the shared-step insertion area. The fix adds a scoped horizontal offset only to `data-trigger="add"`; per-step action menus, popup width, vertical placement, and scenario geometry remain unchanged. Post-fix evidence shows the complete label and shared-step row unobstructed.
- Typography and copy: existing menu font sizes, weights, truncation, Russian strings, and item hierarchy are unchanged. Spacing and layout: only the 8px popup offset changed; border radius, row rhythm, and touch targets are preserved. Colors and tokens: the existing opaque Falcon menu surface, purple shared-step rail, borders, and shadow remain unchanged. Image quality: no raster, logo, or media assets participate in this control state.
- Interaction and accessibility: the trigger still exposes `aria-haspopup`, `aria-expanded`, and the menu relationship; opening the menu does not insert or modify a step. The exact production interaction was exercised without saving case data. The Browser reported zero console errors and zero warnings.
- Verification: focused shared-step tests passed 7/7; the full TMS adapter/UI suite passed 175/175; TypeScript, 305-file architecture, `git diff --check`, optimized build 61/61, and Pages export 60/60 passed. Frontend source `a088cfd12dd33b943348fcb52e0c1cf5b397b7d0` is served by Pages commit `dcfcf1e2`.

final result: passed

## Scenario media and bounded step actions — local release pass

- Source visual truth: `/var/folders/m4/ss0ghsrd5dl5chxys5v0rgqm0000gn/T/codex-clipboard-9a3fb18e-3ecc-4350-adc0-0d2b897453b3.png` (1646×1466 px) for the reported menu collision, plus the official Atlassian Confluence media-resize reference captured at `.design-qa/media-attachments-2026-09-04/source-atlassian-resize.png` (1280×720 px).
- Browser-rendered implementation: `.design-qa/media-attachments-2026-09-04/implementation-popup-and-media.png`, `.design-qa/media-attachments-2026-09-04/implementation-gallery-handles.png`, and `.design-qa/media-attachments-2026-09-04/implementation-attachments-gallery.png`, each captured from the real Falcon local workspace at a 1280×720 CSS viewport. Browser output was normalized to 1280×720 pixels; no density stretching was used.
- Full comparisons: `.design-qa/media-attachments-2026-09-04/popup-comparison.png` and `.design-qa/media-attachments-2026-09-04/media-resize-comparison.png` place each source beside the matching implementation state. The reported source was aspect-preserved and centered on a 1280×720 comparison canvas.
- State: Russian locale, light theme, fullscreen test-case document, scenario editing, one pending PNG in the first step, step action popup open, then the case-level Attachments tab with a separate pending PNG.
- Typography and copy: the media header uses the existing Falcon 9–11px metadata scale and truncates long filenames. Storage terminology, MIME labels, and technical download rows are absent; only filename, file size, disclosure, full-size, and delete actions remain.
- Spacing and layout: media is part of the document flow, bounded by its scenario or gallery container. The default widths are 430px in a step and 520px in the gallery, both clamped to the available parent width. Side handles update width in 24px keyboard increments or continuously by pointer while height remains automatic.
- Colors and tokens: the frame, header, controls, focus state, border, and shadow use existing case-surface tokens in both themes. The implementation introduces no new saturated media chrome or decorative asset.
- Image quality: PNG and video sources render directly with `object-fit: contain`, automatic height, and no crop or distortion. Hover/focus exposes two real resize handles; the comparison confirms the same proportional side-handle behavior as the Atlassian reference.
- Interaction verification: file chooser upload, pending image preview, full-size action, delete action presence, left/right keyboard resize (430px → 478px), disclosure collapse/expand, case-level gallery rendering, fullscreen layout, and dynamic menu placement were exercised in the in-app Browser. The screenshot state remained inside the scenario column and no longer crossed into Properties.
- P1 comparison history: the supplied Falcon state positioned the popup from the trigger's left edge, so it covered priority, type, estimate, and additional metadata. The icon menu now anchors from its right edge and measures available viewport space on open, resize, and scroll to choose top or bottom. Post-fix evidence is `implementation-popup-and-media.png`; the popup ends before the Properties rail.
- P2 comparison history: attachment rows previously rendered as filename-first technical controls with a fixed 190×118 preview. They now render as the actual image/video by default in scenario and Attachments contexts, with smooth disclosure and proportional resizing. Post-fix evidence is `implementation-gallery-handles.png` and `implementation-attachments-gallery.png`.
- Verification: focused scenario tests passed 11/11; full TMS adapters/UI passed 175/175; TypeScript, 305-file TMS architecture, `git diff --check`, and the optimized 61-page production build passed.
- Production rollout: frontend source `d337949990a890570edb0e0c476946b4584dfada` is served by Pages commit `82953740`. The static export completed 60/60 routes.
- Connected production evidence: `.design-qa/media-attachments-2026-09-04/production-popup-and-media.png` confirms the real pending image preview and an upward-opening step menu bounded by the scenario column; `.design-qa/media-attachments-2026-09-04/production-attachments-gallery.png` confirms actual media rendering in the case Attachments tab.
- Production safety and runtime: both uploads were temporary pending files used only for interaction QA; editing was cancelled and no test-case data was persisted. The production Browser reported zero console errors and zero warnings after the complete interaction path.

final result: passed in production

## Scenario hierarchy hotfix and shared-step persistence — final production pass

- Source visual truth: `/var/folders/m4/ss0ghsrd5dl5chxys5v0rgqm0000gn/T/TemporaryItems/NSIRD_screencaptureui_0UMccb/Screenshot 2026-09-03 at 11.51.33 PM.png` for the exact TestOps step geometry; `/var/folders/m4/ss0ghsrd5dl5chxys5v0rgqm0000gn/T/codex-clipboard-c22b1afc-ff8d-4f82-bcb9-c1c3c9c8ac77.png` and `/var/folders/m4/ss0ghsrd5dl5chxys5v0rgqm0000gn/T/codex-clipboard-84a3835a-6ab8-4601-8713-f548079914cd.png` for the reported Falcon detail/list failures.
- Combined review input: `.design-qa/scenario-hotfix-2026-09-04/scenario-hotfix-comparison.png` places the supplied TestOps hierarchy beside the real Falcon editor state containing one regular step with three technical substeps and one embedded shared step.
- Hierarchy and rhythm: the top-level action starts after an 18px disclosure rail and 25px number rail. Technical `1.1`–`1.3` rows begin at the main action origin and place their text another 50px inward. Sibling steps use a 3px rhythm; the old horizontal separators are removed.
- Disclosure: regular steps and shared-step blocks expose native chevron buttons with localized accessible names. Collapsing a regular step keeps the main action visible and hides technical substeps, expected result, test data, and attachments.
- Evidence: saved image and video attachments expose a disclosure control. Expanded media renders in a bounded 190×118 preview; several files remain reachable in one horizontal scroll strip, while the filename still opens the signed inline resource.
- Shared-step editor: the scenario canvas is aligned 28px from the left content edge rather than centered in a 920px paper. The title and scenario inputs suppress inherited blue focus outlines/shadows and use only the existing neutral active text rule.
- Priority: the listing priority column grows from 112px to 132px so the saturated `Критический` pill and icon fit without losing the final letter.
- P0 persistence root cause: migration 0019 allowed empty host action/result values for a live `sharedStepId` in HTTP and domain validation, but the original 0003 PostgreSQL checks still rejected those placeholders. Migration `0020_shared_step_placeholders.sql` makes both checks conditional on a non-null shared reference while preserving the strict non-empty rule for regular steps.
- Local browser states: `.design-qa/scenario-hotfix-2026-09-04/scenario-hotfix-local.png`, `.design-qa/scenario-hotfix-2026-09-04/scenario-reference-state-local.png`, and `.design-qa/scenario-hotfix-2026-09-04/shared-step-hotfix-local.png` cover nested editing, embedded shared content, disclosure controls, semantic metadata, and the left-aligned shared-step editor.
- Verification: frontend TypeScript, 304-file architecture, focused scenario 8/8, adapters/UI 175/175, attachments 4/4, and optimized 61-page build passed. Backend TypeScript, migration verification for 20 ordered migrations, focused PostgreSQL migration/staging/shared-reference tests 11/11, full suite 291/291, build, architecture, OpenAPI, and zero-warning lint passed.
- Production rollout: frontend source `a5850b30ee5ccc29f8fc5078b6edb4e84a5cd81b` is served by Pages commit `550c3a44`. Backend source `a271aab` is running on Railway deployment `7608c13e-a16e-4bbc-9c83-2a7058610f43`; its health check passed and its pre-deploy migration job applied exactly one migration after `TMS_MIGRATION_TARGET` advanced to `0020`.
- Physical database verification: both `test_case_revision_steps_action_check` and `test_case_revision_steps_expected_result_check` now explicitly accept an empty host placeholder only when `shared_step_id IS NOT NULL`. The exact failing PATCH shape is covered by the PostgreSQL integration regression without modifying the user's production case.
- Connected UI verification: the signed-in production Browser rendered the full `Критический` pill, dense separator-free scenario, regular-step disclosure, left-aligned shared-step editor, and neutral focus line. `.design-qa/scenario-hotfix-2026-09-04/scenario-hotfix-production.png` and `.design-qa/scenario-hotfix-2026-09-04/shared-step-hotfix-production.png` retain the final states. A fresh production tab reported zero console errors and zero warnings.

final result: passed in production

## Scenario density and shared-step editor correction — final local pass

- Source visual truth: `/var/folders/m4/ss0ghsrd5dl5chxys5v0rgqm0000gn/T/TemporaryItems/NSIRD_screencaptureui_Z5DKpn/Screenshot 2026-09-03 at 8.28.56 PM.png` for the compact TestOps scenario hierarchy, plus the two user-reported Falcon failure states at `/var/folders/m4/ss0ghsrd5dl5chxys5v0rgqm0000gn/T/TemporaryItems/NSIRD_screencaptureui_KBPqBk/Screenshot 2026-09-03 at 11.10.53 PM.png` and `/var/folders/m4/ss0ghsrd5dl5chxys5v0rgqm0000gn/T/TemporaryItems/NSIRD_screencaptureui_tvvGFS/Screenshot 2026-09-03 at 11.11.12 PM.png`.
- Combined comparison input: `.design-qa/shared-steps/revised-case-reference-comparison.png` places the TestOps reference beside the corrected Falcon case document. `.design-qa/shared-steps/revised-shared-menu-comparison.png` places the reported shared-step editor failure beside the corrected editor and popup.
- Density correction: scenario actions, technical substeps, expected results, shared references, attachments, and sibling steps now share a compact 3–7px vertical rhythm. Empty optional test-data controls are not rendered, and the visible `Обязательный шаг` checkbox/footer was removed while the existing persisted default remains intact.
- Creation narrative: `Описание` and `Предусловия` render as quiet read-only sections by default. The Markdown editor mounts only after the pencil action; Apply closes the editor, while Cancel restores the value captured at activation.
- Shared-step editor: the giant bordered paper/card was removed in favor of one continuous page surface. The action menu is fully opaque, isolated above the document, and limited to duplicate, delete, regular step, and step-with-expected-result actions.
- Nesting rule: shared steps cannot insert another shared step. Case scenarios retain shared-step insertion, while the dedicated shared-step editor explicitly disables that action and its divider/group.
- Visual evidence: `.design-qa/shared-steps/revised-create-menu.png`, `.design-qa/shared-steps/revised-shared-editor-menu.png`, `.design-qa/shared-steps/revised-shared-editor-dense.png`, `.design-qa/shared-steps/revised-shared-editor-two-steps.png`, and `.design-qa/shared-steps/revised-case-view-dense.png` cover create, edit, popup, multi-step, expected-result, and embedded shared-step states.
- Browser verification: a clean navigation after the final hot-reload produced zero new errors or warnings. The corrected screens were inspected at the same 1688px desktop width used by the supplied shared-step failure screenshot.

final result: passed locally

## Shared steps and scenario actions — final local pass

- Source visual truth: `/var/folders/m4/ss0ghsrd5dl5chxys5v0rgqm0000gn/T/TemporaryItems/NSIRD_screencaptureui_uNZGxj/Screenshot 2026-09-03 at 9.18.17 PM.png` for the shared-step hierarchy and `/var/folders/m4/ss0ghsrd5dl5chxys5v0rgqm0000gn/T/codex-clipboard-5cfa0e7e-2ed8-4271-b151-fb9738441f26.png` for the step action menu.
- Complete comparison: `.design-qa/shared-steps/design-qa-comparison-scenario.png` places the 1182×1286 source beside the Falcon implementation captured at the same 1182×1286 viewport. Focused menu comparison: `.design-qa/shared-steps/design-qa-comparison-menu.png` uses the source's 1164×816 dimensions.
- Composition: `Общие шаги` is a first-class global navigation destination with a quiet list/empty state, search, and one primary creation action. Its editor reuses the compact scenario language rather than introducing a second form system.
- Scenario hierarchy: shared references remain live in case revisions, render as a restrained violet rail/surface, and contain their own numbered actions and teal expected-result rail. Run creation materializes those live items into the immutable run snapshot.
- Step actions: every scenario row and shared reference exposes the same rounded keyboard-accessible popup for duplicate, delete, regular step, step with expected result, and shared-step insertion. The footer action opens upward inside the scroll owner so it is not clipped.
- Metadata: read-only status, priority, and type remain compact semantic pills. Edit triggers and listbox options are neutral controls; the menu has rounded corners, selected state, Arrow/Home/End/Escape behavior, and focus return without embedding colored pills in every option.
- Theme and density: light and dark editors were inspected. Typography follows the existing Falcon system stack, controls use the established compact scale, and the violet/teal accents preserve contrast without adding a second blue-heavy palette.
- P1 fixed during QA: demo-created shared steps were listed after save but could not be resolved after leaving the list because only the summary survived. A resource cache now retains the complete revision for demo insertion; connected mode still refetches by id and ETag.
- P2 comparison finding: the implementation has a narrower case document because Falcon retains its global navigation and project header, but the hierarchy, rails, numbering, popup geometry, and compact properties match the supplied reference without stretching or clipping.
- Browser interactions: create shared step, save, reopen, insert between case steps, duplicate/delete menu visibility, edit/view properties, light/dark theme, and 1182×1286/1164×816 viewport states were exercised in the in-app Browser.
- Verification: focused shared-step and scenario tests, the full frontend adapter/UI suite, TypeScript, architecture, optimized production build, backend test/build/architecture/OpenAPI/migration gates, and a clean post-restart browser console are required before release.

final result: passed

## Semantic test-case metadata pills — local final pass

- Source visual truth: `/var/folders/m4/ss0ghsrd5dl5chxys5v0rgqm0000gn/T/TemporaryItems/NSIRD_screencaptureui_Z5DKpn/Screenshot 2026-09-03 at 8.28.56 PM.png` (2270×1458 px), supplied by the user for the compact TestOps title/byline and property hierarchy.
- Implementation evidence: `.design-qa/metadata-pills-light-view-final.png` (731×623 px), `.design-qa/metadata-pills-ready-light.png` (731×623 px), `.design-qa/metadata-status-menu-dark.png` (731×623 px), and `.design-qa/metadata-pills-dark-view.png` (731×623 px). The in-app Browser viewport was 812×692 CSS px at DPR 2 and normalized its screenshots to the visible panel size.
- Combined comparison: `.design-qa/metadata-pills-comparison-final.png` places a 1230×1050 source crop, normalized to 731×623, beside the final Falcon light-theme implementation. The source and implementation differ in responsive viewport width, so the comparison judges the requested title/byline, property hierarchy, semantic color, radius, and density rather than desktop column proportions.
- State: Russian locale, development demo workspace, selected manual case. View mode verifies the Draft pill before `Создан`; edit mode verifies the custom lifecycle listbox; Ready was selected transiently to verify the same saturated green in the header and property control. Dark mode verifies the neutral Draft, saturated priority/type pills, and rounded status menu.
- Typography: the existing Falcon sans stack and compact 11–12px metadata scale are preserved. Labels remain muted and medium weight; pill values use a 650 optical weight without leaking the label color into their foreground.
- Spacing and layout rhythm: byline content is vertically centered with a 6×12px wrap gap. Read pills are 23–24px high with a full pill radius; edit triggers are 36px high with a 10px radius; menus use a 12px surface radius and 8px option radius.
- Colors and tokens: Draft is neutral graphite, Ready is solid `#13824a`, Deprecated is warning `#f3a712`, priority uses gray/blue/orange/red, and type uses teal/violet/warm amber. Dark equivalents remain solid and saturated instead of returning to translucent pastel fills. Estimate stays intentionally neutral.
- Image and icon fidelity: no photographic or branded asset is present in this metadata surface. Existing Lucide status, priority, type, estimate, and chevron icons are reused; manual type now uses the same hand icon in read and edit states.
- Copy and content: lifecycle, priority, type, and estimate keep the existing localized labels. The header order is `status → created → updated`, matching the requested reading sequence.
- Interaction and accessibility: custom buttons retain `aria-haspopup=listbox`, `aria-expanded`, selected option state, Arrow/Home/End/Escape behavior, and focus return. Opened the lifecycle editor in light and dark themes, selected Ready, closed without persisting the demo change, and confirmed no application console error.
- P1 found on the first narrow capture: the list QL field used z-index 20 while the responsive case inspector used z-index 12, so the background query field crossed the title area. Fix: responsive scrim/inspector now use z-index 59/60, above every listing toolbar and popover. Post-fix evidence is `.design-qa/metadata-pills-light-view-final.png`; the query field no longer overlaps the card.
- Verification: focused metadata/scenario tests passed 22/22; full TMS adapters/UI passed 175/175; TypeScript, 293-file TMS architecture, `git diff --check`, and the optimized 61-page production build passed. The temporary local visual-QA authentication bypass was fully reverted.

final result: passed

## Hierarchical test-case scenario editor — first local pass

- Source visual truth: `/var/folders/m4/ss0ghsrd5dl5chxys5v0rgqm0000gn/T/TemporaryItems/NSIRD_screencaptureui_Z5DKpn/Screenshot 2026-09-03 at 8.28.56 PM.png` (2270×1458 px), supplied by the user as the TestOps hierarchy and density reference.
- Implementation evidence: `.design-qa/scenario-editor-final.png` (1153×649 px), captured from the Falcon local route at a 1153×648 CSS viewport and DPR 2.2200000286102295. The browser normalizes screenshots to approximately CSS-pixel output; no density stretching was used.
- State: Russian locale, light theme, development demo workspace, selected manual test case, Scenario section editing, with one main action, two technical substeps, expected result, and attachment affordances visible.
- Full-view evidence: `.design-qa/scenario-editor-final.png` verifies the editor inside the real Falcon list/detail geometry. Focused comparison evidence: `.design-qa/scenario-editor-comparison.png` places the source Scenario crop and the implementation crop in one 1400×500 comparison input so hierarchy, typography, spacing, green result rail, and attachment placement remain legible.
- Typography: the existing Falcon system sans stack is preserved at 13px/1.55 for scenario copy, with 11–12px muted numbering and labels. Weight and contrast match the existing inspector hierarchy; no decorative font or oversized form label was introduced.
- Spacing and layout rhythm: the former stacked Markdown cards are replaced with a flat 44px number track, 30px auto-growing text rows, 1px interaction rules, and a 2px green expected-result rail. Top-level steps remain separated by one existing row token rather than nested rounded cards.
- Colors and tokens: all text, hover, focus, border, and action colors use the existing Falcon case tokens. The expected-result accent reuses the established restrained teal; no new saturated panel color, gradient, or floating surface was introduced.
- Image and icon fidelity: this editor contains no photographic or branded image asset. Attachment, add, required, and remove actions use the existing Lucide family and the production private-attachment UI; no custom SVG, CSS illustration, emoji, or placeholder art was added.
- Copy and content: Russian labels are task-oriented (`Название шага`, `Технический подшаг`, `Ожидаемый результат`, `Добавить шаг`). Raw Markdown controls and technical storage language are absent from the scenario UI.
- Interaction evidence: Enter created `1.1` and `1.2`; Backspace removed an empty `1.3`; Add Step created an editable top-level `2`; Remove Step restored the single-step state. Textareas grew with wrapped content, file-paste routing remained attached to action/result/data fields, and the Browser recorded zero console errors.
- P2 found in the first capture: the global textarea focus rule painted a rectangular blue outline around the otherwise flat action line. Fix: the scenario-specific focus state now suppresses the inherited outline and shadow while retaining a tokenized bottom rule. Post-fix evidence is `.design-qa/scenario-editor-final.png` and the focused comparison.
- Intentional first-iteration constraint: the current server contract owns attachments at the top-level test step, so action/result uploads render inside that scenario group after save rather than persisting an independent substep attachment owner. This preserves revision, run, and defect compatibility while shared steps and a deeper attachment schema remain deferred.
- Verification: focused inspector tests 29/29, full TMS adapters/UI 174/174, TypeScript, 293-file TMS architecture, optimized production build 61/61, and `git diff --check` passed. The temporary local visual-QA authentication bypass was fully reverted.

final result: passed

## Dashboard drill detail sheet — selected option 2

- Selected source: `/Users/mercuryrucks/.codex/generated_images/01a0440e-06cc-7502-bcc3-ba6fb932d6c7/exec-83af33f1-5c73-45c6-a169-870a8b024e66.png` (1487×1058). The existing Falcon shell and analytics route remain unchanged; only the dashboard drill experience and supporting categorical palette were redesigned.
- Complete comparison input: `.design-qa/dashboard-drill-sheet-comparison-final.png` places the full selected source beside the implemented Russian dark-theme state after normalizing the in-app Browser capture to the same 1487×1058 comparison size. `.design-qa/dashboard-drill-sheet-focused-final.png` compares the header, filters, distribution, and first table rows at readable density.
- Browser states: `.design-qa/dashboard-drill-sheet-local-desktop-final.png` and `.design-qa/dashboard-drill-sheet-local-light-1440x1024.png` were captured from a 1440×1024 CSS viewport (1297×922 captured pixels after the Browser's display normalization). `.design-qa/dashboard-drill-sheet-local-mobile-390x844.png` covers the 390×844 CSS state (351×760 captured pixels).
- Composition: the narrow right drawer is replaced by one full-width bottom sheet entering from the viewport bottom. It has the selected drag handle, rounded top edge, clear title and human-readable chips, primary actions, related entity tabs, a persistent refinement rail, a muted categorical distribution strip, and a dense results table. Raw workspace IDs, project IDs, entity names, and basis values are not rendered.
- Useful navigation: the header action opens the selected cohort in Test Cases, Runs, or Defects; individual rows open their exact case, run, or defect; and a project-scoped case cohort can create a run from the currently loaded filtered rows. Related tabs are disabled whenever the backend cannot express a truthful correlation instead of presenting fabricated data.
- Filtering and table behavior: search, checkbox facets, sort controls, exact row actions, empty state, cursor pagination, and server retry remain interactive. On mobile the actions stack, facets become two columns, the sheet owns the viewport, and the data table scrolls internally without document overflow.
- Color and hierarchy: the dashboard now uses restrained teal, plum, sand, olive, coral, and slate category tokens. Type, tag, coverage, status, and distribution surfaces are distinguishable without turning the screen into a saturated rainbow; light mode keeps the same semantic mapping on neutral surfaces.
- Accessibility and motion: the existing modal focus trap and focus restoration are preserved; Escape closes nested run creation first and then the sheet; tabs and primary actions are native buttons; table rows retain explicit names; the bottom-up transition respects reduced motion.
- Iteration history: the first implementation left a visually dead filter rail; it was replaced with real checkbox facets. The next pass exposed an unstyled/clipped search field; it now has an explicit search role and bounded control styling. The final combined comparison found no remaining P0, P1, or P2 visual or interaction issue in the selected scope.
- Browser interactions passed: search and empty state, Overview/Test Cases/Runs/Defects tabs, direct Test Cases navigation, exact row action, create-run dialog, nested Escape handling, desktop dark, desktop light, and 390×844 mobile. The local application showed no error state during these flows.

final result: passed

## Hybrid dashboard risk-header correction — final production pass

- Source visual truth: `/Users/mercuryrucks/.codex/generated_images/01a0440e-06cc-7502-bcc3-ba6fb932d6c7/exec-97fdd115-e101-4660-be11-a1d73cd5c28f.png` (1488×1058). Pre-fix connected implementation evidence: `.design-qa/hybrid-dashboard-production-dark-1488x1058.png` (1488×1058, Russian, dark theme, Project scope, 30 days).
- P2 finding: the fixed 48–75px risk-signal columns rendered full Russian headers, so `Процент прохождения`, `Покрытие`, `Провалено кейсов`, `Заблокировано кейсов`, and `Дефекты` visually collided. Body values and horizontal mobile scrolling remained intact.
- Fix: visible labels now use the compact reference vocabulary (`Проход`, `Покр.`, `Провалы`, `Блокеры`, `Дефекты`). Every column header retains its complete localized accessible name and native tooltip. Header cells also enforce `min-width: 0`, single-line clipping, and ellipsis, making cross-column overlap impossible under longer localization.
- Responsive contract: the ≤720px rule retains a 720px table floor inside the horizontally scrollable portfolio card, so all pass, coverage, failure, blocker, and defect columns remain reachable at 390px without document-level overflow.
- Source verification: focused dashboard tests cover compact EN/RU copy, complete `aria-label` and `title` values, non-overflow header CSS, and the narrow internal-scroll rules. Focused dashboard tests passed 9/9; TMS adapter/UI tests passed 159/159; TypeScript, 275-file architecture, and `git diff --check` passed.
- Connected verification: production source `681eafc35eebd61811eb297fa3d766a7ce442fa6` was published by Pages commit `765fabaa`. At exactly 1488×1058, the live Russian header rendered `Компонент / Проход / Покр. / Провалы / Блокеры / Дефекты`; every compact signal retained its complete localized `aria-label` and `title`, with `overflow: hidden`, `text-overflow: ellipsis`, and `white-space: nowrap` computed in the Browser. No cross-column overlap remained.
- Mobile verification: at exactly 390×844, both document and body stayed 390px wide. The risk card measured 368px client width and 720px scroll width; it reached the exact 352px maximum internal scroll, exposing pass, coverage, failures, blockers, open defects, and critical defects without document-level overflow.
- Final gate: TypeScript, 275-file architecture, focused dashboard 9/9, full TMS adapters/UI 159/159, `git diff --check`, optimized production build 61/61, and Pages export 60/60 passed after the correction. The signed-in production console remained clean.

final result: passed in production

## Scenario density and shared steps — final production pass

- Release sources: backend `033c439943c2590a04f749b073e1f23b03dc1adc`; frontend `08d3d61b7db67449198a6c06f7ae058a86a3634d`; Pages publication `000553c1`.
- Backend rollout used two compatible stages. Deployment `0cc8edf1-e599-47fb-82e9-bcca3802d1d6` installed the runtime while schema 0018 remained valid; deployment `7d6ef6fb-e893-4792-bca9-e781572b8336` then applied migration 0019 and became healthy. Its pre-deploy log recorded exactly one applied migration.
- Connected API verification: authenticated production navigation issued `OPTIONS 204` and `GET 200` for `/api/v1/projects/project_59c48ce2121f461c8e604f35a9706aa3/shared-steps` on deployment `7d6ef6fb-e893-4792-bca9-e781572b8336`; the GET completed in 12 ms. `/api/v1/health` returned the expected `ok` envelope after both stages.
- Production UI verification: the signed-in in-app Browser loaded the new `Общие шаги` destination, empty list state, continuous shared-step editor, dense scenario row, and opaque action menu. The menu exposed duplicate, delete, regular step, and step with expected result only; nested shared-step insertion and `Обязательный шаг` were absent.
- Creation verification: a new test-case draft initially rendered `Описание` and `Предусловия` as quiet read-only sections. Activating `Изменить Описание` mounted the Markdown editor and attachment control; no editor existed before that explicit action.
- Production visual evidence: `.design-qa/shared-steps/production-shared-editor-menu-1688x1170.png` and `.design-qa/shared-steps/production-create-description-editor-1688x1170.png`. The complete same-width reported-state/production comparison is `.design-qa/shared-steps/production-shared-menu-comparison.png`.
- Final connected console check: zero errors and zero warnings were recorded throughout shared-step navigation, editor menu, test-case creation, and Markdown activation.

final result: passed in production
