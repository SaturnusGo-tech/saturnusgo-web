# Release retention and desktop navigation implementation plan

> **For agentic workers:** use subagent-driven-development for the independent scopes below.

**Goal:** Bound installer storage growth, preserve desktop navigation, and make documentation case selection readable and calm.

**Architecture:** Keep retention in release tooling, legal navigation at the existing desktop/public navigation boundary, and selection loading/layout in the existing documentation picker. Preserve backend rules and stored product data.

**Tech Stack:** Node release tooling, Cloudflare R2, Next.js/React, existing HeroUI and Falcon loaders/tokens.

**Spec:** User-approved discussion and follow-up of 2026-11-13. Two protected complete releases; retired releases seven days; incomplete uploads 48 hours. Legal Back and no desktop marketing landing. Wider folder tree and animated loading for Related Cases.

## Global constraints

- No backend, database, native binary, legal text, user data or unrelated marketing changes.
- Retention may delete only positively identified desktop installer objects; never current/rollback references or other shared-bucket content.
- First rollout generates a reviewable inventory/plan. Unknown legacy state is protected until classified safely.
- Preserve EN/RU, both themes, keyboard operation, reduced motion, async cancellation and stale response protection.
- Every handwritten TS/TSX file is at most 200 physical lines; at most two code files per source/test directory.
- Existing linked frontend worktree and dependencies are reused. Root owns git, browser verification and deployment.

## Review focus

- A concurrent release changes latest while deletion is planned: abort rather than delete a newly protected object.
- An old installer link or resumed download: seven-day retirement grace, with current and rollback permanently protected.
- A legal page opened directly without history: desktop Back/logo resolve a safe application destination.
- A picker closed/reopened or project switched during loading: stale content cannot replace the selected scope.
- A deep folder tree on a narrow screen: labels remain usable and content does not overflow the drawer.

## Task 1: Installer retention

**Owner:** desktop_release_retention. Own scripts/desktop-downloads release modules, publisher integration and targeted tests only.

- [ ] Characterize publisher and current pointer, then add policy tests for protected releases, grace periods, unknown keys and pointer/object races.
- [ ] Implement default dry-run inventory and exact-plan apply with revalidation, small provenance metadata and publishing/cleanup exclusion.
- [ ] Integrate safe housekeeping after successful publication; preserve a successful release if housekeeping fails.
- [ ] Run targeted tooling tests and generate the initial production inventory without deletion; review before applying eligible objects.

## Task 2: Desktop legal return

**Owner:** desktop_legal_return. Own legal/public navigation and existing desktop guard only.

- [ ] Trace hooks -> legal -> brand navigation and pin safe desktop/browser destination behavior with targeted tests.
- [ ] Add localized Back to all Falcon legal surfaces; use existing desktop detection/context to return to the app and guard marketing entry.
- [ ] Run focused navigation tests; root checks the actual production/browser surface and records native testing limitations.

## Task 3: Related Cases picker

**Owner:** related_picker_loading_layout. Own documentation picker/drawer and narrowly required shared picker layout hooks only.

- [ ] Trace existing fixed tree width and loading mount; pin scope/reopen/loading behavior with targeted tests.
- [ ] Reuse Falcon orb and smooth loading/content handoff; rebalance folder/case columns and preserve usable deep labels.
- [ ] Run focused picker tests; root checks desktop/narrow and both themes in a bounded visual pass.

## Integration and release

- [ ] Inspect all changed paths, review destructive retention boundaries independently, run architecture, TypeScript and affected tests once.
- [ ] Build and publish the frontend once through the existing Pages/Worker release path; do not add or wait for unrelated backend CI.
- [ ] Verify deployed source identity and browser navigation/controls without mutating user documents. Record exact cleanup outcome and any conservative first-rollout exclusions.
