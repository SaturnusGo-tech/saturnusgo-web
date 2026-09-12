# Falcon AI, markers and Markdown headings — 2026-09-12

## Published versions

- Initial writing assistant frontend: `9bf6f611913abb9115bbfc34614aea81b31e9626`.
- Heading/selection/marker follow-up frontend: `ed95955d292e065d968b18203b401c013fcddb34`.
- Follow-up Pages artifact: `37192587527ee036ade0b6f1d7764ac55ce3dc0f`.
- Worker: `372b244c-e86e-46ca-aa29-ca36302fe729`, 100% deployed at 12:05 UTC.
- Public origin release manifest returned the exact follow-up frontend SHA before Worker deployment.
- Backend writing feature: `b8c2825ff21fca8b32068c49f70cea5647a744f4`.
- Backend heading prompt follow-up: `0f5563d2e075eaa38b3df65d69b7ae2cb70f3136`.
- Railway primary `0c442ba9-3eb7-4dc9-a002-dca5e0fa2cad` and managed `5e618fd3-f8f4-49ba-87d6-c2206860a15e`: SUCCESS; health 200 and unauthenticated writing route 401. No migration or configuration changes.

## Automated validation

- `test:tms-writing`: 47 passed (marker round trips, safe URLs, selection replacement/Undo, requests, raw scenario heading offsets and protected code).
- `test:tms-adapters`: 435 passed; organization suite: 195 passed.
- TypeScript and TMS architecture checks passed (1017 files).
- Worker release suite: 53 passed.
- Production export: 65 pages built. Existing unrelated investors CSS autoprefixer warning remains.
- Backend: 716 tests passed before the final short-selection prompt refinement; all 11 writing tests and static/contract checks passed afterward.
- Live GPT-4.1 checks covered H1/H2/H3 output, a single-word improvement without invented sections, correction preserving an existing H3, and preservation of GET, URL, status and identifiers.

## Browser verification

The local fixture uses the real MarkdownField and ScenarioMarkdownInput components. Its AI transport is mocked; production verification below used the actual authenticated backend and GPT-4.1.

- H1 → H2 → H3 toolbar actions produce actual heading nodes. Reopening the saved field preserves the selected level.
- Computed editor and read-view sizes: H1 22.4px, H2 18.9px, H3 16.1px at 14px body text.
- Native text selection is translucent blue (25% light / 30% dark), with readable inherited text color.
- Marker appears before saving on regular text, bold text and inline code. The selection collapses after applying color so it does not cover the marker stroke.
- Marked query URL retains its exact visible label and destination, without a visible backslash before `=`. Existing malformed marked autolinks are covered by regression tests.
- Scenario marker selection immediately displays the formatted draft. H2 works in the scenario field; the test case does not need to be saved first.
- Authenticated production smoke on Umbrella-Host: created an unsaved case draft, entered synthetic API notes, opened **Спросить Falcon AI**, requested H1/H2/H3, reviewed the real response, replaced the draft text, applied a blue marker, and applied the field. All heading levels and marker colors remained in the read view.
- Initial production writing smoke also checked typo correction, exact replacement and Undo.
- Synthetic production drafts were discarded by reloading the repository. No test cases or user-authored content were saved or modified during this smoke test.

## Scope

The existing field/form layouts are retained. Controls are shared across Markdown descriptions, preconditions, test data and project/portfolio narratives. Scenario fields retain their compact source/preview editor. User documentation includes Falcon AI, immediate marker preview and H1/H2/H3 controls in Russian and English.
