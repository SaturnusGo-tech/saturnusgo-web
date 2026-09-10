# Environment context and dialog

The header no longer invents a build when the project has no run. Empty build values and the legacy `local-current` placeholder display the same empty marker as the environment. Real build identifiers remain visible. This is presentation only; saved run snapshots are unchanged.

The environment control opens the existing environment editor, or the creation form when no environment is available. Current environment names take precedence over a run's old name snapshot, so a rename appears immediately. Archived environments are excluded from the project fallback. The build control opens its run through existing workspace navigation, or the run screen when there is no run.

Creation and editing share the same environment dialog. It has a 22px outer radius, theme-aware background, transparent footer, 11px field wrappers, gray focus on the wrapper and no inner input outline. Labels remain visible, the address uses browser URL validation, and the existing required fields and API contract are retained. The name is focused on opening; the existing modal handles Escape, focus containment and focus restoration. Long forms scroll on small screens.

## Validation

TypeScript, TMS architecture and generated contract checks passed. Eight environment transport and run navigation tests passed. Google Chrome and Playwright WebKit 26.5 passed the same UI checks using the actual header, modal, form, application use cases and CSS in an isolated fixture:

- Missing and placeholder builds, real build display and run navigation.
- Create, edit, immediate header rename and Escape dismissal.
- Light and dark themes, 1280px and 390px viewports, no horizontal overflow.
- Transparent footer, consistent 22px dialog radius, 11px field radius, no inner input border or shadow.
- No uncaught browser exceptions.

Fixture HTTP and surrounding workspace dependencies are isolated; UI saves use the existing offline application path. This verifies browser behavior, not an authenticated production database write. API DTO behavior is covered by the transport test. Safari compatibility was checked with WebKit, not the installed Safari application.

Browser scripts, screenshots and machine-readable results: `../output/falcon-environment-20260910/` from the workspace root.
