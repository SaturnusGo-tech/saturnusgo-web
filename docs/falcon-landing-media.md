# Falcon landing media

The public landing uses five recordings of the current Falcon interface. Each recording is composed and exported by the official Recordly 1.4.0 macOS application, with its Smooth preset, 1.25× focus regions, cursor smoothing and click feedback. The first sample's motion was approved on 9 September 2026.

## Published assets

Assets live in `public/falcon/landing/2026-09/`. Each demonstration has an H.264 MP4, a WebP poster extracted from the final recording and Russian WebVTT descriptions. There is no audio track. The generated wing illustration is decorative; no generated product UI is used.

| Recording | Actual flow | Duration |
| --- | --- | --- |
| dashboard | Current work, freshness values, runs and risks, defects, return | 23.25 s |
| cases | Search for a case, open, expand, inspect steps, return | 23.43 s |
| runs | Open a suite's run builder, fill name/build, inspect type and scope | 21.42 s |
| defects | Open a report, inspect its tracker link, open the linked execution, return | 20.60 s |
| integrations | Filter/search the catalog, open Slack automation settings, return | 23.00 s |

The run-builder recording ends before submission. Recording did not create runs, modify cases, change integration settings or send notifications. Access credentials are not shown. The examples are the owner's authorized Umbrella Host QA project.

## Editable masters

Original captures, cursor telemetry, scene timing, editable `.recordly` projects, full-quality exports and Recordly export reports are retained outside the deployed repository:

`../output/falcon-landing-20260909/{dashboard,cases,runs,defects,integrations}-recordly/`

Each folder contains `source.mp4`, `source.mp4.cursor.json`, `scenes.json` and `Falcon-<name>.recordly`. Open the project in Recordly to revise its zoom regions, framing and cursor style. Keep the source files in place: the projects reference their absolute source paths on the recording workstation.

The output directory also retains `capture.mjs`, `normalize-source.mjs` and `export-demo.mjs`. Browser automation captures the real screen and pointer events; Recordly performs the motion compositing. FFmpeg only normalizes capture timestamps, compresses the finished export and extracts posters. Recordly source code is not bundled into Falcon.

## Playback and delivery

- Sources attach when a player enters the viewport. Metadata loads then; playback starts after the source has been committed to the element.
- Autoplay is silent, limited to sufficiently visible players, and pauses offscreen or when the document is hidden. An explicit pause survives scrolling away and back.
- Reduced motion disables autoplay and decorative motion. Explicit playback remains available.
- Controls support pause/play, seeking and fullscreen. Every recording also has a plain-text description under “Что в видео”. Failed media requests expose a retry action.
- Videos are served by the existing Pages origin through the TMS Cloudflare Worker. Byte-range responses are preserved for seeking. The Worker validates MP4/VTT content types and does not forward account credentials to the asset origin.
- Release readiness requires every video, poster and caption file. Missing assets fail deployment before publishing.

## Verification

`npm run test:tms-auth` checks public navigation and media integrity. `npm run test:tms-worker` covers byte ranges, content types, required assets and deployment gates. The retained `qa-landing.mjs` checks all five real media files, play/pause, seeking, fullscreen, error recovery, reduced motion, FAQ links, and 320/390/768/1600 px layouts. It runs against both a local server and the published public URL, without signing in or mutating data.

When replacing a recording, update its poster, transcript and captions together, retain the Recordly master, and run both media checks and browser verification. Use a new dated asset directory for subsequent releases so cached recordings do not mix versions.
