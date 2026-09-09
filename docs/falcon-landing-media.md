# Falcon landing media

The public landing presents five recordings of the Falcon interface. Recordly 1.4.0 for macOS provides the Smooth preset, 1.25× focus regions, cursor smoothing and click feedback. The first sample’s motion was approved on 9 September 2026. Browser automation captures the real interface and pointer events; Recordly composes the final motion. Generated images are used only as decorative backgrounds, never as product UI.

## September 2026 refinement

The current revision keeps the dashboard, case and run-builder recordings. It replaces both the earlier catalog/report-only YouTrack demonstration and the defect recording with new captures that show the existing connection, the actual linked YouTrack issue and the original failed execution. The replacement stems are `youtrack-workflow` and `defects-context`; their source frames and cursor telemetry are captured from the real interface. Both replacement exports were rendered by the official Recordly application and visually inspected. Publication remains a separate release-pipeline check.

The preceding `youtrack-demo` revision was exported successfully by the official Recordly application: 2,302 frames at 60 fps, rendered with WebGPU, with `phase: saved`. Its duration was 38.3666667 seconds. Those figures describe the superseded clip, not the new `youtrack-workflow` export.

The video frame is capped at 920 px on desktop and fits the available width on smaller screens. Playback is manual for every video. Numbered chapter labels have been removed, and the page copy describes the product actions shown.

## Product story between demonstrations

Five introductions explain the workflow before their respective videos: choosing a project and dashboard context, maintaining cases and shared steps, running a scope against a build, recording a defect with its execution context, and returning to verification through tracker integration. Each introduction contains a small topic label, a heading and two paragraphs in a reading column capped at 640 px. The video beneath it retains its separate 920 px maximum width.

`ProductStory.tsx` renders the same semantic structure for every introduction. Copy lives in `overviewStory`, `workflow` and `integrationStory` in `content/demos.ts`; transcripts remain separate from this product explanation. The introductions describe existing capabilities, while the recordings show specific examples rather than every operation mentioned in the text. For example, the case recording inspects one case; the supporting prose also explains reusable shared steps and their attachments.

Keep the wording grounded in the Falcon guide: dashboard customization and drilldowns, case/shared-step authoring, run snapshots and execution, defect creation from a failed step, retest status mapping, Slack events and Confluence run reports. Do not imply that linking an arbitrary URL creates a managed tracker connection or that a ready-for-QA status confirms a passed retest.

## Video assets

Assets live in `public/falcon/landing/2026-09/`. Each demonstration has a silent H.264 MP4, a WebP poster extracted from its final export and Russian WebVTT descriptions. Update the poster, transcript and captions together whenever the recording changes.

| Asset stem | Flow | Duration / status |
| --- | --- | --- |
| `dashboard` | Current work, freshness values, runs and risks, defects, return | Existing recording, 23.25 s |
| `cases` | Search for a case, open, expand, inspect steps, return | Existing recording, 23.43 s |
| `runs` | Open a suite’s run builder, fill name/build, inspect type and scope | Existing recording, 21.42 s |
| `defects-context` | Inspect HOST-BUG-019, its tracker backlink/context and the original run with the failed step | 15.333333 s, 920 frames |
| `youtrack-workflow` | Inspect the existing connection and tag routing, open HOST-BUG-019 and the actual YouTrack issue, return to Falcon and open the original failed execution | 41.4 s, 2,484 frames |

The replacement public files use `youtrack-workflow.{mp4,webp,vtt}` and `defects-context.{mp4,webp,vtt}`. Keep the three representations in each set aligned with the final Recordly export. Both are H.264, 1600 × 900 at 60 fps. `youtrack-workflow.mp4` is 8,066,469 bytes with a poster at 2.4 seconds; `defects-context.mp4` is 3,687,953 bytes with a poster at 11.9 seconds. Their new names prevent cached copies of the earlier recordings from being reused. The earlier `defects.*`, `youtrack-demo.*` and catalog/Slack `integrations.*` sets are superseded for these two landing positions. For historical identification only, `youtrack-demo.mp4` was 3,957,757 bytes and used a poster at 13.8 seconds; do not apply those measurements or cue times to the replacements.

The retained recordings use the owner’s authorized Umbrella Host QA project. The run-builder recording ends before submission. Those captures did not create runs, modify cases, change integration settings or send notifications.

### YouTrack capture and factual boundaries

The new recording follows these real screens:

1. Existing YouTrack connection: server URL and a masked stored-token field.
2. Existing tag → YouTrack project routing.
3. Falcon report `HOST-BUG-019` and its tracker context.
4. The actual linked YouTrack issue `umbrellandroid-7`, including its steps and current Stage.
5. The backlink to `HOST-BUG-019` in Falcon.
6. The original test run and its failed step.

