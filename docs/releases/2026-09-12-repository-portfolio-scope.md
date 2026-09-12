# Repository project / portfolio scope and shared assignee filters

## User-facing behavior

The repository header now offers Projects and Portfolios with searchable lists. A portfolio opens the cases of its active projects as separate expandable project/folder trees. Identical folder paths in different projects remain separate. The arrow on a project branch returns to that project's normal repository controls.

Search, QL, and case filters apply across the portfolio. Large branches render 200 cases at a time with an explicit Show more control; filtering runs over the entire loaded collection, including later pages. Opening a case preserves portfolio scope and opens the correct project's inspector. The URL carries repositoryPortfolioId alongside the selected project/case. Empty portfolios, loading skeletons, per-project failures, retries, cancellation, and scope changes have explicit states.

The shared case filter menu now includes searchable, multi-select assignees. It covers the repository, portfolio repository, suite contents/settings, and new-run case selection. Existing execution menus retain run-item assignee semantics. All assignees clears the constraint; Unassigned is independently selectable. Menus close on an outside click.

Creation, import, and bulk case mutations remain scoped to a single project's existing repository. Portfolio mode provides cross-project browsing, search, and case inspection, with an explicit shortcut to each project.

## Implementation

Frontend-only change using existing authorized, workspace/portfolio/project-scoped paginated API adapters. Portfolio reads validate catalog membership and scope, limit project concurrency to three, and abort obsolete requests. No backend migration or API contract change. Existing transport safety limits remain in place and produce a visible failed branch rather than a silently truncated result.

A navigation restoration guard now completes immediately for scope-only URL changes whose selection already matches. Otherwise, opening a subsequent case could leave URL writes blocked. The existing cross-project/workspace restoration guard remains active until the target selection loads.

## Validation before publication

- TypeScript: passed.
- Architecture: passed, 1067 files.
- Adapter/domain/UI-state tests: 474 passed; organization/navigation tests: 197 passed.
- New coverage: portfolio pagination, workspace/membership isolation, identical folder paths, bounded concurrency, per-project failure, request cancellation, late responses, scope links, common assignee multiselect, and scope-only history restoration.
- Browser fixture using real workspace model, header, repository, inspector, and menus: 694 cases across two portfolio projects (44 + 650), third unrelated project, empty portfolio, and three searchable participants.
- Verified two checked assignees at once, name search, outside dismissal, case MOB-648 beyond the rendered first portion, correct inspector and project/case/portfolio URL, empty-portfolio state, and return to one project.
- Narrow tree shows assignee avatars; wider tree can show truncated names. Reused repository folder/case components and theme tokens.
- Built-in help updated: case organization, portfolio scope, and assignee filters.

Publication evidence is appended after release verification.
