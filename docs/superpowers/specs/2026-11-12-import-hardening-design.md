# Test case migration integrity

The user authorized autonomous end-to-end testing and immediate correction of import failures, including external trackers, test-management exports and checklists. Existing JSON import saves a private original before normalization and writes cases idempotently. Preserve that architecture and project authorization.

## Acceptance

- Native v1/v2 imports preserve supported content, procedure type, optional flags, priority, tags, hierarchy and Markdown. Malformed explicit fields must not become empty defaults.
- External normalization must account for every discovered record and every recognizable procedure item. It must not silently omit sampled items, coerce explicit semantics or create folders the domain rejects.
- Exercise real provider export shapes based on official documentation. Distinguish native export from API JSON. Unsupported or ambiguous data must fail clearly and leave originals recoverable.
- Retrying, cancellation, source-history failures and tenant/role restrictions must remain safe. No live company cases are rewritten for testing.
- Verify stored revisions through the production HTTP application and disposable PostgreSQL; verify the actual frontend in a browser. Mocked tests alone are insufficient evidence.
- Report the tested formats, cases and remaining limits; arbitrary formats are not guaranteed.

## Approach

Repair existing validation and normalization first, then add bounded source-file decoding where verified native export formats otherwise cannot enter the existing pipeline. Reuse installed parsers instead of inventing CSV/spreadsheet parsing. Save original bytes under their actual format. Keep AI limited to selectors: it cannot generate missing procedure content. A full importer replacement and per-provider live connectors are unnecessary for file migration and outside this task.

## Constraints

JSON source limit 5,000,000 bytes; recognized records 2,000; maximum steps/checklist items 500 and tags 100. Backend architecture and contract checks remain mandatory. Preserve unrelated working trees, credentials and production data. Any expansion of accepted file types must have negative fixtures and source-history validation.