These are inspections of an already configured connection. No new token is entered, no route is saved, no YouTrack status is changed, and no production run result is changed. A visible Stage is current recorded state, not evidence that the recording performed a synchronization or completed a retest. Token contents must remain masked in the source frames, the Recordly focus regions, the poster and the final export. No credentials belong in captions or transcripts.

`defects-context` reuses captured chapters 03, 06 and 07 to show the report and its original execution context. The old empty-state flash must not remain in either replacement. Inspect the finished exports, including chapter transitions, before publishing to confirm masking, framing, readable issue/step context and the absence of loading artifacts.

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

The original captures, cursor telemetry, scene timing, editable `.recordly` projects, full-quality exports and Recordly export reports are stored outside the deployed repository. Dashboard, cases and run-builder remain in use; the original defect master is retained for historical reference:

`../output/falcon-landing-20260909/{dashboard,cases,runs,defects}-recordly/`

Each folder contains `source.mp4`, `source.mp4.cursor.json`, `scenes.json` and `Falcon-<name>.recordly`. Open the project in Recordly to revise zoom regions, framing and cursor style. Keep the source files in place: the projects reference their absolute paths on the recording workstation. The earlier Slack/catalog master remains in the sibling `integrations-recordly/` folder for historical reference.

The preceding catalog/report-only YouTrack master is retained for historical reference at:

`../output/falcon-landing-refinement-20260909/youtrack-recordly/`

This folder retains `source.mp4`, `source.mp4.cursor.json`, `scenes.json`, the editable `Falcon-youtrack.recordly` project, the full-quality `falcon-youtrack.mp4` export and `falcon-youtrack.mp4.report.json`. The report confirms a successful save of that earlier revision. Its compressed public files used `youtrack-demo.*`.

The current capture and assembly workspace is:

`../output/falcon-player-youtrack-20260909/`

Real source frames and cursor telemetry live in `capture/<chapter>/`. `build-demo.mjs` validates the capture manifest, assembles the recorded frames and creates editable Recordly projects. The integration master is `youtrack-workflow-recordly/` with output ID `youtrack-workflow`; the shorter report/execution composition uses output ID `defects-context`. Read the workspace `README.md` for the capture contract and export commands.

Assembly preserves recorded timing and maps actual cursor coordinates through the crop. Short chapter crossfades and authored native Recordly captions explain the visible actions; captions are not a transcript of audio because the recordings are silent. No product UI or cursor events are generated. Some source chapters contain no pointer telemetry, so both new compositions hide the synthetic cursor throughout rather than invent motion. The actual recorded UI focus/click changes remain visible. Source screenshots retain their capture cadence; 60 fps describes the final Recordly camera/caption composition, not the screenshot acquisition rate. After an official Recordly export, retain the report, `delivery.json`, representative review frames, editable project and source files together. Both final reports confirm `success: true`, `phase: saved`, modern pipeline and WebGPU rendering. Review checks covered masked token contents, all routing rows, whole-page YouTrack context, unobscured links/buttons at clicks, readable expected/actual results and the 200 ms service transitions. Native captions use a single compact row; the previous two-row setting incorrectly grouped neighboring chapter cues and was corrected before publication.

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

Current run-loading validation, performed locally before export and deployment acceptance:

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

Timeline evidence and scripts are retained at `../output/falcon-player-timeline-20260909/`, including `timeline-browser-qa.json` and `manual-playback-qa.json`; reported page errors were empty. Independent changed-source review found no concrete P1/P2 issues. Recheck the controls against both final replacement media files after export. Neither the current local checks nor the earlier suites below establishes acceptance of newly exported media or production deployment.

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

Run the broader `refinement-qa` browser checks against both the local server and the published public URL, without signing in or mutating data. They exercise all five videos, play/seek/fullscreen controls, responsive layouts and the integration strip. Record those browser results and deployment outcomes in the release report separately from the confirmed checks above. Versioned `youtrack-workflow.*` and `defects-context.*` filenames prevent older integration/defect media from being mistaken for the replacements.

Current replacement-media acceptance: both MP4s fully decoded without errors and their final review frames passed. With the installed assets, all 49 public/auth tests passed. The local landing browser suite passed eleven checks covering all five manual players, seeking/fullscreen, the brand strip, 1600/1024/768/390/320 px layouts and reduced motion, with no page errors or failed asset requests. Evidence is retained in `../output/falcon-player-youtrack-20260909/local-refinement-qa.json`. Production release and response-byte verification are recorded separately after publication.
