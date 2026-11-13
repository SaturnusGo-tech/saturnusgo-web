# Defect report implementation review — 2026-11-13

**Status: PASS for the requested frontend slice.** No production deployment.

## Reference and viewport

Approved source: `/Users/mercuryrucks/.codex/generated_images/01a07862-f88a-7701-bf0e-179ddf13e9b1/exec-15506e63-7a8c-42e7-a6b6-825ceb243f74.png`.
Source and implementation compared together at 1589 × 990 CSS pixels. The existing Falcon navigation, branding, theme tokens and live content rendering are retained; this is an implementation of the approved composition, not a raster embedded as UI.

Evidence directory: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/output/falcon-defect-report-20261113`.

- `reference-comparison.jpg`: full source/implementation side by side.
- `context-comparison.jpg`: focused execution-context comparison, including the detached failed-step icon.
- `dark-ru-final.png`, `light-en-final.png`: desktop themes/locales.
- `desktop-1280-dark.png`: compact laptop viewport.
- `mobile-light-top.png`, `mobile-light-bottom.png`: 390 × 844, context and bottom properties after scrolling.
- `status-tooltip-fixed.png`: pointer hover anchored directly above the status icon; both center at x=306 with a 7px gap.
- `comment-expanded.png`: actual existing rich editor after opening and typing a draft.

## Findings and corrections

1. Initial header/body/list typography was too small relative to the approved hierarchy. Increased report-owned typography and adjusted list/detail proportions.
2. Long Russian reproducibility label wrapped awkwardly. Used the approved shorter label «Повторяемость» and adjusted property tracks.
3. Initial preview size queries did not match: esbuild scopes named container identifiers per CSS module; Next production CSS preserves them. Report-owned queries now use the nearest size container, which is the report article. Both preview and production retain the same responsive boundary.
4. Empty connector links duplicated a visible integration heading. Opt-in `hideEmpty` suppresses only the ready/empty state in this rail; available connections, loading and errors remain.
5. Tooltip was anchored to the full list row and appeared over its center. It now anchors to the trailing status icon only; no extra button or tab stop was added.
6. Failed-step marker stays outside the provenance connector. The line only joins the two gray source nodes.

## Verified behavior

- Listing contains priority, title and trailing semantic status icon; no visible key/status text/assignee. Selection remains keyboard-accessible, the status remains in the accessible row name, and pointer hover on the status icon reveals its tooltip.
- Context appears first. Original run and immutable run-item snapshot are loaded through existing scoped data adapters. Original environment/build are distinct from the retest fixture.
- Original-run callback produced `{runId:"run-original",runItemId:"item-original"}` in the local preview.
- Long names wrap without page-level horizontal scrolling. Document width equals viewport width at 1589, 1280 and 390; mobile report panel also has no horizontal overflow.
- Context/body/properties scroll to the bottom at 390 × 844. Header and tabs remain available, and Back returns to the list.
- General/Attachments tabs switch to their correct panels; empty attachments state renders.
- Compact comment prompt opens the real Markdown editor, focuses it and enables Send after typing. No comment was submitted to a real service.
- Existing comments, replies, attachments, archived permissions, retest actions and shared links are retained; automated tests cover relevant state and stale-response paths.

## Validation

- `npm run typecheck`: passed.
- `npm run architecture:tms`: passed, 2778 files.
- `npm run check:tms-contract`: passed; generated contract unchanged.
- `npm run test:tms-adapters`: passed across all script suites.
- Focused final report/context tests: 59 passed, 0 failed.
- `npm run build`: passed (standard Next standalone production build).
- `git diff --check`: passed.
- Pre-publish Worker suite: 164/165 passed; one browser fixture cleanup failed with `ENOTEMPTY` while removing a temporary Chrome profile. Its complete relay test file passed on rerun (9/9); no Worker code changed.

## Limits and existing warnings

Browser verification used actual production components with isolated, read-only demonstration fixtures. No authenticated production data or physical desktop/mobile app was exercised. No backend, migrations or transport contract changed. Repository lint is a placeholder and was not represented as an actual lint check.

The existing shared HeroUI/React development shell emits a `ref` warning; existing shared native view-transition code can report a skipped-transition AbortError. These were not introduced by the changed slice (both paths exist in HEAD). The standard production build succeeds with existing optional dependency/autoprefixer warnings. Static export was not claimed: the repository's dynamic home-map API route requires its separate export preparation workflow.
