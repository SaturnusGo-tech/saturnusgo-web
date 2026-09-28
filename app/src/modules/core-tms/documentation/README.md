# Falcon user documentation

The global Help button opens `view=help` with Falcon AI chat selected. The first
navigation item below guide search returns to the chat; articles remain in the
tree. An article is addressable with
`article=<id>` and an optional section hash. Links retain workspace/project
scope and remove selectors belonging to other screens.

## Editing content

- Add or update a typed `DocArticle` in the relevant `content/` directory.
- Register new articles in `content/catalog.ts`; its order controls the tree
  and previous/next links.
- Use stable, unique article and section IDs. Cross-links refer to article IDs.
- Use the block helpers in `model/article.ts` for paragraphs, steps, tables,
  callouts, code examples and related articles. Inline text supports bold and
  code spans; raw HTML is not rendered.
- Describe the controls and outcomes actually implemented in Falcon. Keep
  provider-side setup aligned with official documentation and add source links.
- Keep examples generic; do not include account credentials, real tokens,
  customer data or temporary QA endpoints.
- Mark unavailable connectors as `planned`. The catalog test compares their
  availability with the application’s integration definitions.
- Update the visible editorial date in `DocumentationArticle.tsx` after a
  substantive content review.

## Checking changes

Run `npm run typecheck`, `npm run architecture:tms`, and
`npm run test:tms-adapters`. Also run
`npx tsx --test app/src/modules/core-tms/documentation/tests/localization/*.test.ts`
for locale parity, access filtering, search and the Russian screenshot inventory. Check the Help entry, article links, search, light
and dark themes, and narrow-screen navigation in the running application.
The production static export must pass the normal repository workflow.

The module is loaded through `DocumentationEntry` only when Help is opened.
It uses the existing Falcon color-mode hook and shared dark surface tokens.
Articles and screenshots remain available without an AI response. Chat uses the
authenticated documentation-assistant API and its configured server-side model.
No provider credentials belong in frontend code or the documentation corpus.

## Falcon AI chat and server knowledge

The guide chat explains documented Falcon procedures and links to source articles
and sections. It has no tools that create or change projects, cases, runs, builds,
or settings. Conversations are saved on the server for their account and workspace;
History reopens them, and New chat starts a blank draft without deleting older chats.
Opening articles or changing the interface language preserves saved conversations.
Each conversation retains its original text and illustration locale. Shared answer
links expose one completed exchange to authorized workspace members and can be
revoked. Dictation inserts editable text into the composer; sending remains explicit.
See `docs/features/falcon-guide-ai.md` for persistence, access and lifecycle details.

Both typed article catalogs are the authoritative knowledge source. The server
ships a generated, versioned JSON corpus rather than accepting guide content or
article permissions from a chat request. It applies locale and authenticated
workspace-administrator visibility before retrieval and generation. A content
export preserves `adminOnly` and `planned` flags; it never turns planned features
into available capabilities. Every section retains its stable source ID.

After editing either edition, export the corpus to the backend checkout:

```bash
npx tsx scripts/documentation-ai/export.ts --output ../.tms-run-builds-backend/src/documentation-assistant/infrastructure/knowledge/guide-corpus.json
npx tsx scripts/documentation-ai/export.ts --check ../.tms-run-builds-backend/src/documentation-assistant/infrastructure/knowledge/guide-corpus.json
npx tsx --test scripts/documentation-ai/tests/*.test.ts
```

The path is explicit so a release checkout can target its corresponding backend.
`--check` fails on missing or stale content without rewriting it. The version is
the SHA-256 of canonical article JSON; ordering and output do not depend on the
clock or filesystem enumeration. Export includes every paragraph, list, step,
callout, table, code example, article reference and walkthrough instruction,
expected result and screenshot alt text. It does not copy image files or extract
screenshots with OCR. Never put credentials or customer data in article examples.
Regenerate and verify the server corpus in the same release as guide changes.

## Illustrated workflows

`content/walkthroughs/` describes numbered sequences with an instruction,
actual UI screenshot, expected outcome and descriptive alt text per step.
Capture real Falcon UI using neutral data in the isolated Falcon Guide project
or a disposable guide workspace for workspace-level features.
Do not generate or retouch interface controls, expose credentials, or capture
customer records. Clearly label hypothetical defects and unsaved setup forms.

The guide follows Falcon's interface locale through `useDocumentationCatalog`.
English articles live in `content/`; Russian articles live in `content-ru/`.
Update both editions when behavior changes and retain stable article/section IDs.
`localization/catalog/locale-catalog.ts` selects an edition before access filtering,
lookup, navigation and search. `localization/ui-copy.ts` contains UI labels.
Do not force a guide language independently of the user's interface preference.

Store JPEG captures under `public/falcon/docs/<edition>/`. English captures use
`2026-09/`; Russian captures use `2026-09-ru/`. Each edition has its own walkthrough
references and inventory. Preserve both editions when updating screenshots.
Company administration is documented in text without screenshots containing
personal administrator information. Swagger illustrations show configuration
previews; the AI guide distinguishes unavailable demo service from successful flow.
`media/screenshots.json` records actual intrinsic dimensions for every image;
`screenshotStep` restricts references to this inventory.
When replacing captures, update dimensions and provenance together. The visual
catalog tests check JPEG headers, size limits, coverage and discoverability.

Images load lazily with reserved dimensions. A native modal dialog provides
enlargement, previous/next, arrow keys and Escape; it uses the current theme.
Test keyboard focus restoration, article navigation, image loading, and narrow
screens. Capture dimensions can vary with the real browser viewport.
The `/falcon/` public prefix is included in the existing Pages export pipeline.

The `company-access` article is admin-only. `useDocumentationCatalog` filters
the catalog before direct lookup, navigation, search and related links.
Falcon AI and colored markers are separate articles.
