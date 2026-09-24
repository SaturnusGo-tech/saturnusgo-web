# English dashboard and YouTrack recordings, 24 September 2026

Replaces only the two English films requested by the founder. The other five English films and all Russian films are retained. No Recordly executable, renderer, cursor assets, spring, camera zoom or speed change was used for these two replacements.

| Film | Asset stem | Length | Capture |
| --- | --- | --- | --- |
| Quality metrics | `dashboard-direct` | 26.80 s | Real isolated Payments project, current production frontend, localhost API |
| Falcon and YouTrack | `youtrack-cycle-direct` | 56.15 s | Authorized production demonstration in Falcon Guide and the existing YouTrack integration |

Assets live in `public/falcon/landing/2026-09-english-natural/`. Each film has MP4, WebP and English WebVTT files. Versioned stems avoid serving the rejected films from an existing media cache. SHA-256 values and dimensions are in `falcon-english-media-2026-09-23.json`.

## What is actually demonstrated

Dashboard: Transfers has one failed check in the selected period. Clicking that count opens exactly one failed check in Release smoke · rc.1. Opening the check shows PAY-TC-1 on build 2.8.0-rc.1, its passed preliminary steps, and the failed balance-update step with expected and actual results. This is a check-metric drilldown, not a switch to an unrelated bug list. The data belongs to an isolated demonstration project, not a claim about a customer release.

YouTrack: GUIDE-BUG-002 originates from the failed first step of GUIDE-TC-2 in an actual demonstration run. Falcon delivered it to `umbrellandroid-19`. The issue was moved to the existing YouTrack Test stage through the UI. The incoming webhook moved Falcon to Ready for QA. A new linked retest on 2.8.0-rc.2 passed; the actual result was saved, and the fix was explicitly confirmed from case history. Falcon showed Verified and then “YouTrack confirmed the transition to Done.” YouTrack itself showed the resolved Done stage and “Updated by TMS Integration.” The final status was not manually set in YouTrack.

The UI locale was English during filming. Existing YouTrack custom-field names/values are Russian because that project defines them globally; these shared configuration values were not renamed for the recording. English captions explain the workflow. The owner's Falcon and YouTrack profile languages were restored to Russian afterwards.

The demonstration records simulated transfer results; no bank transfer or actual product test was performed.

## Recording and editing

Original JPEG screencast frames, timestamps, pointer events, and capture manifests are retained under `../output/falcon-direct-20260924/raw/`. The reproducible encoder is `../output/falcon-direct-20260924/tools/build-direct.py`; assembled files and edit provenance are under `films/` there. No original recordings were overwritten.

The encoder holds each actual frame until its next captured timestamp and exports at 60 fps. This output cadence does not imply every source interval contains 60 distinct frames. All UI actions and text entry retain recorded speed. Cuts remove idle gaps between recording segments. Three 220 ms dissolves connect Falcon and YouTrack; navigation within each application is direct. The dashboard removes one static interval preceding its click. No UI state, text, metric or integration result is painted into the footage.

The pointer is an original small vector, positioned from observed click coordinates and timestamps. Render-only easing is bounded to 320–620 ms; there is no spring lag or camera movement. It is composited once. Captions use explicit positions to keep the key result visible.

## Excluded takes and limitations

Two early captures aborted because the browser tool's policy check was temporarily unavailable; they are excluded. Captures were retried through the same supported tool, contained within one active invocation, with no security-control bypass. Two subsequent exploratory takes (`youtrack-03-retest`, `youtrack-04-start-retest`) are also excluded: GUIDE-BUG-001 was created from the case rather than a run occurrence, and its retest found no executable case.

That preparatory defect remains labeled Demo as GUIDE-BUG-001 / `umbrellandroid-18`; it was not irreversibly deleted or presented as successfully verified. The successful demonstration uses GUIDE-BUG-002 only. The incoming update appeared in the defect list before the open detail card refreshed; the recording resumes from the refreshed real card. Neither limitation was hidden by fabricating a successful state. Both deserve separate product follow-up.

The complete failed and passed demonstration runs remain in history. No customer tests, workflow definitions, integration credentials or shared project statuses were changed.

## Validation

Both complete streams decode without errors. The browser preview was checked at normal playback speed; first/last frames, drilldown content, actual step result, status synchronization and cursor placement were reviewed. The production release runs the landing locale/media checks and deployment checks, then verifies all seven English asset triplets against the manifest. Publication evidence is recorded in the accompanying task output.
