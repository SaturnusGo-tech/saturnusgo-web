# Falcon session and impact recovery implementation plan

**Goal:** Restore a neutral session loader and make GitHub impact reviews bounded, readable and recoverable after concurrent updates or AI quota exhaustion.

**Architecture:** Keep managed access decisions in the existing auth boundary. Keep impact resource ownership and optimistic concurrency in its application commands, and presentation-only search/pagination separate from server scope decisions. Backend work preserves the frozen production artifact, tenant isolation and free-only AI limits.

**Requirements:** User report on 18 October 2026: auth artwork flashes during restoration; impact actions overlap; long task lists are difficult to review; repeated PRECONDITION_FAILED and AI_REQUEST_BUDGET_EXCEEDED block production use.

## Constraints

- Preserve authentication, MFA, mandatory password changes, ETags and idempotency.
- Do not blindly replay approvals or overwrite unreviewed scope after a conflict.
- Preserve all records and current release patches; no schema change is planned.
- Keep AI free-only with the existing data-collection and retention restrictions.
- Support RU/EN, narrow layouts, keyboard navigation and existing Falcon theme tokens.

## Tasks

- [ ] Auth: regression-test deferred managed entrypoint/session resolution; render the existing shared loading state before authorization artwork. Verify anonymous, password-change and MFA gates.
- [ ] Impact commands: regression-test definitive 412 reconciliation, cancelled reads and stale owners. Load the current version once and request review; retain safe same-key retry semantics for uncertain outcomes.
- [ ] Review UI: add a tested search/page projection with ten entries per page. Use it for analyses, scope recommendations, scope entries and gaps; collapse file evidence, separate action/footer groups, and make controls wrap without overlap.
- [ ] Backend: verify production budgets/model availability. Correct budget-reset scheduling and prevent budget retries from exhausting attempts. Replace only a retired free-model configuration after verifying a compatible zero-cost alternative.
- [ ] Release: focused regression suites, typecheck/architecture/lint/build and backend PostgreSQL checks; independent review; publish existing scoped deployment paths; verify session loader, review controls and runtime configuration.

## Review focus

Large lists and long paths remain searchable without truncating the stored scope. Deleting the last item clamps the current page. Background refresh does not overwrite a command. A conflict never approves new scope automatically. Exhausted daily quota does not claim a one-minute recovery or hide deterministic evidence.

## Accepted steering

Keep AI free-only. Add FALCON_IMPACT_AI_ENABLED as an explicit server switch; pause AI in production without deleting analyses, disabling GitHub or bypassing QA approval. Show a localized illustrated banner from current server metadata, including historical/empty results; manual draft actions remain available. No paid inference is authorized.
