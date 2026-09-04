# Design QA — Falcon test-runs redesign

## Comparison target

- Source visual truth: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-test-runs-redesign/02-reference-test-case.png` — the established Falcon test-case listing and detail-card design.
- Baseline run screen: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-test-runs-redesign/01-before-test-run.png`.
- Rendered implementation: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-test-runs-redesign/03-production-redesign.png`.
- Additional light-theme evidence: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-test-runs-redesign/07-production-redesign-light.png`.
- Full-view comparison input: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-test-runs-redesign/04-reference-vs-redesign.png`.
- Focused detail comparison: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/.tms-release-candidate.IJ0rMm/.design-audit/2026-09-04-test-runs-redesign/06-focused-detail-comparison.png`.
- Production route: `https://tms.saturnusgo.com/testcases/umbrella-home/work/?projectId=project_59c48ce2121f461c8e604f35a9706aa3&release=49476613-qa`.

## Viewport and normalization

- Viewport: 1280 × 720 CSS px.
- Device density: DPR 1.
- Source pixels: 1280 × 720.
- Implementation pixels: 1280 × 720.
- Full comparison pixels: 2560 × 720.
- Density normalization: none required; source and implementation were captured from the same in-app browser at the same CSS viewport and density.
- State: production workspace `Umbrella-Host`, active run `HOST-TR-23`, selected completed manual case, dark theme. A second production capture verifies the same screen in light theme.

## Findings

No actionable P0, P1, or P2 differences remain.

- **Fonts and typography:** the run screen now follows the reference hierarchy: compact 10–13 px listing metadata, 14 px reading text, a 20–27 px case title, restrained 500–650 weights, matching line height, antialiasing, truncation, and long-title wrapping.
- **Spacing and layout rhythm:** the flat developer table was replaced with the reference split workspace, compact 48 px list rows, calm section gaps, matching single-pixel dividers, compact radii, and a two-column detail body with a properties rail. No content overlaps or persistent controls are clipped at the target viewport.
- **Colors and visual tokens:** both themes reuse Falcon's established surface, border, selection, text, primary, success, warning, and danger tokens. Statuses remain semantically distinct without introducing a new palette.
- **Image quality and asset fidelity:** no new imagery was required. The existing Falcon mark and Lucide icon family remain unchanged; no CSS art, emoji, placeholder image, or approximate SVG was introduced.
- **Copy and content:** environment, build, progress, revision, priority, type, estimate, case title, description, preconditions, actions, expected results, actual results, and execution statuses are sourced from real run data. No technical identifiers were added beyond the already meaningful run/case keys.
- **Icons and affordances:** priority, type, status, copy, archive, search, pass, fail, block, evidence, defect, and pagination controls use the existing icon family and retain labels or accessible names.
- **States and interactions:** verified the active/history switch, run picker, case search, filtered result, case selection, selected-row transition, dark theme, and light theme. Search narrows the real run collection without changing the selected case; selecting a filtered case loads its immutable snapshot and properties.
- **Accessibility:** list and detail landmarks remain labelled, interactive controls expose names, status is not communicated by color alone, keyboard focus styles and reduced-motion fallbacks are preserved.

## Full-view comparison evidence

`04-reference-vs-redesign.png` places the established test-case screen and the new test-run screen in one 2560 × 720 image. The major-region proportions, dense left-hand listing, selected-row treatment, title hierarchy, metadata line, content rhythm, and right-hand reading surface now share the same Falcon identity. Run-specific progress, execution status, and result content are intentional product differences.

`05-before-vs-after.png` records the structural improvement from the wide developer table to the reference-aligned list/detail execution experience.

## Focused comparison evidence

`06-focused-detail-comparison.png` compares the readable detail regions directly. Heading scale, metadata pills, section labels, text rhythm, semantic colors, divider treatment, and content density are consistent. The implementation uses a wider case-list column so run status remains visible; the smaller detail width is an intentional allocation, not drift.

## Comparison history

1. **Initial QA pass:** no actionable P0/P1/P2 mismatch was found after implementation. No visual fix was required after the first combined comparison.
2. **Theme follow-up:** the same production screen was switched through Falcon settings and captured in light mode. Surface hierarchy, borders, selected state, semantic pills, and text contrast remained consistent.
3. **Interaction follow-up:** filtered `HOST-TC-114`, selected the result, and opened the run picker. All three states remained aligned and collision-free.

## Implementation checklist

- [x] Test-run case list matches the established Falcon list density and hierarchy.
- [x] Run selector and progress remain compact and readable.
- [x] Detail header mirrors the test-case detail card.
- [x] Description, preconditions, and scenario use the same content hierarchy.
- [x] Status, priority, type, estimate, environment, build, and progress remain visible.
- [x] Execution results and actions retain real run behavior.
- [x] Dark and light production states verified.
- [x] Search, selection, and run-picker interactions verified.
- [x] Typecheck, 178 TMS tests, and production static export passed.

## Follow-up polish

- P3: a future dedicated tablet reference could be used to tune the existing single-column breakpoint more precisely; no tablet-specific source visual was supplied for this iteration.

final result: passed
