# Dashboard detail pages — design QA

final result: passed

Approved targets: «Точный список», «По прогонам», «Контекст компонента» from the three user-approved mockups (2026-09-09).

Comparison: reference and application screenshots were opened together. References use a 1488 × 1058 canvas; application was inspected at the actual 1087 × 814 browser viewport. The comparison accounts for the narrower content width and existing Falcon shell. Full visible-page captures are in `../output/falcon-dashboard-pages-20260909/`.

- Defects: full page, quiet toolbar, flat rows, component, status, priority and date. No modal, resize handles or grow/shrink transition.
- Checks: full page, compact freshness tabs, collapsible run groups, real run progress when available, direct run and execution links.
- Component: persistent component rail, case/run/defect tabs and case selection. Case title above key; optional run creation uses only selected existing IDs.
- Dark and light themes keep the existing dark global navigation and Falcon tokens.
- Desktop narrow-width table review fixed clipped right columns and excessive title truncation. Long labels truncate within their column and retain full title tooltips.
- A contrast issue inherited from the global button rule was found and fixed: record titles use the primary text token.
- Focused search input is transparent with no inner border/shadow; the enclosing shell uses the shared neutral gray focus ring.

Intentional domain adaptations: existing Falcon priority icons are retained; no fabricated last-test result or component description is shown. Component rows show the actual case lifecycle. Run progress is omitted when the authoritative run summary is unavailable. Counts are shown only when known; local filters explicitly describe their loaded-record scope when pagination exists.

Interaction checks: query filtering; facet reset; Escape restores filter-button focus; group collapse/reopen; component tabs; exact selected case IDs passed to run creation; reload restores the detail URL; back returns to the dashboard. Successful empty data renders a calm empty state. A simulated transport failure remains an explicit retryable error.

Local fixture UI was used for dense, empty and failure states; the temporary harness was removed from the shipping app and retained only with QA artifacts. No production fixture route is published. Production verification found a long component rail, which now scrolls independently and brings the selected component into view. Execution counts have their own Checks tab rather than being labelled as run counts. A real failed check opened its exact run and run-item URL. Production screenshots are recorded in the release report.

The final rail search height was measured at 36 px; remaining rail space is reserved for its independently scrolling navigation.

Open P0/P1/P2 visual issues: none at the verified desktop viewport.

A production component-to-runs check exposed an unsupported launched/component query. Related component history now uses the documented completed-run basis, labels that scope explicitly, and rejects obsolete incompatible deep links before querying. The adapter regression covers named and empty components, valid empty data, and unscoped launch history.

# Test-suite catalog — 2026-09-09

Selected target: option 2, classic full-width catalog. The generated reference and final local screenshot were viewed together at 1488 × 1058. Evidence lives in `../output/falcon-suite-catalog-20260909/`.

- One catalog on entry. No automatic suite detail, split rail, inspector or resizable overlay.
- Project context, heading/count, blue create action, flat table, manual/tag composition, case count, updated date and discrete run/open icons follow the approved layout.
- Reference refinements: increased title and row typography, 74 px rows, 42 px primary/search controls, consistent column baselines. Existing Falcon navigation/header and priority/status semantics retained.
- Deliberate adaptations: mock-only overflow control omitted; dates show the real update timestamp; dynamic summary zero is not presented as resolved coverage. Exact tag scope count appears only with matching hydrated detail or in the existing run builder.
- Detail is a full page with a short metadata line, existing case-list renderer, case search, configuration and run actions. Configure waits for hydrated detail.
- Neutral focus is drawn on the search shell; inner input has transparent background and no outline/shadow. Primary text/icons verified white in light mode. Global sidebar stays dark.
- 1488 px desktop, 768 px tablet, 390 px mobile inspected. No document horizontal overflow. Secondary columns fold away at narrow widths; name/count/run/open remain visible.
- Browser interactions passed: composition filter; normalized search; clear/reset; sorting; open detail; browser back preserves filter/search and focuses prior row; sidebar returns to catalog; direct suite URL; configure existing suite; create a local test suite and see its 1-case row; run from row opens the existing builder without opening detail; error retry restores cases; genuine empty state.
- Local dense/failure test harness is not a production route. No production fixture data is created.
- Added catalog and scoped navigation tests; updated resource-loading and neutral-focus regression checks. 400 adapter tests passed. Typecheck and architecture checks passed. Documentation now describes catalog search, composition, count semantics, scope editing and launch.

