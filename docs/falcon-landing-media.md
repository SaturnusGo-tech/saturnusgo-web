# Falcon landing media

> Historical record: the recordings and acceptance results below describe the 9 September revision. All six current videos, the commercial flow and current verification are documented in [Falcon commercial landing — 10 September](falcon-commercial-landing-2026-09-10.md). None of the older video paths below is referenced by the current landing.

The public landing presents five recordings of the Falcon interface. Recordly 1.4.0 for macOS provides the Smooth preset, 1.25× focus regions, cursor smoothing and click feedback. The first sample’s motion was approved on 9 September 2026. Browser automation captures the real interface and pointer events; Recordly composes the final motion. Generated images are used only as decorative backgrounds, never as product UI.

## September 2026 refinement

The current revision keeps the dashboard and case recordings. Three new stems identify the updated run, defect and integration demonstrations: `runs-smoke`, `defects-guided` and `youtrack-guided`. They use recorded interface frames, visible cursor motion and click ripples, composed with Recordly's approved Smooth camera. Dissolves are reserved for transitions between Falcon and YouTrack; navigation within Falcon does not crossfade.

The run and YouTrack posters are purpose-built title artwork rather than arbitrary screenshots. The defect poster uses the same cover system. Final media/browser acceptance and publication are recorded separately from source preparation; historical results below describe their named revisions.

The video frame is capped at 920 px on desktop and fits the available width on smaller screens. Playback is manual for every video. Numbered chapter labels have been removed, and the page copy describes the product actions shown.

## Product story between demonstrations

Five introductions explain the workflow before their respective videos: choosing a project and dashboard context, maintaining cases and shared steps, running a scope against a build, recording a defect with its execution context, and returning to verification through tracker integration. Each introduction contains a small topic label, a heading and two paragraphs in a reading column capped at 640 px. The video beneath it retains its separate 920 px maximum width.

`ProductStory.tsx` renders the same semantic structure for every introduction. Copy lives in `overviewStory`, `workflow` and `integrationStory` in `content/demos.ts`; transcripts remain separate from this product explanation. The introductions describe existing capabilities, while the recordings show specific examples rather than every operation mentioned in the text. For example, the case recording inspects one case; the supporting prose also explains reusable shared steps and their attachments.

Keep the wording grounded in the Falcon guide: dashboard customization and drilldowns, case/shared-step authoring, run snapshots and execution, defect creation from a failed step, retest status mapping, Slack events and Confluence run reports. Do not imply that linking an arbitrary URL creates a managed tracker connection or that a ready-for-QA status confirms a passed retest.

## Video assets

Assets live in `public/falcon/landing/2026-09/`. Each demonstration has a silent H.264 MP4, a WebP poster and Russian WebVTT descriptions. Dashboard/case posters come from their exports; the three replacements use deliberate title covers. Update the poster, transcript and captions together whenever the recording changes.

| Asset stem | Flow | Duration / status |
| --- | --- | --- |
| `dashboard` | Current work, freshness values, runs and risks, defects, return | Existing recording, 23.25 s |
| `cases` | Search for a case, open, expand, inspect steps, return | Existing recording, 23.43 s |
| `runs-smoke` | Open the dedicated 100-case smoke suite, configure and create a real run, inspect HOST-TC-8 at 0/100 | 29.233333 s, 1,754 frames |
| `defects-guided` | Inspect HOST-BUG-019, its tracker backlink/context and the original run with the failed step | 16.233333 s, 974 frames |
| `youtrack-guided` | Inspect the existing connection and tag routing, open HOST-BUG-019 and the actual YouTrack issue, return to Falcon and open the original failed execution | 42.7 s, 2,562 frames |

The public replacement sets are `runs-smoke.{mp4,webp,vtt}`, `defects-guided.{mp4,webp,vtt}` and `youtrack-guided.{mp4,webp,vtt}`. Keep each video, transcript and caption timeline aligned with its final export. All three delivery reports confirm official Recordly saves, H.264 at 1600 × 900 / 60 fps and no audio: `runs-smoke.mp4` is 5,701,731 bytes; `youtrack-guided.mp4` is 9,084,956 bytes; `defects-guided.mp4` is 4,823,907 bytes. These values describe the delivered files, not production acceptance.

The replaced `runs.*`, `defects-context.*` and `youtrack-workflow.*` triplets have no remaining runtime consumers after the manifest/content update and were removed from public assets after all replacements were installed. Their editable historical masters remain outside the repository. Older `defects.*`, `youtrack-demo.*` and catalog/Slack `integrations.*` files are outside this three-triplet cleanup.

