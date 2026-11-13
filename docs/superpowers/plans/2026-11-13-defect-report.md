# Defect Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Implement the approved Falcon bug-report composition with readable execution provenance.

**Architecture:** Keep the existing reports feature and bounded run adapters.
Load source context in an application hook and map immutable snapshots into a
presentation model. Views render this model without parsing transport responses.

**Tech Stack:** React, TypeScript, CSS Modules, HeroUI, existing Lucide icons.

**Spec:** `docs/superpowers/specs/2026-11-13-defect-report-design.md`

## Global Constraints

- Every handwritten TS/TSX file is at most 200 physical lines; at most two code files per directory.
- No backend lifecycle, authorization, schema or contract changes.
- Source context uses the original run snapshot, never the latest case revision or retest environment.
- Async context is scoped by workspace, project, defect and resource IDs; cancel/ignore stale responses.
- No raw UUIDs, invented step descriptions, test results or successful-retest claims.
- Reuse existing tokens, HeroUI and accessible navigation; support RU/EN, both themes and reduced motion.

## Review Focus

- Runless/ad-hoc and archived defects remain readable and navigable where authorized.
- Denied/missing historical data shows honest unavailable state without leaking IDs.
- Rapid switching cannot retain another bug's run or snapshot.
- Checklist/shared steps resolve from the immutable snapshot; missing steps are explicit.
- Long titles/Markdown and narrow screens retain accessible controls and scroll.

### Task 1: Compact report list

**Files:** `presentation/reports/branches/DefectRow.tsx`, branch CSS,
browser CSS, `presentation/reports/reports.module.css`, focused row tests.

**Interfaces:** Existing `DefectRow` props and selection callbacks stay unchanged.

- [ ] Test row title/selection and status tooltip with no rendered ID/status text.
- [ ] Implement priority/title/trailing status layout and remove forced wide-list overflow.
- [ ] Keep filtering and outside-scope navigation truthful; verify focused tests.

### Task 2: Header and property hierarchy

**Files:** `presentation/reports/detail/header/DefectReportHeader.tsx`, split dates,
header CSS, `detail/properties/DefectReportProperties.tsx`, property row and CSS.

**Interfaces:** Existing header/property component props and retest actions unchanged.

- [ ] Test key/status above title and no duplicate status in property rail.
- [ ] Implement dedicated header styles and compact explicit property labels.
- [ ] Preserve all actions, integration links, actor information and permissions.

### Task 3: Historical context and report body

**Files:** New `defects/execution-context` application/model files and tests;
`presentation/reports/detail` context/content/attachments components and CSS.

**Interfaces:** `useDefectExecutionContext({ workspaceId, defect, run, connected })`
returns source run/item snapshot and deterministic pending/error states.

- [ ] Test snapshot step/checklist resolution, missing/denied data and stale switching.
- [ ] Reuse `getRun`/`getRunItem` adapters; do not fetch whole lists/bootstrap.
- [ ] Render context before Markdown; separate failed indicator from connector.
- [ ] Render result comparison; preserve attachments/comments and remove obsolete context markup.

### Task 4: Verification and handoff

- [ ] Run focused behavior and existing report/retest tests, typecheck and architecture gate.
- [ ] Build production bundle and run available relevant lint/contract checks honestly.
- [ ] Open actual components in local browser; verify desktop/mobile, RU/EN and dark/light.
- [ ] Compare approved reference with rendered screen; inspect tooltip, source navigation and long titles.
- [ ] Review complete diff; save screenshots and report verified limits. No production deployment.