Open P0/P1/P2 visual issues: none in tested states.

final result: passed

Production acceptance found one archived member counted by the summary API. Catalog counts now prefer the authoritative resolved scope for matching suite/project/type/revision; unhydrated static counts explicitly describe saved membership. Added a regression with two stored members and one runnable case. Suite detail, browser back, configured scope and run builder use existing production entities.

final result: passed

## Suite launch and workspace history — 2026-09-09

- Run drawer: inset rounded panel, neutral Falcon light/dark surfaces, compact scope summary and property rows, one fixed footer. Suite/case title supplies the default name; environment/build remain separate metadata. Current selection is shown after changing the source; an empty resolved suite is not described as still loading.
- Navigation: shared native history entries preserve framework state and exact project/entity/drill URLs. Global Back/Forward controls, popstate restoration, per-entry search/filter state and scroll restoration. Cross-project navigation uses the same restoration boundary and workspace loader.
- Browser QA with production components and isolated local data: filtered suite catalog → suite → case → linked run → Back → case → Back → same suite/search → Back → same catalog/filter → Forward. Verified suite switching updates name/count and summary after collapsing the chooser. Dark/Russian and light/English launch panels inspected.
- Local API access: direct production requests rejected by CORS; attempted read-only proxy could not establish stable local authenticated access. Temporary proxy, auth prompt and preview fixtures removed from the shipped source. Production session verification follows deployment.
- Verification: 413 adapter/domain tests pass, including 12 new navigation lifecycle cases; TypeScript and architecture checks pass. No backend schema changes. Repository lint command is an existing no-op.
- Evidence: ../output/falcon-launch-navigation-20260909/ (screenshots and retained local harness, outside production routes).

Production follow-up: the suite → case → suite/catalog flow retained both search inputs. Found and corrected two additional history edge cases: explicit navigation after an intra-view popstate must push, and defect URLs must discard dashboard/suite/article parameters before being pushed. Regression tests cover both.

## Public landing and Recordly demonstrations — 2026-09-09

final result: passed

Source visual truth: `/Users/mercuryrucks/.codex/generated_images/01a07862-f88a-7701-bf0e-179ddf13e9b1/exec-db7b484e-bae8-4343-9ffa-50e55f3ab73a.png` (1024 × 1536). The user separately approved the Smooth Recordly motion sample. Official Astra reference capture, all recordings and QA evidence are retained in `../output/falcon-landing-20260909/`.

Implementation: `http://localhost:4531/`, Russian public page, graphite theme, no sign-in required. Full comparison capture: `local-comparison-final-full.png`, 1024 CSS px wide, 900 px viewport height, deviceScaleFactor 1; first 1536 px compared at 1:1 density with the source. Full-view combined evidence: `landing-comparison-final.png` (2048 × 1536, source left, implementation right). Focused combined evidence: `landing-typography-comparison.png` (2048 × 380). No browser chrome or density mismatch is included in either comparison.

Intentional adaptations: real Falcon recordings replace the generated mock interface; the product is not represented by fictional charts. Silent playback has no volume button. Signup says “Создать аккаунт” to match its actual destination. Descriptions name existing functionality rather than the mock's generic promotional statements. The generated decorative wing is preserved as a real image, and the existing Falcon logo and service marks are used.

### Findings, fixes and recapture history

- [P1, resolved] Lazy video sources could remain on their poster after scrolling to the next chapter. The visibility observer ran before React attached the source. Playback now synchronizes after source attachment, and visible players request metadata. All five real files subsequently loaded and played; retry and reduced-motion manual playback passed.
- [P2, resolved] In the first 1024 px comparison the hero was too tall and its headline too small, delaying the product demonstration. Set a 680 px hero at 1001–1200 px and a 64 px desktop headline minimum. Compare `landing-comparison.png` with `landing-comparison-final.png`: the two-line hierarchy and product transition now retain the source composition.
- [P2, resolved] At a mobile chapter anchor the absolute header remained over the content because it lacked a positioned landing ancestor. The landing now establishes its own containing block. `local-mobile-cases.png` and an explicit bounding-box assertion confirm that the header scrolls away.
- [P2, resolved] The 320 px header compressed the space between brand and login. A narrow breakpoint reduces only the brand mark, wordmark and action gap. The recaptured `local-320-hero.png` preserves separation without hiding either destination.
- [P2, resolved] The initial run poster captured a partially typed build identifier. The final poster comes from the completed form at 20 seconds, showing the title, scope and launch action together.

