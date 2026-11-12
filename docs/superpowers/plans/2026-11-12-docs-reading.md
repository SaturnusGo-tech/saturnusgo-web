# Documentation iteration plan

Spec: ../specs/2026-11-12-docs-reading.md

## Global constraints
Use existing Falcon components and theme tokens; no customer content rewrites, no fabricated metadata or permissions. Keep embedded docs as sidebars. Preserve published-only reader/run boundaries. No production deployment in this iteration.

## Tasks
1. Navigation and publishing: reproduce panel/main discrepancy, add authorized draft fallback, shared modal and pending-state tests. Owner: docs_navigation_fix_20261112.
2. Related cases: reuse repository picker, real bulk persistence, two-item property plus full-list sidebar. Owner: docs_related_cases_20261112.
3. Authoring and association backend: concrete readable-authoring examples and contract tests, secure draft associations and run snapshot predicates. Owner: docs_authoring_quality_20261112.
4. Reading surface: backdrop-free references, distinct documentation links, wider composition, sticky table column, reuse member hover cards. Owner: root.
5. Integrate contract and components; run focused checks, visual desktop/narrow checks and fresh review. Capture local preview evidence.

## Verification — 2026-11-12

- Frontend: final production build, typecheck and architecture check (2485 files) passed; 137 documentation tests and 10 shared member/picker tests passed, none skipped.
- Backend: typecheck, build, architecture, OpenAPI validation, migration verification, guide freshness and focused PostgreSQL/MCP integration checks passed. The full suite ran 1804 tests: 1802 passed and two contract/readiness fixtures needed updates. Both fixtures were corrected; the corrected files then passed all 3 tests. The full suite was not repeated after those fixture-only corrections.
- Backend aggregate OpenAPI and frontend generated contract match SHA-256 `8d6a5ff4e87b4755e5f37cab77d2c0ec3a51cb1eba4b187534e7390b4d1ff67a`.
- Independent backend and final frontend reviews approved. Review-discovered partial-save/concurrent-edit association issues have regressions covering explicit selections, authoritative reconciliation and navigation/unmount races.
- Actual local UI checks: dark/Russian, light/English, 1728px desktop, 1280px narrow and 390px mobile. Verified unpublished-child embedded navigation, 480px case-list drawer, repository picker, profile hover, and publication busy state. The first table column stayed at the same x coordinate after 600px horizontal scroll. The publication modal did not move the background title in the measured local invocation.
- File-only design detector: no primary findings. Retained incumbent shared app tokens and intentional local-preview/shadow values; no suppressions added. Existing unrelated build CSS compatibility warnings and backend lint baseline were not expanded into this task.

Preview: `http://127.0.0.1:4651/work/docs-reading-preview/`. This development-only route uses fictional data and real presentation components. It does not prove production customer-session behavior. Evidence: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/output/falcon-docs-reading-20261112/evidence`.

No customer text was rewritten, no drafts published, and no production deployment performed. Source authoring guide and plugin skill updates take effect after the later backend/plugin release. Work remains on the two isolated `codex/` branches for review.
