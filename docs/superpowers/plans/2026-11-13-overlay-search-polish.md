# Overlay and search cleanup implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development for the independent frontend slices.

**Goal:** Stabilize documentation overlays and bring search, run selection and supporting layouts into Falcon's existing UI.
**Architecture:** Fix presentation owners only; preserve server authorization, lifecycle versions and query semantics. Keep HeroUI/React Aria focus and positioning, give entrance opacity one owner, keep async confirmation content geometrically stable.
**Tech Stack:** React, CSS Modules, HeroUI, Framer Motion, existing Node/tsx tests.
**Spec:** Owner request and seven screenshots in the current chat, November13.

## Global constraints
- At most200 physical lines per handwritten TS/TSX; at most2codefiles per directory.
- Existing Falcon tokens, neutral rounded fields, localized English/Russian, keyboard/reduced-motion behavior.
- No new backend rules or transport changes. Production publication already authorized.

## Review focus
- Async metadata must not resize confirmation or enable a stale/forbidden action.
- Restore/Delete require confirmation; cancellation performs no write.
- Menus must not reset opacity mid-entry or change anchor geometry.
- Taxonomy content must fit both viewport edges and its scroll region.
- Cmd/Ctrl+L applies only to focused resource search and preserves existing QL capabilities.

## Tasks
- [x] Documentation: repair taxonomy geometry; inset property hover; full-pane empty state; menu-only Restore with confirmation and fresh version checks.
- [x] Shared overlays: characterize opening frames; replace restarting Motion entry with CSS opacity; retain named exit callbacks, portal and focus APIs. Verify focused facade tests and actual frame samples.
- [x] Run creation: use inline repository case rows/priority; reuse current filters; remove square inner input focus. Keep suite membership server-owned.
- [x] Supporting layout: full-width Shared Steps; collapse hidden Codex action space.
- [x] Global QL: four known launch implementations move into localized search with keyboard hint. Preserve query/close/filter behavior. Test keyboard scope.
- [x] Verify: architecture, typecheck, relevant suites, actual component harness both themes, responsive bounds, menu/confirmation frames. Review combined diff.
- [x] Commit/push source; one canonical Pages build and publish; wait exact deployment; inspect live menus/query/run layout; record receipt.

## Verification evidence
- Typecheck and architecture checks passed (2,714 files).
- Focused interface suite: 79 tests passed; Product Docs: 184 passed.
- Actual-component browser checks: English/Russian, both themes; menu entry opacity is monotonic, confirmation geometry stays constant across delayed metadata, Android inner input has no outline or shadow.
- Confirmed a second Escape closes QL after suggestions; inline hint is also clickable.
- Repository filter portal now belongs to the dialog and respects viewport height. Normal pointer opening does not scroll the underlying content.
- Independent lifecycle/overlay review: no actionable findings.
- Existing lint script only prints “lint skipped”; no lint-pass claim.
- Evidence outside source: falcon-overlay-search-20261113, including menu-frames.json and confirmation-frames.json.

## Production result
Source `36d7df17d550b8a6d5614664d4712a7dd31dce3d` published in Pages commit `997778b6a7641fe9c62d0746e0aaa70074ee7c6f`; deployment [43363262315](https://github.com/SaturnusGo-tech/saturnusgo-web.github.io/actions/runs/43363262315) completed successfully.

Live browser checks passed for Product group, archive actions, confirmation/cancellation, Starred centering, run case rows/priority, Cmd+L QL, and current run filters. Production menu frame samples increased from opacity0 to1 monotonically with fixed195×82geometry. No business data was changed. Native macOS/Windows were not separately exercised.
