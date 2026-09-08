# Falcon dashboard redesign — design QA

final result: passed

## Visual truth and state

Selected generated references are in `/Users/mercuryrucks/.codex/generated_images/01a07862-f88a-7701-bf0e-179ddf13e9b1/`:
- `exec-d7ad3000-f97f-4358-9ad0-65614b75076f.png` — dark overview, 1586 × 992.
- `exec-e53d29e2-3761-4174-81fd-1b9089f8d03f.png` — light overview.
- `exec-79a8eabb-13a9-4ff4-abf5-faa818f4858d.png` — marketplace, 1513 × 1040.
- `exec-cef8718d-9d3d-4ddd-8083-3acf0abfd5f1.png` and `exec-76004484-0a0b-4093-a5d0-e158da047762.png` — complete widget families.

The latest approved product correction supersedes the original overview composition: seven standalone operational metrics are now two pages inside Freshness. There are 29 installable widgets, grouped 3 / 7 / 11 / 8. The previous illustrative values and decorative graphics are not treated as production data or exact artwork to reproduce.

Implementation: the actual authenticated Falcon application on localhost:3000, using the normal authenticated API transport to production data through a loopback-only development proxy. The proxy is outside the repository and is never included in the production export. No mocked analytics or browser state injection was used.

Evidence directory: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/output/dashboard-redesign-20260908/`.
- Overview: `01-overview-light.jpg`, `02-freshness-page-two.jpg`, `07-overview-dark.jpg`.
- All enabled widgets: `08-all-top-dark.jpg`, `09-all-bottom-dark.jpg`; DOM verification counted exactly 29 widgets across four sections, with no outer widget overflow.
- Marketplace: `06-catalog-light.jpg` (initial comparison), `10-catalog-dark.jpg` (final).
- Combined source/render inputs: `comparison-overview.jpg`, `comparison-store.jpg`, `comparison-store-final.jpg`.
- Documentation contact sheet: `docs-contact-sheet.jpg`; all 13 source captures are published under `public/falcon/docs/2026-09/dashboard-v2-*.jpg`.

Captured CSS viewports: 1087 × 814 and 1280 × 720, screenshot pixels equal the CSS viewport (1×). Reference rasters have no reliable CSS density metadata; combined comparison sheets fit each source and render to the same comparison column width, preserving aspect ratio. This is a comparison of the approved visual direction and responsive behavior, not a claim of pixel identity between different viewport sizes. Theme, content and composition differences are explicitly intentional as described above.

## Comparison iterations and fixes

1. P2 — excessive empty grid tracks: the measurement hook assumed a 12px gap while the new layout used 16px. It now reads actual track and gap values. Dense packing fills available row space. Rechecked in the later overview/library and all-widget captures.
2. P2 — operational widgets occupied an extra mostly empty row. Freshness and the retest hero use compact natural widths around the wider work queue. Users can still resize the non-scalar Freshness panel. The final overview shows all three together.
3. P2 — header duplication consumed too much of the first screen. Section navigation and context controls now share one toolbar; the redundant shared-project caption was removed from reading mode.
4. P2 — the global retest button covered the Freshness paging controls at the narrower viewport. On the dashboard it now sits 24px above the bottom edge, with reserved trailing content space. Both paging controls are visible in the final overview.
5. P2 — fixed-scale catalog thumbnails clipped tall widgets. They now measure the actual content and slot with ResizeObserver and fit the entire widget. The final catalog capture includes the full run chart and queue in the thumbnails.
6. P2 — inconsistent outer panel corners and overly muted result lines. Outer chart/panel radii are now 15px; run outcomes use stronger semantic colors. The final dark catalog and library captures show the updated tokens.
7. P2 — catalog could inherit the dashboard scroll offset. Distinct keyed scroll surfaces start the catalog at its heading.

The final combined comparison and focused browser views found no remaining actionable P0/P1/P2 mismatch within the tested desktop/tablet-sized scope. Narrow phone-sized layout and assistive-technology use on a physical device were not exercised; those are residual test coverage limits, not claimed passes.

## Required fidelity surfaces

- Typography: existing Falcon Geist/system stack retained; count hierarchy, localized labels and long run names checked in actual rendering. The dense section toolbar and utility copy remain subordinate to the data.
- Spacing/layout: stable carousel height, four/three metrics, section separation, compact counters, full-page catalog with inline detail, no clipped outer widget content in the complete board. User ordering and available width are retained.
- Colors/tokens: neutral dark canvas/panels and light equivalents, white text on cobalt actions, semantic success/warning/defect accents. Theme change verified through the product settings UI.
- Images/assets: existing Falcon logo and transparent empty-state art retained. Functional charts and icons remain code-rendered, with real values. All 13 guide images are actual new browser captures, with exact dimensions in the manifest; eight superseded dashboard images removed.
- Copy/content: 29 widgets, four contexts, accurate coverage semantics and separate run/case success ratios; no internal QA debug labels in the product. Guidance distinguishes shared server layout from personal same-browser context.

## Interactions and checks

- Empty project → Add widgets opens the full-page catalog directly.
- Search, categories, actual inert preview, single add and Add all, added-state deduplication, back navigation.
- Edit-only controls, keyboard drag (queue moved to the first position), width changed to12, remove, save and cancel.
- Saved board state read from the server; Umbrella's old operational metrics consolidated. The documentation project's temporary widgets were removed and its original empty board verified after saving.
- Freshness arrows, both pages, correct real count drills; no timed auto-rotation.
- Environment/build context restored after leaving and returning; Freshness page also restored. Account/project keyed component boundary isolates the controllers and drafts.
- Historical successful-run drill opened GUIDE-TR-1 and its case result through normal navigation.
- Authenticated local API interruption displayed the existing explicit unavailable/retry state; retry recovered without replacing stored data.
- Local browser error logs were checked during the run; no rendering errors were reported there. The production smoke test subsequently exposed the hardened-runtime issue documented below.
- Verification at completion: 367 adapter/documentation/chart tests, 39 auth tests, typecheck and architecture pass; standalone workbench progress/navigation tests also pass. Production build and deployed-origin verification are recorded in the release output.

## Production runtime regression

The first production smoke test found that opening all sections triggered a Recharts tick-generation exception when runtime intrinsics were frozen. The existing dependency patch covered `decimal.js`, while Recharts' automatic ticks also use `decimal.js-light`. Its constructor attempted to assign an inherited, read-only `constructor` property. Both CommonJS and ESM entry points now define an own writable property, following the existing dependency-patch mechanism. The regression test exercises real Recharts automatic ticks with frozen intrinsics, including fractional and zero domains, rather than only testing an externally supplied scale.

Production documentation independently passed: all 13 new image URLs return HTTP 200 and match the committed assets. The live article uses only the new `dashboard-v2-*` captures; viewport-visible images load correctly through the existing lazy loading.

## Queue and catalog polish — 9 September 2026

- Compact queue titles remove context only from recognized Falcon-generated names. Custom names and canonical run records remain unchanged. Full titles and context remain available in run/detail views.
- Open/Continue is an inline text action with a chevron in the progress caption; the whole row remains one keyboard-accessible button. Both states use identical typography and spacing, with a full-width progress track.
- Operational widgets share normal CSS grid row sizing while other sections retain measured masonry tracks. Browser measurements at 1280 × 720: all three cards 347px high in reading mode and 382px with editing controls. Keyboard reordering and removing a card were exercised.
- Catalog detail and first result top both measured 255.390625px at the same viewport. The detail preview and the rendered widget have no nested outer borders. Chart, defect and freshness content retain their internal data separators.
- Light/dark screenshots inspected in `output/dashboard-ui-polish-20260909`. Seven affected documentation screenshots recaptured from Falcon Guide and given fresh v3 URLs to avoid cached older frames. The other six screenshots depict unchanged surfaces.
- The temporary documentation layout was removed; Falcon Guide's original empty board was saved and verified.
- Verification: 376 adapter/documentation/dashboard tests pass, including generated/custom title cases and existing freshness/progress tests now included in the standard suite. Typecheck and the 570-file architecture check pass. Production verification is recorded separately after release.