The retained dashboard/case recordings use the owner's authorized Umbrella Host QA project and did not change cases or send notifications. The new smoke recording intentionally creates a real suite/run as described below; it must not be described as stopping before submission.

### Smoke capture and data lifecycle

A separate suite named **«Смоук релиза — обзор Falcon»** contains exactly 100 existing ready cases, `HOST-TC-1` through `HOST-TC-100`. This is a selected demonstration scope, not a claim that every project has 100 cases and not a set of newly generated tests.

The recording opens this suite from the catalog, shows its 100-case composition and opens the run drawer. The drawer shows Host QA, local-current and the smoke type. Clicking «Запустить прогон» creates a real demonstration run; the recorded submitting state is preserved. The run opens at **0/100**, and `HOST-TC-8` is selected to show its description and steps. No step or case execution result is changed. After recording, the demonstration run is archived so it does not remain in the active QA queue. The suite retains its existing case references. Archive status was checked in the real History view; the active-run count returned to its prior value of four.

### Designed poster covers

`runs-smoke.webp` uses «Смоук релиза / От сьюта к прогону»; `youtrack-guided.webp` uses «Falcon × YouTrack / От дефекта к проверке». `defects-guided.webp` uses «Контекст дефекта / От ошибки к тесту». Each is a 1600 × 900 HTML/CSS/SVG composition with the existing Falcon graphite atmosphere, silver wing, Geist typography and a free center for the real Play control. The YouTrack mark is the existing catalog SVG. The suite/document paths are abstract illustrations, not simulated product UI or invented run results. No Play button is baked into the poster and no case count appears on a cover.

Editable sources, dependency assets, render scripts and responsive previews live at `../output/falcon-cursor-smoke-20260909/covers/`. `smoke-run-cover.webp` and `youtrack-cover.webp` are the reviewed source covers; they map to the public poster names above. The earlier defect poster was a cropped run-step image with captions, so it is replaced with `defects-cover.webp` from this same system.

### YouTrack capture and factual boundaries

The new recording follows these real screens:

1. Existing YouTrack connection: server URL and a masked stored-token field.
2. Existing tag → YouTrack project routing.
3. Falcon report `HOST-BUG-019` and its tracker context.
4. The actual linked YouTrack issue `umbrellandroid-7`, including its steps and current Stage.
5. The backlink to `HOST-BUG-019` in Falcon.
6. The original test run and its failed step.

These are inspections of an already configured connection. No new token is entered, no route is saved, no YouTrack status is changed, and no production run result is changed. A visible Stage is current recorded state, not evidence that the recording performed a synchronization or completed a retest. Token contents must remain masked in the source frames, the Recordly focus regions, the poster and the final export. No credentials belong in captions or transcripts.

`defects-guided` reuses captured chapters 03, 06 and 07 to show the report and its original execution context. The old empty-state flash must not remain in either replacement. Inspect the finished exports, including chapter transitions, before publishing to confirm masking, framing, readable issue/step context and the absence of loading artifacts.

## Continuous background and motion

`falcon-wing.webp` remains the hero artwork. The footer reuses that same asset with `scaleX(-1)` so the wing enters from the left. No separate footer illustration is required.

`atmosphere.webp` supplies a fixed, continuous dark background between those sections. It is 1672 × 941 px and 21,574 bytes, optimized as WebP. It was generated with the built-in image tool using the existing wing’s atmosphere as a reference: near-black `#05090c`, sparse silver dust, faint cool light and ample dark negative space, with no wings, objects, text or UI. The original generated PNG is retained outside the repository at:

`/Users/mercuryrucks/.codex/generated_images/01a08610-bb0f-7ce3-a7dd-c5bad7b25001/exec-a8d03c73-e427-49bd-af7c-5b7d1643b6a2.png`

The texture is edge-blendable rather than a guaranteed seamless tile. Fixed coverage avoids a visible vertical repeat. Keep decorative layers noninteractive and hidden from accessibility APIs.

Section motion follows the current scroll position every time a section enters or leaves the viewport; it is no longer a once-only, timed reveal. `useLandingScrollProgress` observes a stable outer wrapper and the actual scrolling container. It accounts for body becoming an independent scroller when the mobile shell changes HTML overflow and rebinds when viewport resizing changes that container. Framer Motion maps that progress through a spring, while the inner layer moves without changing the layout used to measure its progress.

Media moves from 72 px below its resting position to 0, remains still through the central viewing interval, then moves up to −32 px as it leaves. Its opacity stays at 1, and its scale never changes. Text uses the smaller 34 → 0 → −14 px movement with a restrained opacity change and the same stationary center. The hero wing follows its own 0 → 90 px scroll displacement. These values describe positional ranges, not a fixed-duration entrance animation.