### Fidelity surfaces

- Fonts: existing Geist Sans, verified computed family; normal/medium optical weights, tight two-line desktop display heading, readable 13–17 px controls/body. Mobile copy wraps within its column; no clipped heading or action. The source's approximate body type is adapted to existing Falcon typography.
- Spacing: restrained full-width chapters, large real product media and plain three-column supporting notes. No repeated feature-card grid or scroll trap. At 320/390 px supporting notes stack; 768/1024/1600 px preserve their intended hierarchy. Borders and radii belong to the video frame, not every text block.
- Color: graphite #0b0c0e, near-white headings, muted gray text, neutral focus outlines. White primary actions retain dark labels; real product state colors remain inside the recordings.
- Images: generated silver wing matches the source direction; no substitute CSS drawing. Recordly export reports confirm five real 1600 × 900, 60 fps files. MP4 compression affects delivery only, and WebP posters are extracted from the final exports. No old product screenshots appear on the landing.
- Copy: all five flows have accurate titles and plain-text explanations. The run video describes configuration before launch. Only the eight available connectors are advertised; upcoming services are not presented as released capabilities.

### Interaction and responsive verification

`local-qa.json` records successful playback of all five assets; pause persistence across scrolling; offscreen pause; seek; fullscreen; expandable FAQ; signup destination; 320/390/768 px overflow checks; reduced-motion autoplay suppression with explicit playback; failed-request retry. Console/page errors and failed Falcon asset requests were empty. Desktop captures use 1600 × 900; mobile captures use 390/320 × 844. Mobile checks are browser viewport tests, not claims of physical-device testing.

Verification completed before release: 40 public/auth tests, 413 existing adapter/domain tests, 41 Worker/release tests; TypeScript and architecture checks passed. The existing lint script is a no-op. Build and production browser acceptance are enforced during the release process.

No open P0/P1/P2 findings in the inspected states. No further visual change is required before release.

## Landing refinement — continuous background and manual demonstrations — 2026-09-09

The user's requested changes supersede the earlier large-video, numbered-chapter and automatic-playback choices. Source before/after comparison: `../output/falcon-landing-refinement-20260909/landing-refinement-comparison.png`, 3200 × 900 (1600 × 900 per side, DPR 1). The original wing, Falcon typography and existing real interface recordings remain the visual basis. The official Astra page was reviewed for restrained section transitions and a continuous atmospheric canvas; its content and product branding were not copied.

- A generated 1672 × 941 dark atmosphere covers the page continuously. Transparent sections and a masked hero remove the former background boundary. The footer reuses the same wing mirrored to the left.
- All five players are capped at 920 px and have an explicit central Play button. No autoplay, loop or automatic resume remains. Seeking, fullscreen, text descriptions and timed captions remain available.
- Numbered chapters and repeated promotional supporting notes are removed. Headings and descriptions name the actual Falcon workflows.
- Eleven existing service marks form one continuous strip. GitLab, Jenkins and TeamCity are explicitly marked «Скоро». A pause button, hover on the brand window and document visibility control motion; reduced-motion mode shows one wrapped static list.
- One new YouTrack recording follows the catalog → linked report → linked execution → return. Recordly's approved Smooth composition rendered 2302 frames at 60 fps (38.3667 seconds). The public poster is taken at 13.8 seconds. No connection settings, credentials, report edits or outgoing notifications are part of this capture.
- Section reveals use 34 px of movement over 0.8 seconds without scale, blur or scroll trapping. Reduced-motion preferences suppress decorative movement.

### Findings and verification

- [P2, resolved] The initial footer wordmark and description overlapped bright feathers. The artwork now fades before the metadata row, and the wordmark is white. `independent-footer-fixed-1600.png`, `independent-footer-fixed-390.png` and `independent-footer-fixed-320.png` confirm contrast while preserving the large left wing.
- [P1, resolved] An early Play click could arrive before React listeners were ready. Controls now become actionable after hydration. Effect cleanup also preserves the explicit request through development StrictMode setup replay while cancelling playback on actual unmount. All five normal-motion players then passed explicit playback, seek and fullscreen checks.
- [P2, resolved] At 320 px with reduced motion the static integration list retained its moving track's intrinsic width. The static group now takes the available width and wraps, retaining all eleven brands without horizontal overflow.
- The seven playback lifecycle checks cover initial pause, a delayed MP4 request with Play→Pause, keyboard operation, offscreen/visibility pause without resume, natural ending without looping and explicit replay. A separate failed-request check verifies retry recovery remains paused until Play.
- Independent 1600/390/320 px screenshots found no horizontal overflow or console errors. Full responsive QA additionally covers 768 and 1024 px. `independent-layout.json`, `manual-playback-qa.json`, `retry-qa.json` and the refinement browser report are retained with the screenshots outside the deployed repository.
- Verification: 41 public/auth tests, 413 existing adapter/domain tests and 43 Worker/release tests pass; TypeScript and the 606-file TMS architecture check pass. The repository lint script is still a no-op. Static build and production acceptance are performed by the existing release pipeline.

