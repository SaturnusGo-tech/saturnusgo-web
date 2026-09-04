# Design QA — Falcon reports and defect detail

## Comparison target

- Source visual truth: established Falcon test-case list and detail at `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-reports-redesign/02-reference-test-cases-light.jpg`.
- Final report list: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-reports-redesign/07-production-final-reports-list-light.png`.
- Final defect overview: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-reports-redesign/08-production-final-defect-overview-light.png`.
- Final expanded attachment: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-reports-redesign/10-production-final-attachment-expanded-light.png`.
- Full-view list comparison: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-reports-redesign/11-comparison-reference-and-reports-list.png`.
- Full-view detail comparison: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-reports-redesign/12-comparison-reference-and-defect-detail.png`.
- Responsive evidence: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-reports-redesign/13-production-defect-attachments-820px.png`.
- Production route: `https://tms.saturnusgo.com/testcases/umbrella-home/work/?projectId=project_59c48ce2121f461c8e604f35a9706aa3&release=72ae0a65`.

## Viewport, density, and state

- Desktop source and implementation captures: 1087 × 814 px, matching CSS viewport 1087 × 814 at device scale 1.
- Combined comparison images: 2174 × 814 px; both halves retain the same 1087 × 814 crop without rescaling.
- Responsive capture: 820 × 900 px at device scale 1; the temporary viewport override was reset after the test.
- Theme: authenticated production, light mode, `Umbrella-Host`, report `HOST-BUG-021`.
- States checked: report list, selected defect overview, attachment tab, expanded image, delayed attachment hydration, and narrow viewport.

## Findings

No actionable P0, P1, or P2 differences remain.

- **Information architecture:** the report list now uses the same dense list-plus-inspector structure as test cases. Defect evidence is absent from rows and available only in the selected defect card.
- **Typography:** Geist and the existing Falcon type tokens are preserved. Keys are quiet gray, titles carry the primary weight, supporting labels are smaller, and long report titles truncate without moving adjacent columns.
- **Spacing and layout rhythm:** table rows, toolbar height, selected-row treatment, inspector header, tab strip, two-column overview, and section gaps follow the test-case reference. No redundant cards or large empty gutters were introduced.
- **Colors and tokens:** status, severity, priority, expected-result, and actual-result states use saturated semantic tokens with readable foreground contrast in the light theme. Neutral metadata stays visually subordinate.
- **Image quality:** the defect screenshot renders as the real private asset, keeps its aspect ratio, remains sharp, and expands inside a stable media surface. No placeholder, CSS recreation, or technical filename-only row replaces it.
- **Copy and content:** report labels are domain-readable (`Описание`, `Фактический результат`, `Ожидаемый результат`, `Контекст выполнения`, `Свойства`, `Расположение`, `Метки`). Raw IDs remain only where they are operational evidence.
- **Icons:** Lucide icons use one stroke family and align with existing Falcon actions. Severity uses the same filled visual signal as other operational lists.
- **Interactions:** search, row selection, overview/attachment tabs, YouTrack link, test-run link, disclosure, full-size media action, and close action are present. The attachment tab now survives background defect hydration instead of reverting to overview.
- **Responsiveness:** at 820 px the defect card becomes the primary readable surface; controls do not overlap, the attachment header remains on one hierarchy, and the expanded image stays within its content width.
- **Accessibility:** headings, table semantics, tab navigation labels, link destinations, image alt text, expanded state, and named controls are exposed in the browser accessibility tree. Focus remains visible without the former aggressive double-blue outline.
- **Runtime:** the final production journey produced zero console warnings or errors.

## Full-view comparison evidence

`11-comparison-reference-and-reports-list.png` shows that the final report list carries the same compact shell, hierarchy, row density, muted IDs, selected-row behavior, and semantic status treatment as the test-case reference.

`12-comparison-reference-and-defect-detail.png` shows that the defect card uses the same inspector proportions, dominant title/key row, metadata line, tab strip, narrative column, and property rail while adapting content to a bug report.

## Focused comparison evidence

`10-production-final-attachment-expanded-light.png` verifies the media-specific requirement at readable scale: the disclosure sits outside the preview, filename and size stay compact, the actual screenshot is rendered, and resize/full-size actions remain available.

`13-production-defect-attachments-820px.png` verifies the same state at the narrow desktop/tablet breakpoint. No additional crop was required because the relevant controls and the whole media width are legible in the captured viewport.

## Comparison history

1. The initial report implementation matched the list/detail hierarchy, but the narrow toolbar hid metric labels and the attachment component inherited unresolved test-case CSS variables.
2. Metric labels were restored at the target viewport and report-surface aliases were added for the shared attachment tokens. The next production capture rendered the list labels and the attachment figure.
3. Production interaction QA found a P1 behavior issue: after opening `Вложения`, background defect hydration remounted the detail component and returned the user to `Общее`.
4. The selected detail tab was lifted to the stable report workspace. A regression test now requires the tab state to live outside the refreshable defect resource.
5. Post-fix production QA kept `Вложения` active for more than eight seconds through resource hydration, expanded the real screenshot, repeated the check at 820 px, and found no remaining P0/P1/P2 issue.

## Engineering verification

- [x] `npm run typecheck`
- [x] `npm run test:tms-adapters` — 186/186 passed
- [x] focused report tests — 3/3 passed
- [x] `npm run build`
- [x] scoped Pages release from source `72ae0a65202b2bc61bc6cb92e1764b91c4f4f36f`
- [x] production report list and defect overview
- [x] production attachment hydration and expansion
- [x] 1087 × 814 and 820 × 900 viewport checks
- [x] production console — 0 errors and 0 warnings
- [x] `git diff --check`

## Follow-up polish

- P3: no follow-up is required for this iteration. Future report filters can reuse the established test-case filter control without changing this hierarchy.

final result: passed