Scrolling remains native; section links retain real URL anchors and use smooth browser scrolling on either the document or body when motion is allowed. Reduced-motion preferences remove the decorative transformations and smooth scrolling, including when that preference changes while the page is open. The page renders readable content before hydration and without waiting for motion. The video player remains independent: scrolling never starts or resumes a video, and the existing offscreen/hidden-document pause behavior is retained.

## Integration brand strip

The scrolling strip uses the existing Falcon integration catalog: Swagger, YouTrack, Jira, Linear, Trello, GitHub, GitLab, Jenkins, TeamCity, Slack and Confluence. GitLab, Jenkins and TeamCity retain the visible label **«Скоро»**; inclusion in the strip must not imply that those connections are available today.

One accessible list describes the eleven brands. Any duplicate list used for a continuous visual loop is hidden from accessibility APIs. Users can pause the strip; it also pauses when the pointer is over the brand window or the document is hidden, and it respects reduced-motion preferences. Hovering or focusing the pause button itself does not force a pause, so its Resume action takes effect immediately with either a click or keyboard activation. The single YouTrack video appears below the strip.

## Editable masters

The original captures, cursor telemetry, scene timing, editable `.recordly` projects, full-quality exports and Recordly export reports are stored outside the deployed repository. Dashboard and cases remain in use; the original run-builder and defect masters are retained for historical reference:

`../output/falcon-landing-20260909/{dashboard,cases,runs,defects}-recordly/`

Each folder contains `source.mp4`, `source.mp4.cursor.json`, `scenes.json` and `Falcon-<name>.recordly`. Open the project in Recordly to revise zoom regions, framing and cursor style. Keep the source files in place: the projects reference their absolute paths on the recording workstation. The earlier Slack/catalog master remains in the sibling `integrations-recordly/` folder for historical reference.

The preceding catalog/report-only YouTrack master is retained for historical reference at:

`../output/falcon-landing-refinement-20260909/youtrack-recordly/`

This folder retains `source.mp4`, `source.mp4.cursor.json`, `scenes.json`, the editable `Falcon-youtrack.recordly` project, the full-quality `falcon-youtrack.mp4` export and `falcon-youtrack.mp4.report.json`. The report confirms a successful save of that earlier revision. Its compressed public files used `youtrack-demo.*`.

The current composition and delivery workspace is:

`../output/falcon-cursor-smoke-20260909/`

Each ID has a manifest and an editable master folder: `runs-smoke-recordly/`, `defects-guided-recordly/` and `youtrack-guided-recordly/`. Guided videos reuse the authorized real frames at `../output/falcon-player-youtrack-20260909/capture/<chapter>/`; the new smoke capture and its manifest are retained in the current workspace. `delivery.json` records each final file's measurements and the official Recordly report. Keep those files, the editable project, capture frames and cursor telemetry together.

The visible cursor follows actual recorded coordinates, and recorded clicks receive a ripple. No extra user action is invented to make the video appear interactive. The integration composition contains six recorded clicks and the defect composition one; the smoke flow records the suite, launch, submit and case-selection clicks. Chapters without recorded motion do not gain fabricated pointer gestures. Smooth camera focus preserves the recorded target positions through the crop.

Only the transitions from Falcon to YouTrack and back use a 200 ms dissolve. The guided defect recording and the smoke flow have no service transitions and no dissolves. The original transient empty run frame is excluded from the guided source trim, while the application loading fix independently prevents that false state during live navigation. Real submitting/loading feedback remains visible where it belongs in the smoke flow.

Source screenshots retain their capture cadence; 60 fps describes Recordly's camera/cursor/caption composition, not the screenshot acquisition rate. Native captions describe visible actions and clear before important clicks; they are not audio transcription because the videos are silent. Final review must include click alignment, masked token contents, routing, the YouTrack issue/Stage, readable expected/actual results and the completed smoke scope. Historical `youtrack-workflow-recordly/` and `defects-context-recordly/` masters remain in the preceding output workspace and are not the guided delivery files.

The original output directory also retains `capture.mjs`, `normalize-source.mjs` and `export-demo.mjs`. FFmpeg assembles/normalizes real source frames, compresses the finished Recordly export and extracts posters. Recordly provides the approved zoom/cursor composition; its source code is not bundled into Falcon.

## Playback and delivery

