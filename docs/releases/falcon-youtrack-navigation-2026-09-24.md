# YouTrack landing video: actual issue navigation

Replaces only the English YouTrack film. The accepted report-creation footage is retained;
the ending now records the actual Falcon issue-link click and the real YouTrack issue.
Reproduction steps, testing context, expected result and actual result are visible.

Assets: `public/falcon/landing/2026-09-english-natural/youtrack-navigation.{mp4,webp,vtt}`.
The other six English films and all Russian films are unchanged. New names avoid stale media caches.
The English transcript describes the recorded sequence without claiming a status transition.

The 26.4-second film was exported through Recordly at 1728 × 1118, 60 fps, with the prior
natural cursor timing and gentle title focus. The YouTrack capture retains its native aspect
ratio with horizontal padding. English subtitles are delivered as WebVTT. No recreated tracker UI.

The YouTrack profile language was temporarily switched to English and restored to Russian.
Existing project-defined field names remain in their configured language; shared YouTrack
project settings were not changed for a recording.

The local demo backlink points to the local landing instead of the application route.
That attempted return was excluded, and this film makes no claim to demonstrate reverse
navigation. This recording observation is not evidence of the production backlink configuration.

Evidence: `../output/falcon-english-20260923/youtrack-navigation/` contains the recording plan,
review and build log; `films-youtrack-navigation/youtrack/` retains the Recordly project,
export report, cursor alignment, full-decode check and original source hashes.
Raw sources are preserved. Local browser playback reached the end with no media error and
English subtitles loaded. Deployment and live-response verification are recorded separately.
