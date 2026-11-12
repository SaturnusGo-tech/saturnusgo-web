# Import Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox tracking.

**Goal:** Prevent silent migration loss and verify imports through UI, HTTP and stored revisions.

**Architecture:** Keep private source upload, server normalization, folder planning and idempotent persistence. Add narrow validators and source adapters at existing boundaries, with real database verification.

**Tech Stack:** React/TypeScript, existing SheetJS when needed, Fastify/Zod/PostgreSQL, node:test, CUA browser.

**Spec:** ../specs/2026-11-12-import-hardening-design.md

## Global Constraints

- Preserve project/tenant authorization and original bytes; no model-generated actions or expected results.
- 5,000,000-byte source limit, 2,000 records, 500 procedure items and 100 tags.
- Backend handwritten TypeScript remains at most 200 lines/file and two code files/directory.
- Use disposable test data and report limits honestly.

## Review Focus

- Explicit malformed arrays must be rejected before any write.
- Mixed collections and procedures longer than the model sample must remain complete.
- Unicode/control characters and Markdown whitespace must survive or reject predictably.
- Lost responses/cancellation must not duplicate source uploads or successful case writes.
- External native exports must be decoded without claiming unsupported provider fidelity.

### Task 1: Native import boundary

**Files:** exchange/validation/parse-test-case-exchange.ts; exchange/application/import-project-cases.ts; exchange/application/normalization/normalize-external-import.ts; exchange/state/import/use-import-cases.ts; focused regression tests.

**Interfaces:** Existing parseTestCaseExchange and importProjectCases remain compatible; normalization errors expose a stable code for localization.

- [ ] Add failing tests for malformed arrays, 99/100 tags, local normalization errors, exact whitespace if supported by persistence.
- [ ] Run focused tests and record failures.
- [ ] Reject explicit bad arrays; preserve all source tags and append source tag only with capacity; translate local import errors.
- [ ] Run focused tests and typecheck.

### Task 2: Server normalization integrity

**Files:** backend src/import-normalization/domain/{source,mapping}; application/normalization; test/import-normalization; test/test-cases; case folder policy.

**Interfaces:** inspect returns all identified records; normalize returns one case or explicit issue per record. Existing auth and DTO contracts are retained unless a tested contract change is required.

- [ ] Add failing tests for mixed collections, partial/missing procedure selectors, optional flags, automated type, null priority and NUL folder.
- [ ] Run failing tests on Node22.
- [ ] Correct discovery, completeness checks and source semantics; align folder policy with actual folder domain.
- [ ] Verify normalization→HTTP→PostgreSQL with stored-field assertions and rejected inputs causing no writes.

### Task 3: Provider corpus and input formats

**Files:** output/falcon-import-audit-20261112/research; exchange source decoding/upload; backend import-file format policy if expanded; source history tests.

**Interfaces:** A decoded source enters existing inspect/normalize as unknown JSON; saved source remains exact original bytes.

- [ ] Build synthetic fixtures based on official JSON/CSV/XML/spreadsheet documentation and list expected fields and supported limits.
- [ ] Run them through the actual parser/normalizer and record failures.
- [ ] Implement only verified bounded adapters using existing libraries; reject malformed/ambiguous input before persistence.
- [ ] Retest source-byte identity, multiline/quoted data, repeated headers/steps and unsupported formats.

### Task 4: End-to-end and release validation

**Files:** isolated local PostgreSQL harness and browser evidence under output/falcon-import-audit-20261112; repository tests where regressions belong; docs/falcon-external-json-import.md.

- [ ] Run real persistence matrix for native/manual/automated/checklist/provider fixtures; compare fields, counts, hierarchy and immutable revisions.
- [ ] Exercise UI upload/import/history, errors, retry and cancellation in an isolated project; capture proof.
- [ ] Run frontend/backend required checks and independent review; fix findings and rerun affected checks.
- [ ] Update supported-format documentation and publish verified fixes using the existing release flow; inspect production artifacts and smoke test authorized isolated data.
