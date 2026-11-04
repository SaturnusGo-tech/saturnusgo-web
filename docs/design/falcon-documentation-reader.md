# Falcon documentation reader

## Scope and authority

Read mode. The user supplied five Linear Docs screenshots on November 4, 2026 and requested their composition for Falcon, including public and authenticated reading through one component. Existing marketing `DESIGN.md` and `.impeccable/design.json` are outside this surface's write boundary. This is a code-led implementation of the supplied reference, with no generated approval comp.

## Direction contract

FIRST VIEWPORT: a compact 280px documentation sidebar with all folders collapsed, a 64px utility header, an article or home directory, and a quiet right outline. The home introduces Falcon Docs and four popular articles using meaningful icons. Article pages lead with a title, short description and approved demonstration screenshot. Falcon's line logo identifies the reader. The application may surround it with its existing chrome, but must not recolor the documentation.

Signature interaction: nested folder disclosure expands downward and collapses upward through grid rows and opacity; 240–280ms exponential ease-out. Hidden links are inert. Reduced motion removes transitions. Search uses a focused native dialog with keyboard navigation and Escape dismissal.

QUALITY BAR: compact familiar wayfinding; readable quiet prose; article-specific icons; identical typography, colors and component behavior before and after sign-in; no legacy numbered bubbles or bulky steps. Images must resolve and show approved demo data publicly. Private walkthroughs remain authenticated. Ordinary reading never invokes AI. The Falcon AI pill signs public readers in before opening the existing authenticated chat.

## Tokens and composition

Dark: background `#090a0b`, raised `#111214`, hover `#18191c`, primary text `#f1f1f3`, body `#b7b8be`, muted `#96979f`, line `#25262a`.

Light: background `#ffffff`, raised `#f8f8f9`, hover `#f0f0f2`, primary `#1d1e22`, body `#52535c`, muted `#666873`, line `#e7e7eb`.

Existing self-hosted OpenAI Sans assets supply the docs face. Article H1 is 36px, lead 17px, prose 16px with 1.75 line height. Article measure is at most 746px; home directory at most 1040px. The right outline is 172px and disappears when space is limited. Below 760px the navigation becomes a drawer and article content fills the width. The embedded reader uses the same classes within the Falcon stage.

## Implementation and boundaries

`DocumentationReader` is the shared public/authenticated shell. `DocumentationHome`, `DocumentationArticleContent` and `DocumentationBlocks` supply shared reading presentation. Caller-provided catalog and navigation adapters preserve allowlists, company context and article URLs. Public hero media use the reviewed synthetic landing assets. No private Umbrella walkthrough is added to the public bundle.

## Verification record

Focused guide/AI tests: 120 passed. Full TypeScript check and architecture checks passed. A separate regression reviewer reported no actionable findings. Captures live in `output/falcon-docs-redesign-20261104` beside the frontend worktree's parent project. The user retains full UI acceptance testing. Final design review and release evidence are recorded in the implementation plan.

## As-built record — November 4, 2026

This record describes the shared reader stylesheet and the shared article, home, block and library modules. It extends this documentation surface only; it does not refresh the marketing system.

### Typography

The self-hosted OpenAI Sans face is reused at weights 400, 500 and 600. The article hierarchy is H1 36px/1.2, H2 23px/1.35, lead 17px/1.7 and prose 16px/1.75. At a reader container width of 680px or less, H1 becomes 30px/1.25 and H2 becomes 21px. Folder labels use 13px, nested labels and article links 12px. Inline and block code retain the existing Geist Mono stack.

### Layout

The 746px limit is the article column, including the article's desktop 48px horizontal insets. Container queries reduce those insets to 32px, 24px and 18px as space narrows. The sidebar narrows to 250px below the 1000px viewport breakpoint; the drawer starts below 760px with a 60px header. Embedded reading scrolls inside the application stage. The outline yields to collapsible article contents when the reader is narrow. Home cards reflow from four columns to two, then one on the smallest reader containers.

### Elevation & Depth

Articles, navigation and home cards are flat at rest, separated by thin rules and the recorded neutral tones. The floating AI pill uses `0 4px 16px #00000026`; the search dialog uses `0 20px 70px #00000055` over a dark backdrop. These are local utility elevations, not a new card-shadow vocabulary.

### Shapes

Navigation rows use compact 5px corners. Article images, callouts, code blocks and home cards reuse 8px corners; search uses 12px corners. The Falcon AI action keeps its pill silhouette. Semantic SVG icons identify articles and utility actions.

### Components

**The Shared Reader Rule.** Public and authenticated adapters use the same reader shell and reading presentation; authorization, article catalogs and navigation remain caller-owned. The library metadata only groups supplied articles and selects reviewed synthetic landing media.

**The Quiet Reading Rule.** Keep the title–lead–image–prose rhythm, ordinary ordered lists and thin outline. Folder panels begin closed, make hidden descendants inert, and use the recorded disclosure motion. Search is a native modal dialog with focus restoration, arrow-key selection, Enter navigation and Escape dismissal. Theme choice is shared through `falcon-docs-theme`; copy feedback is local and does not invoke AI.

### Do's and Don'ts

- **Do** preserve the reader's typography and neutral theme inside the surrounding authenticated application chrome.
- **Do** use the shared metadata and caller's authorized catalog for home cards, article icons, folders and links.
- **Don't** add production walkthrough images to the shared public hero-image mapping or trigger AI while reading.
- **Don't** promote this reader's density, corners or utility shadows into the marketing `DESIGN.md` or sidecar.
