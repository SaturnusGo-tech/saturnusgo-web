# Falcon color system

All Falcon UI consumes the same light and dark semantic roles. The roles are declared in `app/src/modules/core-tms/presentation/theme/falcon-theme.css`; `reference/chatgpt-colors.json` records the exact values and their source names.

## Reference and provenance

The original reference is the computed CSS of the live ChatGPT desktop web interface on 2026-11-02, inspected in Light and System/Dark appearance. The original System preference was restored. On 2026-11-03, the shell surfaces were refined against the user's Codex desktop screenshot: dark outer chrome `#272727`, inner navigation `#1e1e1e` and content `#181818` were sampled from that image. Light shell surfaces use the existing neutral palette in the analogous hierarchy; they are not a fresh live ChatGPT light-theme capture. Both sources are recorded in the reference JSON. These are dated references, not a claim that ChatGPT publishes an immutable universal palette: its appearance can vary by release, surface and user theme.

[OpenAI's UI guidelines](https://developers.openai.com/plugins/concepts/ui-guidelines#design-system) identify CSS-variable design tokens and the Apps SDK UI library as the foundation for interfaces matching ChatGPT. Falcon already uses that library for icons. No new dependency or runtime connection to ChatGPT was introduced.

| Role | Light | Dark |
| --- | --- | --- |
| Outer navigation / header | `#f3f3f3` | `#272727` |
| Inner navigation / repository | `#fcfcfc` | `#1e1e1e` |
| Main canvas / panel | `#ffffff` | `#181818` |
| Raised menu / dialog | `#ffffff` | `#212121` |
| Control | `#ffffff` | `#303030` |
| Primary text | `#0d0d0d` | `#ededed` |
| Secondary / readable muted text | `#5d5d5d` | `#cdcdcd` |
| Disabled text / subdued icons | `#8f8f8f` | `#afafaf` |
| Default border | `#0000001a` | `#ffffff26` |
| Primary action | `#0d0d0d` | `#ededed` |
| Text on primary action | `#ffffff` | `#0d0d0d` |
| Hover | `#0000000d` | `#ffffff1a` |
| Selection | `#f3f3f3` | `#303030` |
| Link | `#0169cc` | `#339cff` |
| Focus | `#3a83f7` | `#3a83f7` |

## Role usage

- `chrome`: the outer navigation and header share one surface, also visible behind the upper content corners.
- `sidebar`: secondary navigation, repository tree and run browser. `surface` and `panel`: working content. `elevated`, `control`, `hover`, `selected`: neutral menus and interaction states. A selection is not a primary action; its text uses `text`, not `on-action`.
- `text`, `text-secondary`, `text-muted`, `text-disabled`, `icon`, `icon-muted`: foreground hierarchy. Readable small metadata uses the captured secondary text role. Disabled text and non-text decorative icons may use the tertiary role.
- `action`, `action-hover`, `action-active`, `on-action`: primary action pairs. Avoid fixed white text: a dark theme primary action is light and needs dark ink.
- `success`, `danger`, `warning`, `caution`, `info`, `discovery`, with `-bg`, `-border`, `-solid`, `-on-solid`: functional states from the corresponding ChatGPT palette. These preserve pass/fail/blocked, expected results, shared-step provenance, HTTP outcomes and warnings. Status text/icons remain present; hue is not the only signal.
- `chart-1` through `chart-8`: chart series, not decorative button/card colors. Color is retained where it distinguishes data.
- `media-surface`, `media-text`, `media-muted`: fixed dark media/artwork regions. They protect captions over existing dark artwork and video letterboxing in either application theme.
- `mask`: opaque alpha-mask geometry, not visible UI decoration.

Semantic text uses the captured surface-foreground variants for legibility. Solid warning, caution and discovery controls use neutral dark ink from the same source palette where the source's white ink would fail AA contrast. The neutral primary button, readable body/metadata and solid-state pairs are checked automatically.

## Scope and inheritance

The stylesheet is imported only by `app/(falcon)/layout.tsx`. Its selectors use `html:has([data-falcon-shell])` and the existing `.dark` theme class. Declaring roles at that document scope also supplies body-mounted menus, tooltips, dialogs, rich-text editors and lightboxes. Falcon navigation leaving the route removes the matching scope; Umbrella Home and other SaturnusGo products retain their own themes.

Legacy names such as `--tms-*`, `--ink`, `--paper`, `--action` and `--yt-*` are compatibility aliases. Feature-level names may remain for component APIs, but resolve to Falcon roles. Glass/workspace styles do not introduce another palette.

The self-contained Cloudflare unavailable-company document has the same captured neutral role values inline because it can render before the application stylesheet is available.

## Content and explicit exceptions

Integration logos, user avatars, screenshots, recorded evidence, authored illustrations and videos are content. Theme changes do not recolor those assets. Rich Markdown highlight swatches preserve the existing authored content colors. Their five exact CSS exceptions, four integration-brand declarations and restored integration-workflow artwork paints are listed with reasons in `scripts/falcon-theme-exceptions.json`. Marker RGB channels encode saved content and remain paired with the existing highlight semantics. Neutral menu chrome around them uses the shared roles. Integration workflow previews retain their approved gradient artwork and readable dark example cards in both themes; search, settings, connection rows and menus continue to use interface tokens.

Decorative empty-state rasters in case selection, first-project onboarding, empty dashboards and the employee directory are replaced by small existing library icons. Their foreground follows the theme; they do not require a separate light/dark bitmap or a saturation/brightness filter.

## Verification and maintenance

Run `npm run test:tms-theme` for the captured role contract, contrast checks, route/portal scoping and the global stylesheet guard. The guard scans every Falcon stylesheet, rejects new literal UI colors and missing role definitions, and rejects unused exception entries. Keep content exceptions precise: file + selector + property + exact value + reason.

For an intentional future palette update, record the reference and its limits, update the source mapping and foundation together, and review the light/dark browser matrix. Component CSS must not create a new local palette. The original color migration preserved product behavior, typography and authorization; its four decorative empty-state artwork footprints became compact icons. The later shell refinement keeps the existing 16px upper content corners visible by placing the chrome surface behind them. Notifications use compact flat rows and theme-aware vector icons while retaining their existing actions.

## Migration verification — 2026-11-02

- Falcon stylesheets pass the literal-color, missing-role, inverse-action-foreground and malformed-shadow guard; 73 roles and precise content/brand exceptions.
- Captured role completeness, Falcon-only document/portal scope and AA neutral/solid-action contrast tests pass. Full TypeScript and architecture (1607 files) pass.
- Relevant operational regression, documentation/popup/dashboard/API, public/auth/admin, navigation and plugin-manager tests pass.
- Browser checks cover both desktop themes: repository/case detail, suite catalog/create, runs, settings/menu, integrations, documentation and AI. Dark suite catalog fits 390px without horizontal document overflow. The dark theme dropdown resolves to `#212121` with `#ededed` text, while the main canvas resolves to `#0e0e0e`.
- The Impeccable detector also reports 31 existing layout/motion/rail/background warnings in the changed files and shared global stylesheet. These describe preserved geometry, semantic scenario/quote rails and unrelated shared-page decoration; they are not a clean-detector claim or a reason to redesign those surfaces during a color migration.
- No external Auth0-hosted page was restyled; no template for that third-party page exists in this repository. No production publication performed.

## Shell and inbox refinement — 2026-11-03

- Header and outer navigation share `chrome`; secondary navigation and repository use `sidebar`; the content uses `surface`/`panel`. Existing upper 16px corners reveal the chrome behind them.
- Inbox rows are flat, with compact theme-aware vector icons, unread dots and wrapping titles. Existing read, archive, pagination, error/retry and settings actions remain available.
- Browser verification on the isolated local preview covers dark and light desktop surfaces, a long notification, a 390px viewport without horizontal overflow, read-all, archive-to-empty, settings navigation and opening a run from an event. Canonical event links are rebased onto the current workspace pathname so `/ui-preview/` can use the same validated links as production `/work/` without weakening the history guard.
- Theme checks pass for 237 stylesheets and 74 roles; 42 notification tests, TypeScript and the 1669-file architecture check pass. Screenshots are saved in the workspace output directory `falcon-shell-notifications-20261103`. Production has not been published for this refinement.
- During mobile checking, read-all successfully applied but closed the mobile navigation/popover. The relevant dismissal and action handlers predate this refinement; its exact trigger was not traced, and this is not a claim that mobile dismissal is fully verified.

## Default appearance and navigation reveal — 2026-11-03

- The early document bootstrap starts dark, independently of OS appearance, including when storage is blocked. Explicit saved light/dark settings survive reload. Legacy `system` and invalid stored values normalize to dark before hydration; appearance changes remain in Settings. The redundant theme toggle in the Docs/AI header is removed so it cannot bypass that settings flow.
- Fresh navigation starts as the compact icon rail. Hover and keyboard focus show a tooltip to its right without expanding it. A deliberate rightward edge drag or long-press drag enables reveal mode; leaving the navigation collapses its visible width, and reentry/focus reveals it again. A deliberate leftward drag disables that mode and restores tooltip-only hover. The existing saved sidebar preference records this deliberate mode, not each transient pointer movement.
- Profile and notifications remain independent of navigation reveal. Width changes stay in the existing flex layout, moving the content rather than covering it. The mobile header toggle and keyboard width separator remain available.
- Local browser verification covers the closed tooltip at x=62 beyond the 52px rail, rightward opening to 240px with content at x=240, pointer-leave collapse, hover reentry and leftward disabling. Automated coverage includes 61 navigation tests and four early-bootstrap cases, alongside the semantic theme contract, stylesheet guard, TypeScript and architecture checks.
- The user authorized publication of this iteration together with the preceding shell, token and notification refinements. Exact source/Pages/Worker release evidence is recorded separately in the workspace production-release output after deployment.
- Notification and account/overflow popups participate in the existing single-open rail protocol. Opening either dismisses the previous popup and cancels pending hover openings without returning focus to the bell; explicit Escape retains focus restoration. Native-browser verification confirms profile hover removes the inbox from the top layer, and reopening the inbox leaves only that popup visible. The notification suite now passes 45 tests, including native and fallback handoff cases.
