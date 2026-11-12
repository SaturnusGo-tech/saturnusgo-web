# Documentation Architecture Implementation Plan

> **For agentic workers:** Use the existing scoped parallel tasks; root integrates and verifies their results.

**Goal:** Make Falcon's Codex documentation workflow produce a coherent reader journey inside the existing documentation hierarchy, with native folder icons and readable related-document links.

**Architecture:** Update the canonical authoring skill and generated MCP guide together. Reuse existing versioned folder appearance commands and the existing internal document-link renderer; do not introduce a second documentation or icon system.

**Tech Stack:** Existing Falcon MCP, TypeScript, React, Lexical, HeroUI, shared folder icon catalog and theme tokens.

**Spec:** User request in this chat on 2026-11-12: inspect and reuse relevant folders, separate independently useful subjects into pages/subfolders, add related reading links at the bottom, use catalog icons rather than emoji, and render internal links as a neutral icon with the document title.

## Global Constraints

- Preserve current authorization, version checks, existing rich Markdown and diagram instructions.
- Do not reorganize, move, publish or rewrite existing customer documents as a side effect of changing authoring defaults.
- Reuse the appropriate existing parent by scoped identity and meaning; do not create duplicate folders based on names alone.
- Do not impose a page per test case, arbitrary folder counts, or empty hierarchy.
- Use exact supported folder appearance fields and icon identifiers; never claim unsupported page artwork is available.
- Keep Product Docs MCP guide under its existing 16 KB limit.
- Keep plugin identity, permissions, prompts, logos and the 12 existing skills intact; no public submission.
- Only root publishes frontend; backend and private plugin use their current owning release workflow.

## Review Focus

1. Paginated existing hierarchy: missing later pages must not cause duplicate folders or false claims of an exhaustive read.
2. Similar folder names: correct project, ancestors and stable IDs must determine placement.
3. Large related scope: split by reader question and independent lifecycle stage while keeping an overview and meaningful cross-links.
4. Existing content: preserve IDs and incoming links, and seek an explicit reorganization request before moving unrelated existing material.
5. Theme and interaction: internal document links retain native routing, hover, keyboard focus and readable wrapping in both themes and on mobile.

## Task 1: Canonical Authoring Behavior

**Owner:** `doc_authoring_quality`.

**Files:** Canonical backend `integrations/falcon-codex/plugin/skills/manage-product-docs/SKILL.md`, generated `src/agent-integrations/delivery/mcp/tools/guide/workflow-guide.json`, focused guide tests, and generator inputs as required.

- [x] Run a baseline pressure scenario against the current skill using a paginated Matching lifecycle documentation fixture.
- [x] Inspect the supported folder/article mutation and appearance contracts with `doc_icon_contract`.
- [x] Add a concise architecture workflow: inspect, map/reuse, plan the reading route, compose bounded pages, set supported icons, link related pages, then verify placement and links.
- [x] Keep reader prose separate from technical evidence appendices and retain current safety/versioning instructions.
- [x] Verify the updated behavior against the same fixture and focused guide/package tests, including the guide size bound.
- [ ] Publish the canonical backend guide and clean private plugin update, then verify live guide and plugin readback.

## Task 2: Native Document References

**Owner:** `doc_diagram_routing`.

**Files:** Existing document-kind reader/editor smart links, preview presentation and focused tests under `app/src/modules/core-tms/product-docs`.

- [x] Characterize current document-kind icon/title, editor classification and sidebar routing.
- [x] Add behavior tests for internal document identity and preservation of case/external links.
- [x] Render document links with the existing document icon and resolved title, neutral foreground and wrapping; remove unnecessary chip framing for this kind only.
- [x] Keep hover previews, accessible focus, sidebar navigation and existing case/external appearance.
- [x] Verify focused tests, typecheck and architecture constraints.

## Task 3: Integration and Release

**Owner:** Root.

- [x] Review both scoped diffs and their contract alignment.
- [x] Inspect production components in a disposable visual fixture: desktop/mobile, light/dark, hover and click.
- [x] Remove all disposable preview routes before any production build.
- [x] Run affected Markdown/reference/auth release checks and the design detector once; fix any real findings together.
- [ ] Prepare and publish only this frontend change from current production `fc73525064915395d8b97bde29ceed995e189f45`; preserve unrelated dirty worktrees.
- [ ] Verify live source SHA and runtime assets, plus the separately published canonical guide/private plugin.
- [ ] Report the new defaults, actual plugin version and the fact that existing customer documents were not automatically reorganized.

## Verification notes before release

- Backend source `6344191bf565bf74f1190f21a9c0e78fd908861e`: 26 focused guide/package tests; architecture, OpenAPI, migration catalog, typecheck and build verified. Product Docs topic is 15,986 bytes within the existing 16,000-byte limit.
- Baseline skill already suggested a sensible topical split. The new rules close the observed full-tree pagination, semantic folder reuse, real-ID reading links and catalog-icon gaps; do not attribute all document splitting to this update.
- Frontend initial patch: 112 documentation/reference/deep-link tests, 136 writing tests and 146 gateway/release tests pass; architecture checks 2,455 files. A subsequent review found a selected-editor missing-preview title fallback; commit `3a9e6411bbfb138a98ff9869f86bbcd5c99b953f` resolves it, preserving the canonical link and copy URL. Four additional behavioral regressions cover NOT_FOUND, null, blank and resolved metadata.
- Screenshots and deployment evidence are stored outside the source tree in the task output directory. Disposable synthetic fixtures were removed; no customer documents were changed.
- Publication checkboxes deliberately remain pending in the immutable source artifact; complete deployment evidence is recorded after publishing.
