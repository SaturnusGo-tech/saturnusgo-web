# Shared Falcon documentation reader

## Confirmed scope

Use the supplied Linear Docs screenshots as the composition reference: a compact collapsed folder tree, article icons, a visual home directory, quiet article typography, a right outline and a search dialog. Public and signed-in documentation must share one reader and article presentation. Keep Falcon branding, existing articles, localization and authenticated AI behavior.

Public pages use the existing public article allowlist and reviewed synthetic product images. Company walkthrough images and account content stay within the signed-in catalog. The public Falcon AI action opens sign-in and continues to the authenticated chat; reading public articles must not call the AI service.

## Implementation

1. Extract shared folder/icon/image metadata, Home, article sections and block presentation without importing an authenticated catalog.
2. Build the shared reader shell, collapsed nested navigation, modal search, theme controls, copy action, outline and Falcon AI pill.
3. Adapt public URL navigation and existing authenticated documentation navigation to the same reader. Preserve chat state and per-company article access.
4. Run focused article/navigation/privacy tests, TypeScript and architecture checks. Perform one bounded visual inspection; the user owns full UI acceptance testing.
5. Obtain independent review, record the scoped design contract and publish the committed build through the existing Pages and Worker release flow.

## Acceptance

- Both entry points render the same menu, home and article components.
- Folders and subfolders start collapsed and animate without exposing hidden keyboard targets.
- Public screenshots contain demonstration data; no company-specific walkthrough is added to the public catalog.
- Search, locale switches, deep links and article changes retain the correct host context.
- Public AI requires authentication; signed-in chat retains existing history and routing.

## Completed verification and design review — November 4, 2026

- Focused guide/AI verification passed all 120 tests. The full TypeScript check and architecture checks passed. Final focused verification passed 22 tests.
- Independent regression review reported no actionable issues. The independent Impeccable finish review returned **SHIP**, validated all six named captures and requested no material fixes. Its report is `/tmp/falcon-docs-finish-review.md`.
- Reviewed captures are `public-home.jpg`, `public-article.jpg`, `public-article-expanded.jpg`, `public-search.jpg`, `authenticated-article.jpg` and `authenticated-mobile.jpg` in `output/falcon-docs-redesign-20261104`. They cover the home, article, expanded folders, modal search and both reader hosts. The 1728px captures show a shorter visible page surface; the mobile capture predates the already-evidenced anchor-color fix. The finish reviewer found no unresolved layout issue from those limits.
- The detector ran once. Font, radius, type-ramp and alpha-black shadow findings were evaluated against the root marketing system and accepted as intentional for the scoped reader. Only the existing self-hosted documentation font value was narrowly suppressed with `design-system-font` / `falcon public docs` in `.impeccable/config.json`; there is no global rule or file suppression.
- The scoped contract now includes an as-built record derived from the shared shell, reading styles and pure presentation/model modules. Marketing `DESIGN.md` and `.impeccable/design.json` were left unchanged. No unrelated drift or detector finding was promoted into design-system guidance.

The owner retains full UI acceptance testing. This review record does not assert a deployment; release evidence is recorded separately when the existing Pages and Worker flow completes.
