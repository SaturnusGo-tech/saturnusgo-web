# Defect narratives and evidence implementation plan

> **For agentic workers:** Use subagent-driven development for the independently owned backend and client narratives; root owns evidence interaction and final visual/release verification.

**Goal:** Finish the approved bug-report form with consistent narrative fields and simple file attachment by chooser, paste or drop.

**Architecture:** Extend the existing defects vertical slice with optional `preconditions` and `testData`, normalized to empty strings for existing records. Preserve private attachment upload and reuse testcase Markdown and file-transfer components. No new upload service or route.

**Tech stack:** React, existing HeroUI controls, Lucide upload icon, PostgreSQL, checked OpenAPI/generated TypeScript.

**Spec:** User's 2026-11-13 direction: Description, Preconditions and Test Data look identical; Actual/Expected retain the testcase result pair. Evidence sits centered below: upload vector icon, Attachments heading, rounded Add evidence action. No format inventory, text input, thumbnail cards or permanent drop-zone panel.

## Constraints and review focus

- Keep RU/EN, light/dark, keyboard access, reduced motion and fixed form footer.
- Ordinary text paste and internal text drags remain untouched; binary paste/drop is consumed once.
- No file changes while closing/submitting; repeated transfer events cannot lose staged files.
- Deduplicate files, show an actionable batch-limit error, preserve all already staged files after errors.
- File chooser accepts all existing backend-supported formats. HEIC is an uploadable file, not a promised browser preview.
- Existing defect data, tenant authorization, row versions, audit and idempotency remain intact.
- Follow 200 physical lines/two handwritten files per source/test directory.

## Tasks

- [ ] Backend owner: first prove failing create/update/read and PostgreSQL roundtrip for both narrative fields; implement additive migration, domain, SQL, presenter and OpenAPI; regenerate transport types. Run backend gates and document recovery.
- [ ] Client narratives owner: use generated transport fields at the adapter boundary; extend controlled drafts, submit/reset/retry and read/edit detail. Render both fields using `CreationNarrativeSection`; test payload and roundtrip behavior.
- [ ] Root: first prove binary/text paste/drop, duplicate handling, disabled state, pending-event accumulation and batch overflow. Reuse existing file-transfer parser. Implement centered evidence affordance and compact filename rows; no decorative containers.
- [ ] Root: render actual form with isolated nonpersistent fixtures, inspect empty/filled/focused states, RU dark/EN light and narrow viewport together; fix observed issues in one batch and confirm once.
- [ ] Root/reviewer: inspect combined changes, run relevant frontend suites, typecheck/architecture/contract/build plus full backend gate. Publish only coherent contract/client/backend changes, verify actual production release bytes and report browser limitations.
