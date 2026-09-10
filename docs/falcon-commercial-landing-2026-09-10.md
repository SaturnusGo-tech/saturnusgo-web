# Falcon commercial landing — 10 September 2026

## Product flow

The public landing follows one example release of a mobile banking product: plan → repository → run → defect → YouTrack → results. The copy explains the outcome of each stage before the video. The final sections explain company access and the pilot process. The header and footer lead to a pilot discussion; direct contact is https://t.me/bysieger. There is no public account-creation CTA or invented customer endorsement.

All six recordings use the current Falcon frontend and real backend operations in an isolated local PostgreSQL database. The example contains 240 cases distributed across 24 leaf folders, six suites, populated runs and a configured dashboard. The release smoke contains 100 cases. Creating a run and marking its first case passed are actual API operations. No production company, employee, case or run was modified for these recordings.

## Current assets

Public directory: `public/falcon/landing/2026-09-commercial/`. Each stem includes MP4, WebP and Russian WebVTT. All MP4s are silent H.264, 1600 × 900, 60 fps, with fast-start metadata.

| Stem | Recorded workflow | Duration |
| --- | --- | --- |
| projects | Project description and test plan, repository, case search | 28.950 s |
| cases | Nested repository, transfer steps, insufficient-funds case, payment search | 26.067 s |
| runs | Suite catalog, 100-case smoke launch for rc.4, step and case results | 35.683 s |
| defects | Reproduction, expected/actual result and the original failed execution | 24.117 s |
| youtrack | Linked issue, change to Test, Falcon ready-for-retest status, original execution | 35.250 s |
| dashboard | Work queue, results and test-base contexts | 27.950 s |

Browser automation records the current interface and pointer events. Official Recordly exports provide cursor smoothing, click feedback and the approved smooth camera movement. Only the two service switches in the YouTrack film use a short dissolve. Loading and synchronization waits are shortened; intra-Falcon navigation remains recorded navigation.

The cover combines a deliberately chosen current interface frame with a shared HTML/CSS title treatment. The real Play button remains interactive and is not baked into an image. The cover disappears after the first play. All videos require manual playback, do not loop, pause offscreen and retain the existing frame-driven seek control. Decorative wing/background assets are unchanged; legacy media stays available for previously cached pages, but is not referenced by current content or required-asset deployment gates.

## YouTrack provenance

The single demonstration issue `umbrellandroid-13` was created by the real Falcon YouTrack outbox in the authorized Umbrella YouTrack project. Its description and stage were changed only for this demonstration. No message or comment was sent to another person.

The recorded issue stage was changed in the actual YouTrack interface to «Тест». Because the capture backend runs locally without a public webhook tunnel, the actual remote update event was relayed to the local production webhook handler. The handler fetched the remote issue and resolved its actual stage; the event did not supply an invented status. The resulting Falcon defect was `ready_for_retest`. This establishes the recorded integration behavior, but does not claim that a public production webhook endpoint was tested during this capture. The product transcript explains shortened waits and the separate tracker tab.

## Reproducibility

Editable Recordly projects, original captures, pointer tracks, scripts and browser evidence are retained outside the shipping repository at `../output/falcon-commercial-20260910/`. Each film has a `recordings/<stem>/Falcon-<stem>.recordly` master. The private local session and browser state must never be committed or published. The local demo database is separate from all company databases.

When changing a film, update its MP4, poster, VTT, description and transcript together. `route-manifest.mjs` requires all 18 current assets; both Pages export and Worker readiness checks reject a missing asset. Public media integrity tests check the complete six-film set and the per-file budget.

## Source and local acceptance

- `npm run typecheck`: passed.
- `npm run architecture:tms`: passed, 866 files checked.
- `npm run check:tms-contract`: passed; no generated contract drift.
- `npm run test:tms-auth`: 50 passed.
- `npm run test:tms-worker`: 53 passed.
- Browser playback: all six started only on Play, paused correctly and accepted keyboard seeking. Each 1.2-second sample showed 73 timeline changes across 74 display frames; cover removal passed for every film.
- Desktop (1440 px) and mobile (390 px) visual review passed. No horizontal overflow, page exceptions or failed Falcon media responses. Reduced-motion mode was checked.
- FFprobe verified all six exports at 1600 × 900 / 60 fps. Current interface frames and cursor/zoom framing were visually reviewed.

Evidence: `evidence/player-qa.json`, `evidence/media-check.json`, landing screenshots and the Recordly export reports in the output directory. These are local results; publication and live checks are recorded separately after release.
