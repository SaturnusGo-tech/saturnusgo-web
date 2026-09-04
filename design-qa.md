# Design QA — Falcon test-suites and test-runs bugfix

## Comparison target

- Established Falcon test-case visual truth: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-suite-run-bugfix/01-reference-test-cases-dark.png`.
- Suite list before/after, light theme: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-suite-run-bugfix/16-suites-before-after-light.jpg`.
- Suite configuration before/after, dark theme: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-suite-run-bugfix/17-suite-config-before-after-dark.jpg`.
- Test-runs before/after, light theme: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-suite-run-bugfix/18-runs-before-after-light.jpg`.
- Test-case reference versus final test-run, dark theme: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-suite-run-bugfix/19-reference-cases-vs-runs-dark.jpg`.
- Focused run-list comparison: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-suite-run-bugfix/20-focused-run-list-before-after-light.jpg`.
- Production route: `https://tms.saturnusgo.com/testcases/umbrella-home/work/?projectId=project_59c48ce2121f461c8e604f35a9706aa3&release=21ce78dc`.

## Viewport and state

- Stored source and implementation captures: 1280 × 720 px.
- Combined full-view comparisons: 2560 × 720 px; focused run-list comparison: 1240 × 720 px.
- Production state: authenticated `Umbrella-Host` workspace, suite `HOST-1 · Смоук релиза`, run `HOST-TR-23`, case `HOST-TC-118`.
- Verified states: suite list, suite detail, suite configuration drawer, run list, selected run case, light theme, dark theme, keyboard focus treatment, and production console.

## Findings

No actionable P0, P1, or P2 visual or interaction differences remain.

- **Primary actions:** `Новый сьют` and `Запустить сьют` keep the Falcon action-blue background with white labels and white icons in both themes.
- **Suite editor hierarchy:** the former all-open form is now an editorial document. The suite name is the dominant title; `Описание` and `Как собирать кейсы` are calm sections with pencil actions and reveal their controls only for editing.
- **Case collection:** the shared case list remains inside suite configuration, with the same ID, lifecycle, title, component, priority, estimate, and type-icon language as the main test-case list.
- **Run-list fidelity:** priority and test type occupy separate fixed columns. Priority uses filled semantic triangles; manual and automated types use their dedicated icons without collision.
- **Status treatment:** run states use saturated, high-contrast pills. `Пройден`, failed, blocked, in-progress, skipped, and not-run states share one semantic palette across the navigator and run detail.
- **Focus treatment:** blue square outlines were removed from suite controls, run controls, inputs, and the global shell. Keyboard focus remains visible as a restrained neutral inset line instead of a second blue border.
- **Typography and density:** suite headings, editorial labels, run metadata, case titles, IDs, and table rows follow the established compact Falcon hierarchy. Long titles truncate inside their own column and do not push status or type controls.
- **Theme parity:** light and dark production captures preserve the same hierarchy, semantic colors, and spacing; no theme-specific black-on-blue or gray-on-blue action label remains.
- **Runtime:** no production console error was recorded in the verified journeys.

## Visual comparison result

`16-suites-before-after-light.jpg` confirms the corrected white action labels while preserving the accepted suite-detail layout.

`17-suite-config-before-after-dark.jpg` shows the material hierarchy change: the dense field matrix becomes a large editable title followed by pencil-controlled description and collection-method sections.

`18-runs-before-after-light.jpg` and `20-focused-run-list-before-after-light.jpg` confirm separated icon columns, filled priority markers, brighter lifecycle pills, and the absence of blue square focus outlines.

`19-reference-cases-vs-runs-dark.jpg` confirms that test cases and test runs now read as parts of the same Falcon system while retaining their different operational content.

## Iteration history

1. Reproduced the incorrect primary-label contrast and the dense suite configuration form in production.
2. Rebuilt suite configuration around the test-case editorial hierarchy and kept the reusable embedded case list.
3. Split run-list priority and type into independent columns, replaced outline warning glyphs with filled triangles, and unified saturated execution states.
4. Production QA found one remaining blue keyboard outline on the global navigation. It was replaced with a neutral inset focus treatment and published in a second scoped Pages release.
5. Rechecked light and dark themes, computed action/icon colors, navigator geometry, focus styles, and the production console. The post-fix pass found no P0/P1/P2 issue.

## Engineering verification

- [x] `npm run typecheck`
- [x] `npm run test:tms-adapters` — 183/183 passed
- [x] `npm run build`
- [x] scoped production static export and Pages publish from source `21ce78dcdf8b75102a506d31cc067be553dd3a80`
- [x] production suite actions, suite configuration, run navigator, and run detail
- [x] light and dark production renders
- [x] production console — 0 errors
- [x] `git diff --check`

## Follow-up polish

- P3: no follow-up is required for this bugfix iteration. Additional suite actions can reuse the new editorial section pattern as they are introduced.

final result: passed
