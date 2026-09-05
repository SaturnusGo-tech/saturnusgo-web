# Design QA — dashboard analytics explorer

- source visual truth: `/var/folders/m4/ss0ghsrd5dl5chxys5v0rgqm0000gn/T/codex-clipboard-3301dc23-f328-4ae9-9953-fbacdb2d498a.png`
- implementation screenshot: `.design-audit/2026-09-04-dashboard-drill-redesign/production-testcases-final.png`
- compact-state screenshot: `.design-audit/2026-09-04-dashboard-drill-redesign/production-compact-final.png`
- normalized source: `.design-audit/2026-09-04-dashboard-drill-redesign/reference-testcases-normalized.png`
- combined comparison: `.design-audit/2026-09-04-dashboard-drill-redesign/reference-vs-production-testcases.png`
- production URL: `https://tms.saturnusgo.com/testcases/umbrella-home/work/?projectId=project_59c48ce2121f461c8e604f35a9706aa3`
- viewport: 1087 × 814 CSS px for the final matching-state comparison; interaction geometry also verified at 1280 × 720
- state: authenticated production, light theme, `Запущено ранов` drill, test-case/run/defect tabs

## Findings

- No actionable P0, P1, or P2 visual differences remain for the requested redesign.
- The analytics drill now opens as a full-screen surface from the bottom and uses the same dense table identity as the canonical test-case listing.
- The old empty `Обзор` surface and detached blue action bar are removed. The selected entity list is the primary content, with a quiet `Перейти в раздел` action beside sorting.
- Filter semantics are preserved while each facet supports multi-select. Two component filters were selected simultaneously in production and returned the expected four test cases with a selected-count badge of `2`.
- Test cases, runs, and defects use entity-specific columns, compact semantic pills, gray identifiers, saturated priority/status colors, and restrained dividers.
- The filter rail, search field, sorting menu, list rows, and empty/loading states stay within the Falcon typography, spacing, and radius system.
- Full-screen geometry is `0 px` radius with no visible outer border. Dragging the top handle down produces a 48 px total gutter, an 8dvh height reduction, and an `18 px` animated top radius. Dragging upward restores the exact full-screen state.
- Pointer tracking continues outside the panel while dragging, so the upward return gesture completes reliably.
- Production console check returned no warnings or errors.

## Comparison history

- The supplied source showed the earlier compact technical modal, duplicate separators, a secondary overview, single-select filters, and detached navigation buttons.
- The first production comparison confirmed the full-screen information hierarchy, list density, and reduced chrome.
- Interaction QA then exposed two cascade/gesture issues: the global panel radius token overrode the adaptive radius, and the compact-to-full threshold exceeded the available top offset.
- The final production pass verified `0 px → 18 px → 0 px` radius and successful `full → compact → full` transitions.

## Verification

- [x] `npm run typecheck`
- [x] 13 focused dashboard analytics and rendering tests
- [x] `npm run build:once`
- [x] full-screen and compact drag states in production
- [x] multi-select component filters in production
- [x] test-case, run, and defect list tabs in production
- [x] no production console warnings or errors
- [x] source and implementation judged together in one normalized comparison image

final result: passed

# Design QA — Falcon public landing, production-data pass

- source visual truth: `https://qatools.ru/`
- production-data sources: authenticated Falcon production workspace `Umbrella-Host` on `https://tms.saturnusgo.com/`
- reference screenshot: `.design-audit/2026-09-05-falcon-landing-redesign/48-reference-hero-1440x1000.png`
- implementation screenshot: `.design-audit/2026-09-05-falcon-landing-redesign/35-fresh-prod-hero.png`
- combined comparison: `.design-audit/2026-09-05-falcon-landing-redesign/49-reference-vs-prod-hero-1440x1000.png`
- desktop sections: `.design-audit/2026-09-05-falcon-landing-redesign/37-platform-prod.png` through `40-analytics-prod.png`
- mobile sections: `.design-audit/2026-09-05-falcon-landing-redesign/42-mobile-hero-prod.png` through `46-mobile-analytics-prod.png`
- viewports: 1440 × 1000 and 390 × 844 CSS px

## Findings

- The landing now follows the reference's compact navigation, centered product-first hero, alternating editorial feature sections, restrained monochrome palette, and full-width closing CTA without copying TestOps branding or copy.
- Numbered `01–05` tiles, decorative pill copy, repeated cards, redundant captions, and other generic landing-page chrome are removed.
- Every visible Falcon product image was recaptured from the authenticated production account on 5 September 2026. No localhost, demo workspace, or stale imported screenshot remains in the rendered landing.
- Desktop and mobile use purpose-captured, 2× processed assets for the run detail, case repository, run builder, defect card, and analytics dashboard. A responsive `picture` selects exactly one source per viewport; declared dimensions match the generated files and avoid layout shift.
- The 1440 × 1000 reference/implementation board was judged as one image. Header height, hero centerline, CTA hierarchy, product-preview scale, and fold position align; Falcon's monochrome surface and black action are intentional identity choices.
- Desktop feature sections keep one clear narrative and one product surface per section. Mobile sections preserve readable headings and show the corresponding responsive production UI without horizontal overflow.

