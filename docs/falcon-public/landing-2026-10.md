# Falcon October 2026 public landing

Primary source: Figma HCaejW69rMgmmQYiVBsJ5p, frame 30:2822 (1440 × 5217). MCP quota prevented full extraction; the user approved manual UI inspection and export. Typography was inspected directly: Geist Medium, hero 78px / 108% / -3%, section headings 52px / 108% / -3%, footer Geist Semibold 326px / 100% / -6%. Base colors: #101010, #161616, #F1F0EA, #999A95.

Product illustration panels are unchanged PNG exports of those exact Figma nodes. The hero uses separate original exports for the velvet background and transparent product preview; the background fills the viewport independently of the 1440px content limit. The preview keeps its original 1136px interface width and complete shadow bounds (1256 × 830 at 1×), exported without the parent frame clipping its bottom. Its URL includes the export hash to invalidate cached cropped previews. The preview sits 14px higher than the original composition at desktop scale, with 20px of breathing room above and below the interface. All surrounding headings, navigation, controls, marquee and forms are HTML/CSS. The full-frame screenshot is a comparison reference only, not the website.

| Asset | Figma node | SHA-256 |
| --- | --- | --- |
| `hero-velvet.png` | `30:4003` | `d56f7bb8415b782fb0b48ab5de0a7f70feb370721e3203611ee510e35bf7430a` |
| `hero-preview.png` | `30:2856` | `9a4c27ddb1aeca975e1f126399add3eb19cb578facb034eb633000bad6e0582f` |
| `repository-stage.png` | `30:3342` | `052982ad9ad8867bab4c328c24eb3bd6de6903481938ab521843f1637054e466` |
| `run-stage.png` | `30:3515` | `4257f71ce5cdd8c82caeff2c0a3ccbfca25d329b07b3b7409022c2dcb76e66d8` |
| `ai-stage.png` | `30:3900` | `ee49dc4f615b69404070411653c7d285977513869176f7672f9fdae9d4838924` |

## Navigation and intake

The main page is `/`; `?view=workflow` opens the preserved video landing. See the workflow / Get back use viewport View Transitions with a reduced-motion fallback. Book a demo returns to `/#book-demo`; the main page stays mounted so form drafts survive switching views. Two integration tracks split the complete canonical catalog into balanced, non-overlapping rows (currently six and five services), loop in opposite directions and can be paused; reduced motion disables them. The closing release CTA repeats See the workflow next to Book a demo. Meet Falcon AI switches to the video landing, then smoothly scrolls to `?view=workflow#cases-video`; direct links and browser history restore that destination. Both public headers expose the language selector and omit company login actions; the workflow footer also omits company entry. Section eyebrows have no numeric prefixes. The direction footer has no duplicate language selector; language switching stays in the header. The demo consent privacy link remains underlined despite the landing link reset.

`/privacy/?lang=ru|en|es|pt` contains the Falcon-specific policy. Only Russian uses Меркурий Рукс; other versions use Mercury Rucks.

The form POSTs to `/api/falcon-demo/request`. The TMS Worker restricts the origin, method, JSON content and body size, then HMACs the Cloudflare client IP and forwards the request to the isolated backend `/v1/public/falcon-demo/request`. Both sides require the dedicated FALCON_DEMO_API_KEY, never a browser-visible variable. Backend configuration, retention and owner-only notification are documented in sieger-assistente/docs/falcon-demo.md. The form only reports success after a valid backend response.

## Release

Run typecheck, test:tms-auth, test:tms-worker, architecture:tms and demo component/transport tests. Deploy reviewed source via scripts/deploy_pages.sh, then scripts/deploy_tms_worker.sh so company-domain bindings are retained. Verify privacy route, four product images, old videos and live demo intake on production.
