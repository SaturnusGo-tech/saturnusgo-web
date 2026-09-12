# Six production landing films — 2026-09-13

The landing now uses the approved recordings of the actual Falcon production UI: case creation with Falcon AI, a 410-case run and assignee queue, suite composition, a demonstration defect and retest, dashboard drill-down, and the complete YouTrack exchange. The user explicitly excluded the overview film and authorized publication of the other six.

The public copy and transcripts follow these recordings. The previous planning video is replaced by case creation; suites have a dedicated section. The order is cases → runs → suites → defects → dashboard → YouTrack. The existing landing layout and manual playback behavior remain.

Versioned assets are under `public/falcon/landing/2026-09-production/`, with MP4, WebP and Russian VTT for each of the six stems. Files are copied byte-for-byte from the accepted deliveries in `output/falcon-films-20260912/recordings/`. No overview recording is included in this release. Earlier versioned assets remain available for cached documents but are not referenced by the new landing.

The native page captures are 1728×1117 CSS pixels, encoded to 1728×1118 with one padding row. The player preserves this aspect ratio, including the collapsed sidebar and the actual profile photo. Russian captions are enabled initially and can be toggled with CC. Captures use native Chrome frames and a compositor of observed pointer events; they are not Recordly exports. Demonstration failure/pass marks show the Falcon workflow and do not claim that Umbrella Home was tested or fixed. YouTrack status changes and their acknowledgements were actual production events.

Validation before publication:

- TypeScript and architecture checks passed (1,069 TMS files).
- Public/auth/media tests: 50 passed. Worker and release gate tests: 53 passed.
- Browser: all six videos were paused until Play; metadata matched dimensions/durations; captions loaded and toggled; seeking and fullscreen passed; covers disappeared after playback.
- Layouts at 768, 390 and 320 px had no horizontal overflow. Desktop and mobile screenshots inspected. Reduced motion checked. No page errors or failed media responses.
- Existing accepted MP4 checks include full decoding and pointer/cut review; copying verified hashes, without re-encoding.

Local verification scripts, screenshots and live publication evidence are retained in `output/falcon-films-20260912/release/` outside the public assets. Production status will be recorded there after publication and response-byte verification.
