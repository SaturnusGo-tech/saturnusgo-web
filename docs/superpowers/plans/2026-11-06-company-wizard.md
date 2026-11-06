# Company setup wizard

Approved direction: implement the supplied Firebase screenshots as a fullscreen, spacious multistep Falcon flow. Match layout, typography hierarchy, illustration placement and motion character; use original Falcon blue/violet artwork and existing color tokens. Do not add Firebase features or external service consents.

## Flow and invariants

1. Company name: large underline input and automatically suggested slug.
2. Company address: editable slug on a separate equally spacious step. Optional legal details have their own step. Saving reserves the existing backend setup; revisiting an unchanged setup does not save again.
3. Explicit consent: explain conversion of all existing projects and show server-provided Startup price/seats. Consent belongs to the saved setup version.
4. Preparation: show actual server provisioning status with animated blue/violet indicator. Poll safe reads only. Errors and uncertain writes require explicit retry. Never simulate completion.
5. Existing authorized checkout: retain quote, explicit confirmation, no-charge disclosure and production capability guards. Remain fullscreen through pending activation.
6. Success: only authoritative completed checkout, active subscription and company summary. Continue opens company administration on the current authenticated origin.

## Implementation

- Root: wizard state, modular name/address, consent/legal, checkout, progress, shell/art.
- Parallel: original transparent illustration; parent keeps wizard mounted and defers hostname handoff.
- Verification: state and parent lifecycle tests, existing billing suite, typecheck, architecture check. Brief visual check against screenshots; user owns broad UI testing.
- Publish shared web frontend and worker through the existing approved release process. Desktop loads the same application UI.

## Decisions

Name means company name, not a separate new project. Existing projects are preserved. The separate address step avoids crowding the name screen. No additional backend contract is required. Public payment availability remains unchanged.
