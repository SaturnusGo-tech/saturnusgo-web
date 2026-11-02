# Falcon Shell Implementation Plan

> For agentic workers: execute independent presentation tasks concurrently, then one integrated review.

**Goal:** Reproduce supplied shell/settings reference in functioning Falcon.
**Architecture:** Existing Next/React presentation, CSS modules, official OpenAI icons; maintain data/auth contracts.
**Tech Stack:** React18, Next14, TypeScript, CSS modules.
**Spec:** docs/superpowers/specs/2026-11-02-falcon-shell-design.md

## Global Constraints
- Existing isolated worktree; no backend changes or production publish.
- <=200lines/code file; <=2code files/directory.
- Preserve capabilities, routes, theme/locale preferences and operational controls.

## Review Focus
- Hover pointer bridge, Escape and no focus theft.
- No-project and restricted-user menu access.
- Settings deep links/back and import/export availability.
- Compact viewports and long labels.
- Run timer/build downloads remain accessible.

### Task 1 Navigation/account
- [x] Existing model/core/pin regression tests and focused hover/focus tests.
- [x] Implement 52px core rail, ellipsis and avatar menus with capability preservation.
- [x] Run relevant navigation tests: 49 passed before the app restart.

### Task 2 Settings
- [x] Add local search/fallback behavior tests.
- [x] Implement sidebar and wide left-aligned sections, embed exchange and preserve personal settings.
- [x] Apply the user's follow-up: replace card-heavy interiors with flat related rows, separators and compact controls; preserve accepted settings navigation.
- [x] Run project settings and notification tests: 20 and 36 passed respectively before the app restart.

### Task 3 Shell/header
- [x] Retain environment routing and run operational controls with focused tests, including empty filtered run results.
- [x] Remove floating geometry; implement shared neutral surfaces, 44px header and square-plus environment navigation.
- [x] Typecheck, architecture (1537 files), support (5), run builds (26) and scenario (10) checks passed before the app restart.
- [x] Production export build completed with exit 0 in the separate build-candidate directory; 67 static pages generated and the TMS route artifact confirmed. It follows `scripts/deploy_pages.sh` by temporarily staging `app/api` outside the candidate and restoring it afterward. A raw export attempt compiled and typechecked but rejected the existing dynamic `/api/home-map-tile/[z]/[x]/[y]` route, which is why the established Pages staging step is required. Existing unrelated methodology CSS/autoprefixer warning remains.

### Task 4 Review
- [x] Capture first-pass desktop/narrow and menu settings states.
- [x] Run one detector over changed targets and independent source review. Source review found no remaining important regressions after fixes. Four layout-transition warnings remain in navigation/legacy shell styles.
- [x] Capture revised flat settings interiors and confirm settled expanded-navigation readability. First-pass image 10 captured an intermediate collapse animation and is not acceptance evidence. Final expanded width is 240px, label opacity 1 and text color #f5f5f5.
- [x] Complete fresh visual review: twelve settled desktop/mobile/menu captures passed independent review with no material defect. The environment search focus outline is an optional cosmetic P3; no further scope expansion.
- [x] Repeat architecture, TypeScript and 136 navigation/project-settings/notifications/support/run-build tests after restart; all passed. Browser error log was empty at final capture. Local preview remains available on port 4572.

## Handoff after app restart

Implementation is saved on `codex/falcon-chatgpt-shell-20261102`. Production deployment, push and merge have not been performed. Final captures are in `output/falcon-shell-20261102/screenshots/v2-*.jpg` in the parent workspace. The preview uses synthetic read-only data, so save/sign-out operations cannot be accepted as end-to-end production verification. Desktop 1440×900 and phone 390×844 were inspected; viewport override was reset afterward. This is visual consistency verification, not a claim of pixel-for-pixel identity or full production QA.

## Local review follow-up

- [x] Increase main navigation spacing, mute inactive controls, retain bright hover/focus/active states.
- [x] Use green Active and amber Archived project-status dots while retaining text labels.
- [x] Replace native Theme/Language selects with compact custom comboboxes, official icons, a 12px chevron inset, selected checks and reduced-motion-aware popup transitions.
- [x] Verify TypeScript, architecture (1539 files) and 108 navigation/project-settings/notifications/dropdown tests. Browser checks confirm 8px collapsed-rail gaps and grey/bright states, green Active dot, custom list rendering, Escape cancellation and keyboard selection without focus loss.
- [x] Confirm the custom menu on desktop and geometry at 390×844: menu stays within x=252–372, document has no horizontal overflow, outside dismissal works and the browser error log is empty. Reset emulation after checking. The mobile screenshot API produced an invalid scaled capture; do not use `v3-appearance-mobile.jpg` as visual evidence. The desktop dropdown capture is valid.
- [x] Restart preview and synthetic API as detached processes after the app restart; confirm HTTP 200. No production publication.
