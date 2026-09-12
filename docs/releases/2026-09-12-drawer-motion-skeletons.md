# Drawer motion and catalog skeleton hotfix — 2026-09-12

## Behavior

Right-hand modal drawers enter from outside the right edge over 260 ms. Suite configuration now uses the same dismissal lifecycle as new runs and both defect creation forms: the panel and scrim remain mounted for their 240 ms exit, then invoke the close/save callback. An interrupted entrance continues outward from its current transform; repeated close requests are ignored. Pending exit callbacks and animations are cancelled on unmount. Reduced-motion users close immediately. Focus restoration does not scroll the underlying page.

Bug-report detail enters from the right and exits to the right, at constant opacity. On desktop, an animated spacer resizes the browser alongside the panel; narrower layouts retain the overlay presentation. Switching between defects keeps the panel mounted.

Portfolio catalog and portfolio project listings use the actual catalog table styles for their loading skeleton: identical columns, row spacing, icon/name and assignee positions, and responsive column visibility. Background refreshes retain existing rows. API testing and persistent case/run inspector layouts are unchanged.

## Validation

- Adapter/organization tests: 475 + 197 passed, including interrupted dismissal, callback timing, duplicate close, unmount cancellation and reduced motion.
- TypeScript and TMS architecture checks passed (1,069 application files).
- Actual React components tested through local HTTP fixtures, without production mutations.
- Browser frame samples: suite opened from x=1087 to x=147, closed from x=147 through x=1045 before unmount; opacity stayed 1 and document horizontal scroll stayed 0.
- Defect panel opened x=1087 → 267 and closed x=267 → 1087 before unmount. Desktop at 1536 px resolved to 721.92 px browser + 814.08 px detail. 420 px iframe checked visually with a full-width detail and usable back action.
- Catalog skeleton visually compared with the loaded table under an artificial 10-second catalog response delay.
- Browser console clean for the production components. Measurement instrumentation exists only in temporary local fixtures.

## Deployment

Pending release build and public runtime verification. No backend or database changes.
