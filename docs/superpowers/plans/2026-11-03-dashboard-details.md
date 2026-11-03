# Dashboard detail refinement implementation plan

> **For agentic workers:** execute in this existing isolated UI worktree. The user requested implementation using Suites as visual authority.

**Goal:** Make every existing release-quality drill readable and consistent with Falcon’s compact Suite listings.

**Architecture:** Preserve the analytics/workbench sources and metric calculations. Update the common DetailPage, filter toolbar, and three record templates used by the 29 catalog entries. Local preview fixtures provide representative data without production mutations.

**Tech stack:** React/TypeScript, CSS Modules, existing animated selectors, semantic Falcon tokens.

## Global constraints
- Preserve authorization, periods, server pagination, deep links, entity navigation and run-item identity.
- Keep product group/product/regression as server scopes; local facets apply only to loaded rows.
- Keep both themes, existing fonts and semantic status colors.
- Maximum 200 lines per handwritten TS/TSX file and two code files per directory.

## Tasks
- [x] Inspect real before states and map all catalog entries to shared templates.
- [x] Replace permanent product rail with a compact expandable filter area; retain error/retry/reset and catalog pagination.
- [x] Preserve the selected metric/entity when changing product scope; test explicit false, clear, and URL restoration.
- [x] Simplify detail header to a text Dashboard return link, context and compact title/count.
- [x] Apply safe compact table/group layouts, semantic status signals and full-text tooltips.
- [x] Verify search, filters, sorting, selection, pagination, deep-link navigation, loading/error/empty and long records.
- [x] Inspect desktop/narrow and light/dark together, fix confirmed issues once, then run targeted tests, TypeScript, architecture and token checks.

## Review focus
- Product scope must not unexpectedly switch Total defects into test cases.
- Long product/status/title strings must not overlap adjacent columns.
- Filter collapse must keep active restrictions visible and keyboard-safe.
- Partially loaded lists must not imply search is server-wide.
- Existing case selection and run/check navigation must retain exact IDs.
