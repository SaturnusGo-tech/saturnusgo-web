# Falcon color system

All Falcon UI consumes the same light and dark semantic roles. The roles are declared in `app/src/modules/core-tms/presentation/theme/falcon-theme.css`; `reference/chatgpt-colors.json` records the exact values and their source names.

## Reference and provenance

The reference is the computed CSS of the live ChatGPT desktop web interface on 2026-11-02, inspected in Light and System/Dark appearance. The original System preference was restored. This is a dated reference capture, not a claim that ChatGPT publishes an immutable universal palette: its appearance can vary by release, surface and user theme.

[OpenAI's UI guidelines](https://developers.openai.com/plugins/concepts/ui-guidelines#design-system) identify CSS-variable design tokens and the Apps SDK UI library as the foundation for interfaces matching ChatGPT. Falcon already uses that library for icons. No new dependency or runtime connection to ChatGPT was introduced.

| Role | Light | Dark |
| --- | --- | --- |
| Main canvas / sidebar | `#fcfcfc` | `#0e0e0e` |
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

- `surface`, `sidebar`, `panel`, `elevated`, `control`, `hover`, `selected`: neutral interface surfaces. A selection is not a primary action; its text uses `text`, not `on-action`.
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

Integration logos, user avatars, screenshots, recorded evidence, authored illustrations and videos are content. Theme changes do not recolor those assets. Rich Markdown highlight swatches preserve the existing authored content colors. Their five exact CSS exceptions and four integration-brand declarations are listed with reasons in `scripts/falcon-theme-exceptions.json`. Marker RGB channels encode saved content and remain paired with the existing highlight semantics. Neutral menu chrome around them uses the shared roles.

Decorative empty-state rasters in case selection, first-project onboarding, empty dashboards and the employee directory are replaced by small existing library icons. Their foreground follows the theme; they do not require a separate light/dark bitmap or a saturation/brightness filter.

## Verification and maintenance

Run `npm run test:tms-theme` for the captured role contract, contrast checks, route/portal scoping and the global stylesheet guard. The guard scans every Falcon stylesheet, rejects new literal UI colors and missing role definitions, and rejects unused exception entries. Keep content exceptions precise: file + selector + property + exact value + reason.

For an intentional future palette update, recapture both reference themes, update the source mapping and foundation together, and review the light/dark browser matrix. Component CSS must not create a new local palette. Product behavior, layout, typography, animation and authorization are unchanged; only the four decorative empty-state artwork footprints become compact icons.

## Migration verification — 2026-11-02

- 221 Falcon stylesheets pass the literal-color, missing-role, inverse-action-foreground and malformed-shadow guard; 73 roles and nine precise content/brand exceptions.
- Captured role completeness, Falcon-only document/portal scope and AA neutral/solid-action contrast tests pass. Full TypeScript and architecture (1607 files) pass.
- Relevant operational regression, documentation/popup/dashboard/API, public/auth/admin, navigation and plugin-manager tests pass.
- Browser checks cover both desktop themes: repository/case detail, suite catalog/create, runs, settings/menu, integrations, documentation and AI. Dark suite catalog fits 390px without horizontal document overflow. The dark theme dropdown resolves to `#212121` with `#ededed` text, while the main canvas resolves to `#0e0e0e`.
- The Impeccable detector also reports 31 existing layout/motion/rail/background warnings in the changed files and shared global stylesheet. These describe preserved geometry, semantic scenario/quote rails and unrelated shared-page decoration; they are not a clean-detector claim or a reason to redesign those surfaces during a color migration.
- No external Auth0-hosted page was restyled; no template for that third-party page exists in this repository. No production publication performed.