- Sources may attach as players enter the viewport so metadata can load, but neither loading nor visibility starts playback. All five videos require an explicit Play action.
- Videos do not autoplay or loop. They pause offscreen and when the document is hidden. Returning to the page or scrolling back does not resume playback automatically.
- Controls support play/pause, seeking and fullscreen. Every recording has a plain-text description under “Что в видео”. Failed media requests expose a retry action.
- Reduced motion disables decorative motion; manual video playback remains available.
- Videos use the existing Pages origin through the TMS Cloudflare Worker. Byte-range responses are preserved for seeking. The Worker validates MP4/VTT content types and does not forward account credentials to the asset origin.
- Release readiness must include the replacement video, poster and captions, plus the decorative background assets. Missing required assets fail deployment before publishing.

### Playback timeline

`connectPlaybackTimeline` samples the video's actual `currentTime` with `requestAnimationFrame` while media is advancing. The thumb is no longer quantized to 0.1-second steps or updated only by infrequent `timeupdate` events. It follows the media clock directly rather than estimating progress, so it cannot visually run ahead while the video buffers. React owns playback/error state; the timeline updates the native range and elapsed-time text without rerendering the entire player on every frame.

Buffering, seeking, pause, end, hidden-document state and unmount stop the frame loop. Media events still synchronize the control when paused or metadata changes. Pointer scrubbing owns the native thumb until release or cancellation. Arrow keys seek by one second, Page Up/Down by five, and Home/End go to the bounds; values are clamped to the real duration. The accessible value text includes elapsed time and duration. Invalid duration or a media error disables the range. These changes do not grant the timeline permission to start playback.

### Run loading shown in demonstrations

The run UI implementation now distinguishes a pending scope from a successfully loaded empty scope. `useSelectedRunResource` exposes readiness for the selected project/run scope; `WorkspaceRunsStage` passes that readiness through `RunsView` to `RunNavigator`. While items are pending, the navigator displays four neutral skeleton rows and a loading count marker. If the run summary itself is unavailable, the existing centered Falcon loader is used. An empty scope is displayed only after the item response resolves empty, even when an earlier summary has `itemCount: 0`.

Archived deep links select History synchronously rather than showing the active-run empty state until an effect runs. Failed requests retain their explicit retryable error. This fixes the live UI, independently of replacing the earlier recording; editing a video alone would not correct navigation for Falcon users.

## Verification

Baseline validation of the preceding player/run-loading revision, before this cursor/smoke/cover replacement:

| Check | Result |
| --- | --- |
| `npm run test:tms-auth` | 49/49 passed with both replacement asset sets installed |
| Focused navigator/scope regression suite | 13/13 passed |
| `npm run test:tms-adapters` | 418/418 passed, including five new pending/empty/archive state regressions |
| `npm run test:tms-worker` | 43/43 passed after content/manifest changes |
| `npm run typecheck` | Passed |
| `npm run architecture:tms` | Passed, 607 files checked |
| Isolated runtime browser scenarios | 4/4 passed: delayed items with stale zero-count summary, archived deep link, authoritative empty response, initially missing summary |

The browser harness uses the real run stage, resource hook, navigator, DTO mappers and providers with local GET fixtures; it is not a shipping route. A MutationObserver recorded zero false empty-state DOM frames before responses and zero for each nonempty scenario after resolution. The canonical dark tokens and skeleton fill were checked, and resolved runs displayed the actual fixture step. No production data was read or mutated by these scenarios. Scripts, `results.json` and pending/resolved screenshots are retained at `../output/falcon-player-youtrack-20260909/run-loading-qa/`.

The timeline helper's eight regression cases passed, covering frame sampling, buffering, paused seeking, ending, pointer ownership, hidden pages, cleanup and invalid metadata. The seven existing manual-playback browser regressions also passed. A local browser sample recorded 120 distinct thumb values over 120 display frames, while only eight `timeupdate` events fired; maximum difference from sampled `currentTime` was 0.000146 seconds, with zero React commits during the playback sample. Mouse, keyboard and touch seeking, pause/end/restart, fullscreen and offscreen behavior were checked. These measurements are local observations, not a production performance guarantee.

Timeline evidence and scripts are retained at `../output/falcon-player-timeline-20260909/`, including `timeline-browser-qa.json` and `manual-playback-qa.json`; reported page errors were empty. Independent changed-source review found no concrete P1/P2 issues. Recheck the controls against all three final replacement media files after export. Neither the current local checks nor the earlier suites below establishes acceptance of newly exported media or production deployment.

Confirmed checks for the preceding media refinement (`dd56b5b4`), before the product-story and continuous-scroll changes:

