# Falcon landing: Russian and English

## Locale contract

The public Falcon root chooses Russian only for a primary browser language beginning
with `ru`, otherwise English. The globe beside Contact allows English, Russian or
Browser language. Explicit choices are saved under `falcon.landing.locale.v1`;
blocked storage still permits switching for the current page. Preferences synchronize
between tabs. The landing does not overwrite the authenticated TMS language preference.

The static document and social metadata are English. On hydration the browser choice
updates text, document language and metadata. Russian visitors do not see an English
content flash. There is one canonical URL, `https://tms.saturnusgo.com/`; this release
does not claim independently indexed language routes. Motion respects reduced-motion.

Copy is scoped to `core-falcon-public/landing/localization`; story and demo metadata
are in `landing/content/demos.en.ts`. The original Russian media remain unchanged.
Video players remount on locale changes so a Russian video/caption track cannot
continue under an English description. Playback is manual and media load lazily.

## English recordings

Seven independent MP4/WebP/WebVTT sets live in
`public/falcon/landing/2026-09-english-natural/`. UI and demonstration data are English.
Captions describe the actual recorded actions; supporting product text may explain
capabilities beyond that particular example.

- Projects: create Business Banking, save it in Digital Banking, browse related
  projects and open an existing Mobile Banking case.
- Cases: a real Falcon AI response turns selected preconditions into an English
  checklist; applying it creates a new case revision.
- Runs: create a release iteration, set build and owner, select 30 cases, start and
  record step results before moving to the next case.
- Suites: save a dynamic smoke-tag suite and create/start a new run from it.
- Defects: record an actual result, create a report from the failed step and follow
  its original execution context.
- Dashboard: run metrics, component defect list, specific report.
- YouTrack: real demonstration defect delivery and the resulting linked issue.

Recordings use actual browser frames and pointer events. Recordly composes 60 fps
exports with 1.25× focus regions and its smooth camera preset. Cursor travel uses
distance-aware 350–850 ms easing, with stationary holds between actions and exact
recorded click targets. Recordly's second cursor overlay is disabled.

After review of the first English cut, only text-entry fragments were recaptured
with real character-by-character input. The typing passages were individually
retimed to remove artificial keyboard delays (roughly 3–4 seconds for a short
sentence), without accelerating the surrounding UI actions. The original Falcon
AI instruction already had progressive input and was retained. Unchanged original
captures and retake frames remain outside the repository; each retimed take has
an editorial timing manifest. Loading waits and incomplete loading-only tails were
removed from the edit. A few already-loaded real frames have short reading holds,
and the portfolio selection/save actions have an 800 ms editorial pause to prevent
a cross-screen pointer jump. These presentation cuts do not establish API performance.

Versioned media URLs separate this revision from both rejected cursor exports.
Posters come from the finished films; captions are optional WebVTT tracks. Results,
AI responses and the YouTrack delivery come from the real original interactions.

The local recording workspace is isolated from customer data. A separately authorized
English demonstration case was created in production for Falcon AI; existing cases
were not edited. The account's UI language was restored after recording. YouTrack
receives a clearly named demonstration defect through the actual integration.

## Folder regression

Readonly run/selection trees incorrectly applied a grid rule to the quick-create
wrapper rather than the folder row. A stable `data-repository-folder-row` marker
now targets the correct element. Takes with clipped folder names were rejected.
The recording guard compares each visible folder label's scroll/client width before
and after the shot, and final frames are reviewed visually.

## Verification and delivery evidence

Working capture/EDL/export evidence is outside the source repository in
`output/falcon-english-20260923/`. Never copy its `private/` directory to public assets.
Final release evidence records source and Pages commits, Worker version, media hashes,
checks and live HTTP verification. Publication is complete only after those checks.

Checks before release: TypeScript passed; TMS architecture passed for 1,207 files;
auth/public/media/localization tests passed (54); folder/organization tests passed
(222). All seven final MP4 files passed full decoding. Media sizes and SHA-256
hashes are in `falcon-english-media-2026-09-23.json`.

The AI film ends on the saved case; the later history-loading shot was rejected.
YouTrack footage shows delivery, the real linked issue and original execution
context; it does not claim to show a full developer fix/retest cycle.
