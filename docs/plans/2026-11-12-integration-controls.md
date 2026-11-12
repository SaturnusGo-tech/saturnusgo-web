# Integration setup controls

Approved direction: preserve Falcon's current integration capabilities and configuration contracts; use real HeroUI fields, lists, selection controls and actions throughout every available non-Codex integration.

## Scope

YouTrack: Connection, Projects & rules, Workflow, Webhook. Jira, Linear, Trello, Slack and Confluence: Connection, Automation, Activity & links. GitHub: those tabs plus Impact Analysis forms/review. Swagger uses its existing HeroUI source editor and is included in visual verification. GitLab, Jenkins and TeamCity remain unavailable catalog entries.

## Implementation

1. Shared presentation-only HeroUI adapters with Falcon tokens, bounded fields, solid portalled menus and explicit inherited disabled state. Preserve empty/unknown option IDs and secret omission.
2. Migrate provider fields and remove legacy native-element CSS. Compact, labeled routing rows, consistent section spacing, responsive grids. Activity links occupy full rows; IDs, actions and descriptions cannot collide.
3. Keep manager expansion/focus/draft retention. Escape in a menu closes the menu; collapsed content cannot leave an active portal.
4. Safe local preview uses actual production components and typed sample data, forbids outbound requests and real writes; production preview route returns 404.
5. Verify read-only/busy/empty/long-text states, keyboard dropdowns, both themes, EN/RU and desktop/mobile screenshots. Review changed code and run architecture, typecheck, affected behavior and transport tests before release.
6. Publish a clean source commit via existing Pages and Worker release scripts. Verify exact revision, public asset readiness and actual authenticated setup without changing live configuration.

## Evidence

Provided screenshots and source audit identify native checkbox padding inheritance and `.panel > a` overriding full-width Activity links. Baseline focused YouTrack/connector tests pass. No provider credentials, config, permissions or external deliveries may change during UI verification.
