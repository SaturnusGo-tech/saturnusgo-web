# Design QA — Falcon test-suites redesign

## Comparison target

- Baseline suite list and detail: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-test-suites-redesign/01-before-suite-screen.png`.
- Baseline suite case picker: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-test-suites-redesign/03-before-suite-case-picker.png`.
- Established Falcon visual truth: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-test-suites-redesign/04-reference-case-screen.png`.
- Final production detail, light theme: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-test-suites-redesign/19-production-suite-screen-light-final.png`.
- Final production editor, light theme: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-test-suites-redesign/20-production-suite-config-light-final.png`.
- Final production detail, dark theme: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-test-suites-redesign/21-production-suite-screen-dark-final.png`.
- Final production editor, dark theme: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-test-suites-redesign/22-production-suite-config-dark-final.png`.
- Combined reference comparison: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-test-suites-redesign/23-reference-vs-suite-final.png`.
- Combined editor comparison: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-test-suites-redesign/24-before-vs-config-final.png`.
- Production route: `https://tms.saturnusgo.com/testcases/umbrella-home/work/?projectId=project_59c48ce2121f461c8e604f35a9706aa3`.

## Viewport and state

- Browser viewport reported by the app session: 1087 × 814 CSS px at DPR 2.
- Stored browser captures: 1280 × 720 px after the in-app browser's capture normalization. Source and implementation captures use the same normalized dimensions.
- Combined comparisons: 2624 × 720 px, with a 16 px neutral gutter.
- Production state: authenticated `Umbrella-Host` workspace, suite `HOST-1 · Смоук релиза`, one currently available fixed case.
- Verified states: suite selected, empty suite search, suite editor open, exact-case mode, dynamic-tag mode, run confirmation open, case navigation, light theme, and dark theme.

## Findings

No actionable P0, P1, or P2 visual or interaction differences remain.

- **Typography:** the list rail, detail title, metadata, section headings, property labels, table headers, and case rows now reuse the compact Falcon hierarchy established by the test-case screen. Weights stay restrained and long case titles truncate without colliding with adjacent columns.
- **Spacing and layout rhythm:** the old developer table and narrow nested forms were replaced by a stable split workspace, compact suite rows, a calm document surface, and an edge-to-edge right drawer. The editor uses one continuous layout instead of stacked square cards.
- **Colors and tokens:** selected rows, borders, surfaces, text, buttons, lifecycle pills, and priority pills inherit the same theme variables as the reference test-case experience. Both production themes preserve contrast and semantic meaning.
- **Imagery and assets:** no new decorative imagery was required. The existing Falcon mark and Lucide icon family are preserved; no emoji, placeholder art, or hand-drawn SVG was introduced.
- **Copy and content:** suite name, key, type, dates, description, filter mode, tags, available case count, component, priority, and estimate come from real production data. Internal IDs are not exposed as explanatory UI.
- **Case-list fidelity:** one reusable `EmbeddedCaseList` now renders case rows in suite detail, suite configuration, and the run-scope picker. It carries the same ID, lifecycle, title, component, priority, estimate, and type-icon language as the primary test-case listing.
- **Interactions:** suite search shows a real empty state; configure opens the drawer; exact-case checkboxes update the selected count; dynamic mode reveals required tags; cancel leaves production data unchanged; the suite case opens its main test-case card; launching the suite opens the run confirmation.
- **Count consistency:** QA found a stale summary count that displayed two cases while only one case was available. The list rail and run confirmation now consume the already hydrated suite detail, so all visible counts consistently show one available case.
- **Responsive and accessibility:** the embedded list uses container-aware column reduction, horizontal containment, named landmarks, labelled inputs, pressed states, accessible row controls, and semantic text in addition to color. Focus rings remain visible in both themes.
- **Runtime:** no runtime error surfaced during the verified browser journeys. The production build completed successfully; the only build warning is the pre-existing unrelated methodology stylesheet `align-items: end` compatibility warning.

## Visual comparison result

`23-reference-vs-suite-final.png` places the established test-case screen and final test-suite screen in one image. The global chrome, rail density, selected-row treatment, title scale, metadata rhythm, separators, semantic pills, and document spacing read as one Falcon system. Suite-specific scope information is an intentional product difference.

`24-before-vs-config-final.png` compares the previous configuration experience with the final drawer. The final version has a clearer title hierarchy, a stable two-column basic-information row, an explicit exact/dynamic mode choice, and the same complete case-list component used elsewhere.

## Iteration history

1. Initial implementation replaced the dev suite list/detail and introduced the shared embedded case list.
2. Local visual QA found a duplicate nested border around the editor search field. Selector specificity, minimum height, and border ownership were corrected, then rechecked in light and dark themes.
3. Production QA found a stale suite summary count. The rail and run flow were changed to reuse the hydrated suite detail; the final production check now shows `1` in the rail, `1 кейс` in the card, and `Запустить ран · 1` in the launch dialog.
4. Final combined comparisons found no remaining P0/P1/P2 issue.

## Engineering verification

- [x] `npm run typecheck`
- [x] `npm run test:tms-adapters` — 180/180 passed
- [x] `npm run build:once`
- [x] production static export and Pages publish
- [x] production navigation, search, selection, mode switch, case open, and run dialog
- [x] light and dark production renders
- [x] `git diff --check`
- [x] architecture check reports only three pre-existing unrelated files over the 200-line policy; the new suite files introduce no architecture violation

## Follow-up polish

- P3: if a dedicated tablet visual reference is supplied later, the current container breakpoints can be tuned against that exact target; no tablet-specific mismatch is known in this iteration.

final result: passed
