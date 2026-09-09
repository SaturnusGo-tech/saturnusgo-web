# Falcon landing media

The public landing presents five recordings of the Falcon interface. Recordly 1.4.0 for macOS provides the Smooth preset, 1.25× focus regions, cursor smoothing and click feedback. The first sample’s motion was approved on 9 September 2026. Browser automation captures the real interface and pointer events; Recordly composes the final motion. Generated images are used only as decorative backgrounds, never as product UI.

## September 2026 refinement

The refinement keeps the dashboard, case, run-builder and defect recordings. It replaces the catalog/Slack recording with one YouTrack demonstration beneath the integration brand strip. The replacement was exported successfully by the official Recordly application: 2,302 frames at 60 fps, rendered with WebGPU, with the export report ending in `phase: saved`. The final video duration is 38.3666667 seconds. Publication is verified separately through the existing release pipeline.

The video frame is capped at 920 px on desktop and fits the available width on smaller screens. Playback is manual for every video. Numbered chapter labels have been removed, and the page copy describes the product actions shown.

## Video assets

Assets live in `public/falcon/landing/2026-09/`. Each demonstration has a silent H.264 MP4, a WebP poster extracted from its final export and Russian WebVTT descriptions. Update the poster, transcript and captions together whenever the recording changes.

| Asset stem | Flow | Duration / status |
| --- | --- | --- |
| `dashboard` | Current work, freshness values, runs and risks, defects, return | Existing recording, 23.25 s |
| `cases` | Search for a case, open, expand, inspect steps, return | Existing recording, 23.43 s |
| `runs` | Open a suite’s run builder, fill name/build, inspect type and scope | Existing recording, 21.42 s |
| `defects` | Open a report, inspect its tracker link, open the linked execution, return | Existing recording, 20.60 s |
| `youtrack-demo` | Find the connected YouTrack integration, open HOST-BUG-019 marked «На проверку», highlight its YouTrack link, open the linked test run and return | 38.3666667 s |

The new integration files are `youtrack-demo.mp4`, `youtrack-demo.webp` and `youtrack-demo.vtt`. The compressed MP4 is 3,957,757 bytes. Its poster comes from 13.8 seconds in the final export; that timestamp is recorded in `scenes.json`. The earlier `integrations.*` recording shows catalog search and Slack settings and is not used as this revision’s integration preview.

The four retained recordings use the owner’s authorized Umbrella Host QA project. The run-builder recording ends before submission. Those captures did not create runs, modify cases, change integration settings or send notifications. Access credentials are not shown. The YouTrack replacement uses catalog search and report/run navigation. It does not show connection settings, tokens or tracker project configuration. It does not edit the report or integration. Inspect the finished export before publishing to confirm framing and readable context.

## Continuous background and motion

`falcon-wing.webp` remains the hero artwork. The footer reuses that same asset with `scaleX(-1)` so the wing enters from the left. No separate footer illustration is required.

`atmosphere.webp` supplies a fixed, continuous dark background between those sections. It is 1672 × 941 px and 21,574 bytes, optimized as WebP. It was generated with the built-in image tool using the existing wing’s atmosphere as a reference: near-black `#05090c`, sparse silver dust, faint cool light and ample dark negative space, with no wings, objects, text or UI. The original generated PNG is retained outside the repository at:

`/Users/mercuryrucks/.codex/generated_images/01a08610-bb0f-7ce3-a7dd-c5bad7b25001/exec-a8d03c73-e427-49bd-af7c-5b7d1643b6a2.png`

The texture is edge-blendable rather than a guaranteed seamless tile. Fixed coverage avoids a visible vertical repeat. Keep decorative layers noninteractive and hidden from accessibility APIs.

Section reveals use a modest 34 px movement over 0.8 seconds. Reduced-motion preferences disable decorative movement. The page remains readable without waiting for animations.

## Integration brand strip

The scrolling strip uses the existing Falcon integration catalog: Swagger, YouTrack, Jira, Linear, Trello, GitHub, GitLab, Jenkins, TeamCity, Slack and Confluence. GitLab, Jenkins and TeamCity retain the visible label **«Скоро»**; inclusion in the strip must not imply that those connections are available today.

One accessible list describes the eleven brands. Any duplicate list used for a continuous visual loop is hidden from accessibility APIs. Users can pause the strip; it also pauses when the pointer is over the brand window or the document is hidden, and it respects reduced-motion preferences. Hovering or focusing the pause button itself does not force a pause, so its Resume action takes effect immediately with either a click or keyboard activation. The single YouTrack video appears below the strip.

## Editable masters

The four retained captures, cursor telemetry, scene timing, editable `.recordly` projects, full-quality exports and Recordly export reports are stored outside the deployed repository:

`../output/falcon-landing-20260909/{dashboard,cases,runs,defects}-recordly/`

Each folder contains `source.mp4`, `source.mp4.cursor.json`, `scenes.json` and `Falcon-<name>.recordly`. Open the project in Recordly to revise zoom regions, framing and cursor style. Keep the source files in place: the projects reference their absolute paths on the recording workstation. The earlier Slack/catalog master remains in the sibling `integrations-recordly/` folder for historical reference.

The YouTrack replacement’s working directory is:

`../output/falcon-landing-refinement-20260909/youtrack-recordly/`

This folder retains `source.mp4`, `source.mp4.cursor.json`, `scenes.json`, the editable `Falcon-youtrack.recordly` project, the full-quality `falcon-youtrack.mp4` export and `falcon-youtrack.mp4.report.json`. The report confirms a successful save. Its compressed public files use the `youtrack-demo.*` names listed above.

The original output directory retains `capture.mjs`, `normalize-source.mjs` and `export-demo.mjs`. FFmpeg only normalizes capture timestamps, compresses the finished Recordly export and extracts posters. Recordly source code is not bundled into Falcon.

## Playback and delivery

- Sources may attach as players enter the viewport so metadata can load, but neither loading nor visibility starts playback. All five videos require an explicit Play action.
- Videos do not autoplay or loop. They pause offscreen and when the document is hidden. Returning to the page or scrolling back does not resume playback automatically.
- Controls support play/pause, seeking and fullscreen. Every recording has a plain-text description under “Что в видео”. Failed media requests expose a retry action.
- Reduced motion disables decorative motion; manual video playback remains available.
- Videos use the existing Pages origin through the TMS Cloudflare Worker. Byte-range responses are preserved for seeking. The Worker validates MP4/VTT content types and does not forward account credentials to the asset origin.
- Release readiness must include the replacement video, poster and captions, plus the decorative background assets. Missing required assets fail deployment before publishing.

## Verification

Confirmed checks for this refinement:

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

For this refinement, explicitly verify that videos remain paused on initial load and after returning from offscreen or a hidden document, do not loop at the end, and start only after Play. Check the integration strip’s pause control, reduced-motion behavior and «Скоро» labels. Inspect the fixed atmosphere and mirrored footer wing at desktop and mobile widths.

Run the broader `refinement-qa` browser checks against both the local server and the published public URL, without signing in or mutating data. They exercise all five videos, play/seek/fullscreen controls, responsive layouts and the integration strip. Record those browser results and deployment outcomes in the release report separately from the confirmed checks above. New filenames for the YouTrack clip prevent cached `integrations.*` media from being mistaken for the replacement.