| Check | Result |
| --- | --- |
| Manual-player browser regression | 7/7 passed: includes metadata-load race, keyboard activation, offscreen pause, document visibility and ended/non-looping behavior |
| `npm run test:tms-auth` | 41/41 passed |
| `npm run test:tms-adapters` | 413/413 passed |
| `npm run test:tms-worker` | 43/43 passed |
| `npm run typecheck` | Passed |
| `npm run architecture:tms` | Passed, 606 files checked |

Independent layout inspection covered 1600, 390 and 320 px viewports. All five players remained paused until Play, had no autoplay or loop enabled, and the page had no horizontal overflow or JavaScript errors. The desktop video content measured 918 px inside the 920 px frame. A footer contrast issue was corrected by fading the bright wing before the metadata row and rendering the Falcon name in white; desktop and mobile screenshots were then rechecked. Evidence is retained as `independent-layout.json`, `independent-manual-play.json` and `independent-footer-fixed-{1600,390,320}.png` under `../output/falcon-landing-refinement-20260909/`.

`npm run test:tms-auth` checks public navigation and media integrity. `npm run test:tms-worker` covers byte ranges, content types, required assets and deployment gates. Browser verification must cover all five final media files, their real dimensions and durations, manual playback, seeking, fullscreen, error recovery, reduced motion, FAQ links, and 320/390/768/1600 px layouts.

For each revision, explicitly verify that videos remain paused on initial load and after returning from offscreen or a hidden document, do not loop at the end, and start only after Play. Check the integration strip’s pause control, reduced-motion behavior and «Скоро» labels. Inspect the fixed atmosphere and mirrored footer wing at desktop and mobile widths.

Local verification of the product-story revision passed 41 public/auth tests, 413 adapter/domain tests, typecheck and the 606-file architecture check. The browser suite passed all five manual-play/seek/fullscreen checks, the brand strip and 1600/1024/768/390/320 px layouts. Seven playback lifecycle checks and failed-media retry passed separately. Current evidence is retained under `../output/falcon-landing-story-20260909/`; these local results do not establish production deployment.

Real wheel events and native anchor navigation were tested separately at 1440, 1000, 768 and 390 px. This caught and corrected an independent body scroller that programmatic document scrolling did not expose. `scroll-owners-qa.mjs` covers the actual owner, a direct section hash before hydration, repeated movement, responsive owner changes and reduced-motion preferences. `scroll-motion-qa.mjs` separately measures spring continuity and the stationary central interval. Inspect the five introductions at desktop and mobile widths and recheck manual playback during those movements whenever their layout or motion changes.

Run the broader `refinement-qa` browser checks against both the local server and the published public URL, without signing in or mutating data. They exercise all five videos, play/seek/fullscreen controls, responsive layouts and the integration strip. Record those browser results and deployment outcomes in the release report separately from the confirmed checks above. Versioned `runs-smoke.*`, `youtrack-guided.*` and `defects-guided.*` filenames prevent older media from being mistaken for the replacements.

Preceding `youtrack-workflow` / `defects-context` media acceptance: both MP4s fully decoded without errors and their final review frames passed. With the installed assets, all 49 public/auth tests passed. The local landing browser suite passed eleven checks covering all five manual players, seeking/fullscreen, the brand strip, 1600/1024/768/390/320 px layouts and reduced motion, with no page errors or failed asset requests. Evidence is retained in `../output/falcon-player-youtrack-20260909/local-refinement-qa.json`. Production release and response-byte verification are recorded separately after publication.


Current cursor/smoke/cover local acceptance: all three replacement triplets are installed. The new revision passed 49/49 public/auth tests, 43/43 Worker tests, typecheck (exit 0) and the 607-file architecture check. Its eleven runtime checks passed all five manual players, seeking/fullscreen, the eleven-brand strip, 1600/1024/768/390/320 px layouts and reduced motion, with zero reported errors. Evidence is retained at `../output/falcon-cursor-smoke-20260909/local-refinement-qa.json`.

All three covers were also visually checked in a 920 px frame and at 390/320 px viewport widths with the real Play control dimensions. Additional installed-cover and timeline browser checks are tracked separately. Build and production results are not claimed here; the release owner records them after those steps complete.

Installed-cover verification passed for all three new posters before playback, with the real Play control visible and currentTime 0. The local timeline check again recorded 120 distinct positions in 120 display frames, with eight timeupdate events, zero React commits and no page errors; mouse, keyboard and touch seek, pause/end/restart and fullscreen passed. Current evidence is retained at `../output/falcon-cursor-smoke-20260909/local-cover-qa.json` and `timeline-browser-qa.json`. Production build and byte-for-byte release acceptance are recorded in the external release report after deployment.
