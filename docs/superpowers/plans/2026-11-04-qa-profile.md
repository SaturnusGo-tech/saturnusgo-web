# Personal QA profile implementation plan

**Goal:** Give every signed-in Falcon user an editable profile and an accurate view of their own QA activity, using the supplied profile reference and existing Falcon controls.

**Design:** A 300–320 px identity column with a 1600×600 iridescent cover and overlapping avatar. A wider column holds compact, labeled profile fields. Activity follows as one continuous analytical surface, with a period control and an accessible daily chart. Existing dark/light tokens, typography and modest pill actions remain authoritative. The default cover is generated original art served from R2; personal media stays private.

**Domain:** Identity data is global to the authenticated person. Activity is restricted to the current workspace and the same person. Counts come from immutable authored events: distinct created cases, distinct created defects, completed case attempts, and runs in which those attempts occurred. Assignment or starting a run does not count as execution. No invented score, mock production activity, or team ranking.

**API:** Generated OpenAPI types for `/me/profile`, version-checked edits and avatar/cover uploads; `/me/profile/activity` with 30/90/365-day periods. Preserve managed password/MFA/session destinations. Self-profile changes remain available after a trial expires.

## Work ownership

1. Backend agent: authenticated self-profile vertical slice, migration, private image storage, authoritative activity query, contract and focused PostgreSQL/auth/concurrency tests.
2. Access agent: visible My profile destination for signed-in personal/company users; truthful personal-workspace label without altering permissions.
3. Asset agent: generate original banner, publish and verify R2 object; inspect image policy and session avatar integration.
4. Root: generated client transport, cancellable state, profile editor/identity/media, analytical view, localization and responsive styles.
5. Review: independently review changed authorization, metrics, async/concurrency and keyboard paths. Run typecheck, architecture, relevant behavioral tests, production build and contract generation.
6. Release backend then exact frontend release; verify endpoint/asset/release availability. Manual visual acceptance stays with the user as requested.

## Verification cases

- Personal and managed sessions can read and edit only their own profile.
- Stale edits fail; failed save/upload retains the previous confirmed data.
- Media validates types/sizes and uses expiring authorized URLs.
- Workspace activity denies non-members and never includes another person's events or agent-authored results.
- Switching period/workspace cannot display a stale response; no activity differs from failed loading.
- Profile fallback initials, contact links, upload errors, empty activity, light/dark theme and narrow width have intentional states.

## Implementation verification

Node22 typecheck and architecture (1,861 files) pass. Focused profile/access/state tests pass27/27; worker tests pass92/92. Independent review identified and resolved expired-trial profile access, formatted-phone validation and retry/save races. The original default cover is published in R2, with dimensions, checksum and provenance in `docs/profile-assets/banner-default-v1.json`. Manual visual acceptance remains with the user; no production activity was fabricated for presentation.
