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

- Frontend source: `ddbbe29b7a0ce8e5bdd70ea02cbc6c2f317607a8` (pushed).
- Static production build passed; 65 routes generated. Existing unrelated autoprefixer warnings remain.
- Pages: `55b8514c87fdccc854b39f2f87c84ef7edfa33d8` (main, pushed).
- Public origin manifest reports the exact source SHA.
- Worker: `2296d38e-35fc-4c2e-a528-f0434094ee47`, 100% traffic, seven domains verified, 53 Worker tests passed.
- First Worker attempt stopped at the readiness gate while Pages still exposed the preceding release. Retried only after the origin manifest matched; the release then completed.
- Production work route: HTTP 200. Current `page-13a4d69838a24ab3.js` returned HTTP 200, JavaScript MIME, 1,181,400 bytes.
- Additional browser verification: the actual new-run dialog opened from a suite at x=1536 and settled at x=596 (940 px width), keeping opacity 1 and horizontal scroll 0; close button dismissed it through the shared lifecycle.
- Authenticated production UI smoke unavailable: the existing browser session shows the company sign-in form. No credentials or customer records were changed.
- No backend or database changes.
