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
