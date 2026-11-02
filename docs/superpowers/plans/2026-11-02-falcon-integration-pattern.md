# Integration directory: reference composition

## Requested correction

Use the native Codex plugin-directory screenshots supplied by the user on 2026-11-02 as the composition reference. Preserve Falcon's actual integrations, permissions, localization and configuration routes. The previous directory's secondary panel, category duplication, full-width rows and oversized unframed marks did not reproduce the intended interaction pattern.

## Implemented

- 240px secondary sidebar: Customize, Integrations, the existing API/contracts destination and connected services. No duplicated category/status directory.
- Center a 900px inner catalog in the remaining workspace, with 30px gutters. Measured at a 1440px viewport with the collapsed global rail: title x416, sidebar240, service row70px. Preserve the approved global navigation behavior.
- One heading/search/action row: search, refresh, catalog options, Connect. Connect reuses existing service setup actions and excludes connected/planned entries.
- Two primary status tabs, All services and Connected. Categories and the remaining status filters, reset, guide and theme are available in the options popover.
- Native neutral surfaces, 24px heading, 16px service names, 14px descriptions, 36px logo tiles with26px brand glyphs, restrained row/category spacing. Shorten catalog descriptions to factual one-line summaries without adding capabilities.
- Existing popup positioning, outside dismissal, Escape/focus return and keyboard navigation; mobile viewport clamping and single-column rows.

## Verification

- [x] TypeScript and architecture:1555 files pass.
- [x] Eleven scoped catalog, permission and navigation regressions pass, including option filtering, action availability, API destination and Escape.
- [x] Browser inspection at1440px and390px: correct desktop geometry, no document horizontal overflow, mobile popover inside the viewport, search/reset/filter/connect chooser functioning, clear console.
- [x] Review the actual Chrome render and preserve its unmodified screenshot in the parent workspace output directory. The in-app browser exposed DOM inspection but screenshot capture was unavailable, so visual confirmation used a separate Chrome tab without changing the user's original tab.
- [x] No new providers, backend changes or production publication.