No open P0/P1/P2 visual findings in the inspected states.

Final local browser acceptance: `local-refinement-qa.json` passed all five manual-play/seek/fullscreen checks, marquee pause/resume and 1600/1024/768/390/320 px layouts, including reduced-motion wrapping. Console errors and failed Falcon asset requests: none.

final result: passed

## Landing product story and scroll continuity — 2026-09-09

Source context: the production landing at `dd56b5b4` and the user's request for meaningful explanation between recordings. The official Astra landing was inspected in the browser for its alternation of a narrow reading column and wider media. Its content, branding and product claims are not reused.

Combined comparison: `../output/falcon-landing-story-20260909/story-comparison.png` (2880 × 1000, old production left and local implementation right, each 1440 × 1000 CSS px, DPR 1, same cases chapter). The page retains the existing graphite atmosphere, wing, Geist Sans typography and all five approved Recordly exports. Text now uses a 640 px reading column, a topic label, a 32–42 px heading and two 16–17 px paragraphs before each 920 px player. Separate introductions explain project context, reusable cases, build-specific execution, defect evidence and verification after a tracker fix.

The new motion follows scroll progress through a damped spring, with a stable outer measurement wrapper and an inner transformed layer. It repeats in either direction. Players never scale or fade; the central viewing interval has zero displacement so controls stay still. Text has smaller movement. Manual playback, seeking, fullscreen and offscreen pause remain independent from decorative movement.

### Findings and validation

- [P1, resolved after real-wheel review] Mobile CSS makes body a real scroll container, while the initial hook excluded body unconditionally. Programmatic document scrolling passed but ordinary wheel scrolling left visible text at opacity 0.6 and its initial offset. The hook now distinguishes body overflow propagation from an independent body scroller and rebinds after viewport resizing. Scoped smooth-anchor behavior also applies to body, with a reduced-motion override. A real wheel on the 390 px page now changes the media position and settles visible text at opacity 1. `story-mobile-cases-fixed.png` confirms the corrected contrast and spacing.
- Desktop before/after comparison confirms readable hierarchy, consistent margins and unchanged product assets. The five introductions were checked against the Falcon guide; tracker wording refers to configured connectors, not arbitrary external URLs.
- Local public/auth tests: 41/41. Existing adapter/domain tests: 413/413. Typecheck and the 606-file architecture check pass. The repository lint command is a no-op.
- Browser checks pass for all five players (Play, seek, fullscreen), the eleven-brand strip with three planned connectors, and 1600/1024/768/390/320 px layouts without horizontal overflow. Seven playback lifecycle regressions and failed-media retry pass. The real-scroll matrix is recorded separately from programmatic scrolling checks.
- Evidence, scripts and captures are retained outside the deployed source under `../output/falcon-landing-story-20260909/`. Production acceptance follows the existing source → Pages → Worker release process.

Final real-scroll acceptance: `scroll-owners-qa.json` passes wheel movement, direct pre-hydration hashes and native anchors at 1440/1000/768/390 px. The 390 px body scroller moves the player from 34.69 px to 0 at the viewing center, then to −31.92 px on exit and back to 0 on return; its anchor navigation has 23 intermediate positions. Resizing 1440 → 390 → 1440 rebinds HTML/body correctly. Live reduced motion explicitly resets every inner transform and opacity and switches body scrolling to auto. The earlier undefined style retained offscreen transforms; that issue is corrected in both Reveal and the hero.

The final broader local browser suite was rerun after these fixes: eleven checks pass, no page errors or failed Falcon asset requests. The mobile recapture shows fully readable text and an intact player. No open P0/P1/P2 findings remain in the tested states.

final result: passed
