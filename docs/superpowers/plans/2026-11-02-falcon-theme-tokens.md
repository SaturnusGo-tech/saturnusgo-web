# Falcon theme tokens implementation plan

**Goal:** One coherent ChatGPT-derived light/dark color system across the complete Falcon product, preserving layout, typography and behavior.

**Architecture:** A Falcon-scoped semantic color contract on `html:has([data-falcon-shell])` supplies both application descendants and body portals. Existing feature tokens become aliases to that contract. Component declarations consume roles instead of maintaining independent palettes. No runtime dependency on ChatGPT or network-loaded styles.

**Evidence:** CSS custom properties read from the live ChatGPT settings UI in light and system-dark modes on 2026-11-02; complete captures are local in `output/falcon-theme-20261102/chatgpt-tokens-*.json`. The official OpenAI Apps SDK UI documentation identifies CSS-variable tokens as the supported design foundation. Colors depend on the current ChatGPT appearance/build; provenance and the exact selected mapping will be recorded in `docs/design/falcon-color-system.md`.

## Constraints

- Falcon workspace, public pages, login/password screens, company administration and sandbox are in scope. Umbrella Home and other SaturnusGo products are outside scope.
- Preserve authorization, server authority, API contracts, result meaning, navigation, motion, dimensions and typography.
- Primary actions use neutral foreground/background inversion. Functional statuses and charts may use the corresponding ChatGPT semantic palette; decorative blue/purple surfaces are removed.
- Preserve integration logos, user-selected content/highlight colors, evidence screenshots, images and videos as content. Decorative empty-state artwork may be replaced by a small existing library icon with helpful copy.
- No new dependencies; handwritten TS/TSX stays within 200 lines/file and 2 code files/directory.
- No production deployment in this iteration.

## Work

- [x] Capture both reference palettes and persist the selected source-to-role mapping.
- [x] Establish `presentation/theme/falcon-theme.css`, shared compatibility aliases and scoped portal inheritance. Remove competing legacy/glass/shell literals.
- [x] Migrate repository, case detail, run execution/preparation, suites, shared steps, folders and defect flows.
- [x] Migrate documentation/AI, integration catalog/setup, settings, notifications, navigation, dashboards, portfolios and support.
- [x] Migrate login/password/company admin/sandbox and Falcon public pages, retaining content imagery.
- [x] Check all Falcon stylesheet and inline-color sites; document explicit content/branding exceptions and add a guard against new literal UI colors.
- [x] Verify targeted behavior tests, full TypeScript, architecture and scoped CSS checks. Inspect a bounded desktop/light/dark/narrow browser matrix, including body portals, controls, statuses, errors/empty states and long data; correct the batch once and confirm.

## Review focus

- Neutral primary buttons must preserve readable inverse text in both themes, including hover/disabled/loading.
- Menus/dialogs rendered under body must inherit the same tokens as their triggering screen.
- Pass/fail/blocked and shared-step/expected-result distinctions remain understandable without depending only on hue.
- No feature-local dark override may restore an old palette or an opaque background inside a composite search field.
- Navigating to another SaturnusGo product must not inherit Falcon's color contract.
