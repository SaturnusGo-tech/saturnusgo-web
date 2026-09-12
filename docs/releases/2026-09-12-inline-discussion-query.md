# Inline organization editing and repository queries — 2026-09-12

Portfolio About and project Overview edit title, description, plan, responsible and portfolio in place. Portfolio Projects keeps portfolio fields read-only. Archive is in the right breadcrumb header; the empty project list has one Create action alongside Add existing. Workflow selectors have intrinsic-width labels and full option text. Markdown placeholders share the content padding origin, with an optical gap from the caret.

Own discussion comments can be edited through revision-aware PATCH. Drafts survive failed saves; stale responses cannot replace a newer confirmed revision. Backend migration 0058 preserves immutable comment history and must be published first.

Repository filters include multiple responsible members in the existing menu. Ordinary search and QL match identity, name or email. QL supports RU/EN aliases, quotes, parentheses, AND/OR/NOT, IN lists, exact and contains operators, caret-aware suggestions and syntax feedback. Member pages load with workspace scope and cancellation; input uses deferred matching. Run selection and listings use the same parser/member context. Search needs no AI request.

## Validation

440 adapter/documentation tests, 196 organization tests and 51 writing/Markdown tests passed, without skips. The 10,000-case regression verifies boolean precedence, aliases, members, multiple selections, malformed input and insertion preserving the query suffix. Typecheck and architecture (1,031 files) pass. Final inspector regression: two tests passed.

Local browser checks used actual components and an isolated transport: inline title/description save, authored comment save, full Paused option, compact chevrons, header archive, read-only Projects title, one empty-list Create action, light/dark rendering and RU/EN QL. No customer data was changed. User documentation covers inline edits, authored comments and query syntax.

## Publication

Published runtime source: `ed919eadc9c589fe7868430b25c1a3d53ea98929`. Pages main: `f2e1336418f22c390873b82c9b4edb2a0532855e`; the origin release manifest returned the matching source SHA. TMS Worker version `124d5893-2851-4520-81aa-4585a4b3b5a2` reached 100% on 2026-09-12 at 16:48:42 UTC. Worker tests (53) and seven-domain verification passed.

Backend runtime `88381480d0e65bfdb9f2894870fefd04cf56023b` and additive migration 0058 were deployed before the frontend. Final Railway deployments: primary `fc542208-e9c3-4b22-9fa2-33294936462e`, managed access `e30ca4d1-4c91-418b-a7e5-7f5ab99477dc`, notifications `79559b66-b495-4e6f-9ee5-892684a90950`, all successful. Primary and managed health checks returned HTTP 200. Backend release documentation records the verified backup, compatibility rollout and migration audit; 719 backend tests passed.

Authenticated production browser checks after publication confirmed:

- Own comment opens with its saved body; cancellation leaves it unchanged. Inline title and description open and cancel on the About tab. The title input is transparent with no border, and the old Edit data button is absent.
- Both workflow controls use a 7px label/chevron gap. The open menu displays the full Paused label. Archive is in the right breadcrumb header. Projects disables title editing and contains one Create project action alongside Add existing.
- Responsible filters allow simultaneous selections. Clicking outside closes the menu. Mercury Rucks returns the same two assigned cases through the member filter, ordinary search and Russian QL (`ответственный: "Mercury Rucks"`). Independent English QL (`assignee IN ("Mercury Rucks") AND NOT priority = critical`) returns the same two cases with ordinary search cleared.

Production smoke used read-only searches and opened/cancelled editors; no customer records or discussion messages were changed. Search filters were cleared afterward. Save/revision concurrency was exercised in local browser and backend integration tests, not by modifying production comments.
