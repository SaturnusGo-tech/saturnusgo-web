# Falcon user documentation

The global Help button opens `view=help`. An article is addressable with
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
`npm run test:tms-adapters`. Check the Help entry, article links, search, light
and dark themes, and narrow-screen navigation in the running application.
The production static export must pass the normal repository workflow.

The module is loaded through `DocumentationEntry` only when Help is opened.
It uses the existing Falcon color-mode hook and shared dark surface tokens.
No additional service, CMS, credentials or package dependencies are required.

## Illustrated workflows

`content/walkthroughs/` describes numbered sequences with an instruction,
actual UI screenshot, expected outcome and descriptive alt text per step.
Capture real Falcon UI using neutral data in the isolated Falcon Guide project.
Do not generate or retouch interface controls, expose credentials, or capture
customer records. Clearly label hypothetical defects and unsaved setup forms.

Store JPEG captures under `public/falcon/docs/<edition>/`. The current edition
was captured on 8 September 2026. `media/screenshots.json` records each image's
intrinsic dimensions; `screenshotStep` restricts references to this inventory.
When replacing captures, update dimensions and provenance together. The visual
catalog tests check JPEG headers, size limits, coverage and discoverability.

Images load lazily with reserved dimensions. A native modal dialog provides
enlargement, previous/next, arrow keys and Escape; it uses the current theme.
Test keyboard focus restoration, article navigation, image loading, and narrow
screens. Capture dimensions can vary with the real browser viewport.
The `/falcon/` public prefix is included in the existing Pages export pipeline.
