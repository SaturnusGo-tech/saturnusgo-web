# Inline organization editing and repository queries — 2026-09-12

Portfolio About and project Overview edit title, description, plan, responsible and portfolio in place. Portfolio Projects keeps portfolio fields read-only. Archive is in the right breadcrumb header; the empty project list has one Create action alongside Add existing. Workflow selectors have intrinsic-width labels and full option text. Markdown placeholders share the content padding origin, with an optical gap from the caret.

Own discussion comments can be edited through revision-aware PATCH. Drafts survive failed saves; stale responses cannot replace a newer confirmed revision. Backend migration 0058 preserves immutable comment history and must be published first.

Repository filters include multiple responsible members in the existing menu. Ordinary search and QL match identity, name or email. QL supports RU/EN aliases, quotes, parentheses, AND/OR/NOT, IN lists, exact and contains operators, caret-aware suggestions and syntax feedback. Member pages load with workspace scope and cancellation; input uses deferred matching. Run selection and listings use the same parser/member context. Search needs no AI request.

## Validation

440 adapter/documentation tests, 196 organization tests and 51 writing/Markdown tests passed, without skips. The 10,000-case regression verifies boolean precedence, aliases, members, multiple selections, malformed input and insertion preserving the query suffix. Typecheck and architecture (1,031 files) pass. Final inspector regression: two tests passed.

Local browser checks used actual components and an isolated transport: inline title/description save, authored comment save, full Paused option, compact chevrons, header archive, read-only Projects title, one empty-list Create action, light/dark rendering and RU/EN QL. No customer data was changed. User documentation covers inline edits, authored comments and query syntax.

Publication evidence will be appended after backend migration 0058, Pages and TMS Worker rollout.
