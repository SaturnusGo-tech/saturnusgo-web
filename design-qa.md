# Falcon administration · selected option 3

13 September 2026. Implemented in the existing application. User approved revision 3, option 3 and required panels to enter from the right and leave to the right.

## Comparison target and evidence

- Source: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/output/falcon-admin-design-20260913/revision-3/option-3-graphite-directory.png`.
- Source raster: 1561 × 1008 px, no browser chrome. The design was requested for a 1728 × 1117 viewport; its generated raster has approximately the same aspect ratio.
- Implementation: `/admin/?create=true`, actual AdministrationWorkspace and transport client. For local visual and interaction checks only, network responses are simulated; backend persistence is tested independently against PostgreSQL.
- CSS viewport: 1728 × 1117; deviceScaleFactor: 1. Actual screenshot: 1728 × 1117.
- Normalization: render the reference raster into the same 1728 × 1117 frame in Chromium. This introduces less than two pixels of vertical aspect adjustment and no crop or browser frame.
- State: Russian, dark theme, create employee, Dmitry Sokolov / dmitry@example.test / tester, focused email. The source shows an additional caret in the name while email has its focus border; actual browser focus belongs to email only.
- Full-view comparison input contained both `implementation/ui/reference-normalized.png` and `implementation/ui/implementation-normalized.png` under the absolute output directory above.
- Focused comparison input contained both `implementation/ui/reference-editor.png` and `implementation/ui/implementation-editor.png`; identical clip x=828, y=100, width=900, height=410. Checked name weight, label alignment, focus border, row separators and role control.

## Findings and resolution history

1. P2 — early implementation used smaller navigation and directory type than the normalized reference. Increased desktop body text to 16 px, directory heading to 28 px, row names to 17 px, secondary text to 14 px, and matched header/search spacing. Reduced the large editable name's optical weight. Recaptured and compared the normalized full view and focused editor after these changes.
2. P2 — the initial narrow-screen directory could remain keyboard-accessible underneath the panel. The covered list now becomes inert, is restored on close, and panel focus returns to the originating action. Tested at 390 and 800 px.
3. P2 — initial full-height rules allowed the employee workspace to overflow its available mobile height. The containing main/canvas now use the actual remaining height with independent panel scrolling. Recaptured all four widths and verified no horizontal page overflow.
4. P2 — an early company screenshot captured an unfinished view transition and appeared faded. Verified the actual completed transition and recaptured the visible page; this was an evidence-timing issue, not a palette change.
5. P2 — initial popover positioning put the account menu above a mobile header. It now opens below that header; keyboard tests verify its actions stay in view.

Post-fix evidence is in `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/output/falcon-admin-design-20260913/implementation/ui/`: normalized comparisons, create/company/journal captures at 1728, 1366, 800 and 390 px; light/dark create captures; `results.json`, `motion-results.json`, and `keyboard-results.json`.

## Required fidelity surfaces

- Typography: preserves the existing Falcon Geist font with system fallback. The raster reference does not supply a font file. Its lightweight editable name, restrained heading hierarchy, regular list names, muted metadata and wrapping are represented. Remaining family/rasterization differences are acceptable brand integration, not copied blurry raster text. The focused comparison confirms the name and email remain legible.
- Layout and spacing: three adjoining regions, 276 px desktop navigation, approximately 552 px employee directory, remaining width for the editor. Flat 82 px field rows and the persistent list match the source composition. Mobile replaces the visible directory with the panel and preserves access to primary navigation.
- Colors: graphite navigation #272729, directory #2d2d2f, editor #303032, separators #404042, main text #ededed, metadata #aaa9ad. Blue is reserved for actions and focus. Reference raster lighting/noise is intentionally expressed as flat surfaces to follow the user's minimal/flat requirement. Light theme uses the same hierarchy.
- Images and icons: uses Falcon's existing mark asset and the real authenticated profile avatar. The generated portrait in the source was deliberately replaced with the user's actual photo, as previously required. Neutral initials remain only when a member has no avatar. Standard Lucide navigation/action icons remain crisp SVGs.
- Content: three creation fields, no seat-capacity counters, percentage bars or explanatory marketing prose. Server allocates a unique login and returns normal credential handoff. Editing preserves login, phone, role and security controls. Company details use aligned rows; the audit journal uses a paginated table with server search and categories.

## Intentional adjustments

- The role chevron sits beside the role value rather than at the far edge, following the user's earlier control-alignment requirement.
- Security operations and one-time credential handoff remain available; they are necessary administration behavior and are not replaced with fictional data.
- Company and journal have no separate approved raster. They extend the selected navigation, typography, flat surfaces and row rhythm; their actual rendered states were inspected.
- Existing platform-operator and personal-profile capabilities remain in their own sections. This selection applies to the customer's company administration.

## Interaction and implementation checks

- Actual components: create, failed-save recovery retaining inputs, successful handoff, edit/save, preserved directory search, company details, journal search/category requests at 1728 × 1117, 1366 × 900, 800 × 900, 390 × 844. No page errors or horizontal page overflow.
- Motion sampled on animation frames in light/dark with normal/reduced motion: normal x moves from offscreen right to its final position; exit moves back right; reduced motion has no displacement. Unmounted panel is removed after exit, and Escape restores trigger focus. A fixed 300 ms test wait was replaced by waiting for completed DOM/focus state, avoiding frame-scheduling flakiness.
- Covered-list inertness and account-menu visibility verified at 800/390 px. Search and form controls are labeled, focus is visible, fields remain after request errors.
- 26 managed frontend tests passed, including retention during refresh, stale company-response rejection and clearing data after permission loss.
- Backend: 734 full-suite tests passed, including PostgreSQL creation/concurrency/idempotency/tenant isolation. The final audit category refinement also passed its PostgreSQL HTTP integration test. Type checks, lint, architecture checks, OpenAPI and existing migration checks passed.
- No physical phone or Safari test was performed. Responsive checks used Chromium, not a claim of device testing.

## Implementation checklist

- [x] Reference and implementation opened together at matched dimensions and state.
- [x] Full-view and focused comparisons completed after visual fixes.
- [x] Employee directory, creation/editing, company, journal and real avatar implemented.
- [x] Right-to-left entry and reverse exit, reduced motion and keyboard behavior verified.
- [x] No remaining actionable P0/P1/P2 visual findings.

Final result: passed