## Verification

- [x] same-viewport reference comparison at 1440 × 1000
- [x] desktop hero and every feature section inspected with production images loaded
- [x] mobile hero, cases, runs, defects, and analytics inspected at 390 × 844
- [x] tablet navigation and full-screen menu inspected at 900 × 800; Escape closes and dialog semantics contain the menu toggle
- [x] mobile and desktop source selection verified independently with no duplicate screenshot request
- [x] authenticated production source verified as `Umbrella-Host`, 398 test cases, 24 runs, and 23 linked defects
- [x] no numbered feature blocks or old screenshot paths remain in the landing component

final result: passed

---

# Design QA — listing priority geometry and persistent dark navigation

- source visual truth: `.design-audit/2026-09-04-listing-priority-status/01-before-new-feedback.png`
- production screenshot: `.design-audit/2026-09-04-listing-priority-status/04-production-final-1280.png`
- combined comparison: `.design-audit/2026-09-04-listing-priority-status/05-before-vs-production.png`
- production URL: `https://tms.saturnusgo.com/testcases/umbrella-home/work/?projectId=project_59c48ce2121f461c8e604f35a9706aa3`
- viewport: 1280 × 720 CSS px for the final matching-state comparison
- state: authenticated production, light theme, priority-sorted test-case listing with split detail

## Findings

- The global navigation stays dark in both application themes and uses the restrained existing cold charcoal gradient. The production computed background is `#252a36 → #282936 → #292731 → #25232c` and the foreground is `#e7e9ec`.
- Priority markers and the sort chevron share the same horizontal center (`86.8 px`) in the production table.
- The priority and case-type tracks are now distinct (`32 px` and `36 px`), giving the neutral hand/robot icon clear separation from the diamond or triangle.
- The case ID track was reduced to `90 px` while status remains a fixed `92 px`, removing the oversized visual gap before the status pill.
- The same priority/type spacing is applied to the reusable embedded case list, run navigator, and dashboard drill list.
- Priority sorting was verified in production: the first activation places `Критический` first and the reverse direction places `Низкий` first.
- No production console warnings or errors were recorded after deployment.

## Verification

- [x] `npm run test:tms-adapters` — 188/188 passed
- [x] `npm run typecheck`
- [x] `npm run build:once`
- [x] production source SHA `a78e80a6`
- [x] production Pages SHA `bd1ec046`
- [x] persistent dark navigation verified in light theme
- [x] priority/type spacing and ID/status density verified in production
- [x] priority sort direction verified in production
- [x] source and implementation judged together in one same-viewport comparison image

final result: passed

---

# Design QA — Falcon public onboarding

- source visual truth: `/tmp/qatools-reference-home-viewport.png` and `/tmp/qatools-reference-home-full.png`
- same-viewport implementation: `.design-qa/falcon-public-reference-viewport-1280x720.png`
- combined reference/implementation board: `.design-qa/falcon-comparison-1280x720.png` (2560 × 720; source left, Falcon right)
- desktop implementation: `.design-qa/falcon-public-hero-1440x900.png`
- mobile implementation: `.design-qa/falcon-public-mobile-390x844.png`
- mobile navigation: `.design-qa/falcon-public-mobile-menu-390x844.png`
- personal registration: `.design-qa/falcon-signup-1440x900.png` and `.design-qa/falcon-signup-mobile-390x844.png`
- organization wait-state: `.design-qa/falcon-signup-organization-1440x900.png`
- returning-user login: `.design-qa/falcon-cloud-login-1440x900.png`
- integrations section: `.design-qa/falcon-public-integrations-1280x720.png`
- viewports: 1280 × 720, 1440 × 900, and 390 × 844 CSS px
- states: landing, responsive menu, personal registration, staged organization path, cloud login

## Comparison

- The landing preserves the reference's compact header, centered hero, paired calls to action, real product preview at the fold, alternating feature narratives, final CTA, and dense footer.
- QAtools branding, copy, purple/blue gradients, and reference imagery are intentionally replaced with Falcon's own warm monochrome identity and real Falcon product screenshots.
- The hero and product preview retain the reference's information hierarchy at the same 1280 × 720 viewport without cloning copyrighted text or assets.
- The combined 2560 × 720 board was inspected as one image: header height, hero centerline, CTA grouping, fold position, and product-preview footprint align closely; Falcon's warmer neutral surface and black primary action are intentional identity changes.
- The public routes render through a dedicated Falcon server layout. No legacy SaturnusGo header, footer, background, or unrelated navigation is present in their server HTML.
- Personal registration and cloud login use the same visual system as the landing. The organization choice is clearly marked as forthcoming and cannot create a fake workspace.

