# Falcon user documentation

The global Help button opens `view=help` with the introduction selected.
Documentation and Falcon AI are separate header links. The documentation view
has an article tree, search, reading column and table of contents. The AI view
has its own conversation history and composer; narrow screens expose history
through the chat header. Switching views restores the last article/section or
conversation/message/share route within the current identity and workspace.
An article is addressable with
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
- Update the visible editorial date in `localization/ui-copy.ts` after a
  substantive content review.

## Checking changes

Run `npm run typecheck`, `npm run architecture:tms`, and
`npm run test:tms-adapters`. Also run
`npx tsx --test app/src/modules/core-tms/documentation/tests/localization/*.test.ts`
for locale parity, access filtering, search and the Russian screenshot inventory. Check the Help entry, article links, search, light
and dark themes, and narrow-screen navigation in the running application.
The production static export must pass the normal repository workflow.

The module is loaded through `DocumentationEntry` only when Help is opened.
It uses the existing Falcon color-mode hook and scoped neutral documentation
tokens. Reference OpenAI Sans assets are self-hosted under
`public/falcon/docs/fonts/`, with provenance in `SOURCES.md`; they do not replace
the rest of Falcon's fonts. The main workspace stage clips its top corners to16px.
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
FALCON_BACKEND_CHECKOUT=/absolute/path/to/verified-release-backend
npx tsx scripts/documentation-ai/export.ts --output "$FALCON_BACKEND_CHECKOUT/src/documentation-assistant/infrastructure/knowledge/guide-corpus.json"
npx tsx scripts/documentation-ai/export.ts --check "$FALCON_BACKEND_CHECKOUT/src/documentation-assistant/infrastructure/knowledge/guide-corpus.json"
npx tsx --test scripts/documentation-ai/tests/*.test.ts
```

Choose the backend checkout against the active production release before exporting;
a similarly named old artifact directory is not proof of the deployed source.
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
The November refresh uses the owner's authenticated **production Umbrella Home**
account, with the current production UI. Synthetic UI previews and the previous
isolated Guide workspace are not acceptable replacement captures. Use existing
authorized records and unsaved setup forms; do not trigger invitations, OAuth
grants, external tests or destructive actions merely to obtain an illustration.
Do not generate or repaint interface controls or expose credentials, private
invitation URLs or unrelated personal data. Keep untouched original captures;
arrows belong in a separate annotation layer with its original preserved.

The guide follows Falcon's interface locale through `useDocumentationCatalog`.
English articles live in `content/`; Russian articles live in `content-ru/`.
Update both editions when behavior changes and retain stable article/section IDs.
`localization/catalog/locale-catalog.ts` selects an edition before access filtering,
lookup, navigation and search. `localization/ui-copy.ts` contains UI labels.
Do not force a guide language independently of the user's interface preference.

Capture the MacBook Pro 16 layout at a logical **1728×1117 viewport, DPR2**:
the untouched source is **3456×2234 pixels**. Verify the actual capture dimensions;
do not upscale or crop another viewport to manufacture this size. JPEG and PNG
raw captures are accepted. This layout check is not a claim of physical-device testing.

New JPEG assets live under `public/falcon/docs/2026-11/` and `2026-11-ru/`.
Each locale's `walkthroughs/media/screenshots.production.json` explicitly registers
the new source, intrinsic dimensions and stable screenshot key. `screenshotStep`
uses a registered production capture and retains the old source until that exact
step is replaced. New keys can also be registered for additional procedures.
Never copy old screenshot bytes into the new edition. Retain September assets,
the 20 historical aliases and the old Codex assets for saved AI answer links.
The importer records exact replacements in `model/visual/compatibility/production-aliases-en.json`
and `production-aliases-ru.json`. A saved answer resolves only the registered old
image ID and URL in its original locale, visible article and section. Do not add
URL wildcards or redirect unrelated screenshots to a convenient current image.
Obsolete gallery states can be removed while their procedures remain as text;
retaining an old file does not require displaying it in a current walkthrough.

From the frontend checkout, import an actual capture after inspecting it:

```bash
npx tsx scripts/documentation-captures/import.ts --locale en --ui-locale en --content-language en --key navigation-01-workspace-20260928-inbox20260928-en-20260928 --raw /absolute/path/to/raw-capture.jpg --origin https://umbrella-falcon.saturnusgo.com --source-url 'https://umbrella-falcon.saturnusgo.com/testcases/umbrella-home/work/?view=cases' --release-sha 38c7171d380d7a08339e66628e6503cf195e520c --captured-at 2026-11-03T12:00:00Z
npx tsx scripts/documentation-captures/verify.ts
npx tsx scripts/documentation-captures/verify.ts --complete
```

Use the actual stable key, capture timestamp, full release commit, company origin
and exact source-state URL (including resource selectors). Sensitive query fields
such as OAuth state, codes or tokens are removed before public provenance is saved;
their values must never be written into guide assets or examples.
For an actual Codex host screenshot add `--surface codex --origin codex://desktop`
(or `https://chatgpt.com` for its web UI). The importer never captures the screen:
it transcodes an existing source without resize/crop and records SHA-256, language
and the safe source-state URL. For a reviewed replacement, use `--replace-existing`
and a fresh date-versioned filename; previous files and exact aliases are retained.
Mixed content requires `--content-language mixed` and an explicit
`--language-exception` reason. It must not be reported as strict language coverage.
The normal verifier checks registered captures; **`--complete` is the final refresh
gate** and fails while any active EN/RU illustration still uses an old source.
It checks provenance, locale, intrinsic size, digest, legacy reuse and budgets.
The DPR2 budget is 1.4 MB per image and 32 MB per locale; legacy limits remain
350 KB per image and 8 MB for English. Images remain lazy-loaded.

Frame company administration controls without unrelated personal administrator
records. Distinguish Swagger configuration previews and unavailable services from
an actually connected API and successfully completed request.
`media/screenshots.json` retains the legacy dimensions; the production inventory
and `production-provenance.json` record the new captures. Do not alter provenance
to claim a synthetic or resized illustration is an authenticated production image.
When replacing captures, update dimensions and provenance together. The visual
catalog tests check JPEG headers, size limits, coverage and discoverability.

Images load lazily with reserved dimensions. A native modal dialog provides
enlargement, previous/next, arrow keys and Escape; it uses the current theme.
Test keyboard focus restoration, article navigation, image loading, and narrow
screens. Retained legacy images keep their original dimensions.
The `/falcon/` public prefix is included in the existing Pages export pipeline.

The `company-access` article is admin-only. `useDocumentationCatalog` filters
the catalog before direct lookup, navigation, search and related links.
Falcon AI and colored markers are separate articles.
