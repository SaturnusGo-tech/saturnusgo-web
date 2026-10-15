# Falcon October 2026 public landing

Primary source: Figma HCaejW69rMgmmQYiVBsJ5p, frame 30:2822 (1440 × 5217). MCP quota prevented full extraction; the user approved manual UI inspection and export. Typography was inspected directly: Geist Medium, hero 78px / 108% / -3%, section headings 52px / 108% / -3%, footer Geist Semibold 326px / 100% / -6%. Base colors: #101010, #161616, #F1F0EA, #999A95.

Product illustration panels are unchanged PNG exports of those exact Figma nodes. All surrounding headings, navigation, controls, marquee and forms are HTML/CSS. The full-frame screenshot is a comparison reference only, not the website.

| Asset | Figma node | SHA-256 |
| --- | --- | --- |
| `hero-stage.png` | `30:2843` | `c1dc9f288c958a84328661ac5ab04c54e3f579d11ae26b9959974d7856ae9ee6` |
| `repository-stage.png` | `30:3342` | `052982ad9ad8867bab4c328c24eb3bd6de6903481938ab521843f1637054e466` |
| `run-stage.png` | `30:3515` | `4257f71ce5cdd8c82caeff2c0a3ccbfca25d329b07b3b7409022c2dcb76e66d8` |
| `ai-stage.png` | `30:3900` | `ee49dc4f615b69404070411653c7d285977513869176f7672f9fdae9d4838924` |

## Navigation and intake

The main page is `/`; `?view=workflow` opens the preserved video landing. See the workflow / Get back use viewport View Transitions with a reduced-motion fallback. Book a demo returns to `/#book-demo`; the main page stays mounted so form drafts survive switching views. Two integration tracks split the complete canonical catalog into balanced, non-overlapping rows (currently six and five services), loop in opposite directions and can be paused; reduced motion disables them. The closing release CTA repeats See the workflow next to Book a demo. Meet Falcon AI switches to the video landing, then smoothly scrolls to `?view=workflow#cases-video`; direct links and browser history restore that destination. Both public headers expose the language selector and omit company login actions; the workflow footer also omits company entry. Section eyebrows have no numeric prefixes.

`/privacy/?lang=ru|en|es|pt` contains the Falcon-specific policy. Only Russian uses Меркурий Рукс; other versions use Mercury Rucks.

The form POSTs to `/api/falcon-demo/request`. The TMS Worker restricts the origin, method, JSON content and body size, then HMACs the Cloudflare client IP and forwards the request to the isolated backend `/v1/public/falcon-demo/request`. Both sides require the dedicated FALCON_DEMO_API_KEY, never a browser-visible variable. Backend configuration, retention and owner-only notification are documented in sieger-assistente/docs/falcon-demo.md. The form only reports success after a valid backend response.

## Release

Run typecheck, test:tms-auth, test:tms-worker, architecture:tms and demo component/transport tests. Deploy reviewed source via scripts/deploy_pages.sh, then scripts/deploy_tms_worker.sh so company-domain bindings are retained. Verify privacy route, four product images, old videos and live demo intake on production.