## Findings

- No actionable P0, P1, or P2 visual defects remain in the requested landing and onboarding surfaces.
- Desktop and mobile pages have no horizontal overflow. The mobile menu fills the viewport, scrolls when needed, exposes dialog semantics, and closes with Escape.
- Inputs use visible monochrome focus treatment without browser-blue outlines; labels, consent links, password visibility controls, loading, errors, and success feedback remain keyboard accessible.
- Admin OAuth and cloud account entry remain visibly distinct. Explicit admin entry and OAuth callback parameters bypass cloud-session probing; cloud probe failures render a recoverable retry state instead of silently redirecting users.
- Registration enforces the current server contract: a 12–128-character password, explicit consent, `termsAccepted: true`, cookie credentials, and a payload-stable idempotency key.
- Fresh in-app-browser verification confirmed `/`, `/signup/`, `/cloud-login/`, the disabled organization state, and the existing Auth0 consent handoff from `?auth=admin`.

## Verification

- [x] `npm run typecheck`
- [x] `npm run test:tms-auth` — 34/34 passed
- [x] `npm run test:tms-attachments` — 6/6 passed
- [x] `git diff --check`
- [x] clean server HTML for `/`, `/signup/`, and `/cloud-login/` with zero legacy navigation links
- [x] legacy `/features/` route still renders its original shell
- [x] same-viewport reference comparison and desktop/mobile visual inspection
- [x] responsive menu, registration choices, cloud login, and geometry checked in the in-app browser
- [x] full repository production static export — 62/62 pages after adding the required Suspense boundaries to legacy investor and career routes

final result: passed

---

# Design QA — Falcon cinematic landing, selected variant 1

- selected visual target: `.design-audit/2026-09-05-falcon-scroll-motion/11-selected-cinematic-run.png`
- normalized reference: `.design-audit/2026-09-05-falcon-scroll-motion/14-reference-1440.png`
- final implementation state: `.design-audit/2026-09-05-falcon-scroll-motion/21-implementation-final-ghost-1440.png`
- combined reference/implementation board: `.design-audit/2026-09-05-falcon-scroll-motion/22-reference-vs-final-ghost.png`
- final mobile state: `.design-audit/2026-09-05-falcon-scroll-motion/20-mobile-final-320.png`
- chapter contact sheet: `.design-audit/2026-09-05-falcon-scroll-motion/28-page-contact-sheet.png`
- viewports: 1440 × 1024 and 320 × 760 CSS px

## Findings

- The selected dark cinematic direction is implemented with a sticky scroll sequence: the opening promise recedes with controlled blur, the run-context statement resolves into focus, and the current production run screen rises into the viewport with scale and perspective depth.
- The header now contains only Falcon, `Войти`, and `Попробовать`; the temporary product-category navigation is removed.
- All product chapters use current authenticated production screenshots and a restrained editorial rhythm instead of numbered feature tiles, pills, repeated cards, or generic marketing blocks.
- The generated ambient image is served as a 2560 × 1440 WebP asset and is covered by the fail-closed Pages release manifest.
- The same-viewport comparison was judged as one image. Hero centerline, background depth, statement hierarchy, product reveal, and fold composition match the selected variant without copying another product's identity.
- The outgoing hero remains as a subtle blurred depth layer. The scroll cue disappears before the screenshot reaches it.
- At 320 px the brand and both auth actions remain visible, the hero becomes a readable static sequence, and document/body widths stay exactly 320 px without horizontal overflow.
- Keyboard focus cannot enter the visually hidden opening CTA. Focus treatment is high-contrast, semantic hero phases use one `h1` followed by an `h2`, and reduced-motion mode disables both motion transforms and global smooth scrolling.
- Three independent final reviews found no remaining P0, P1, or P2 issues in visual matching, runtime/accessibility, or product copy.

## Verification

- [x] selected reference and final implementation inspected together at 1440 × 1024
- [x] desktop hero, all product chapters, integration statement, footer CTA, and 320 px layout inspected in the in-app browser
- [x] hidden/visible CTA tab order and scroll-cue opacity verified at runtime
- [x] one `h1`, semantic hero `h2`, direct auth links, and zero horizontal overflow verified in rendered DOM
- [x] `npm run typecheck`
- [x] `npm run test:tms-auth` — 38/38 passed
- [x] `npm run test:tms-worker` — 28/28 passed
- [x] `npm run test:tms-attachments` — 6/6 passed
- [x] `npm run test:tms-adapters` — 188/188 passed
- [x] `npm run build:once` — 63/63 static pages plus expected dynamic API routes
- [x] `git diff --check`

final result: passed
