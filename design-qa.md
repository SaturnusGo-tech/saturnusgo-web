# TDM Settings workspace design QA — 2026-11-14

**Findings**

- **No actionable P0/P1/P2 remains in the captured desktop and laptop scope.** The Add source provider-mark mismatch from Pass 1 is corrected with actual MySQL and PostgreSQL assets from the installed `react-icons/si` library (`SiMysql`, `SiPostgresql`), sized at 14px in Falcon's neutral foreground. The menu was recaptured at the same 2160 × 1250 CSS viewport/DPR1 and compared with the reference in both full and focused paired evidence.
- No clipping or overlapping controls was found in the overview, source menu, closed/open source selector, Create view form, table/query screen, light theme, 1280-pixel laptop overview, or laptop Create view dialog. The remaining typography normalization uncertainty is P3, described below.

**Open Questions / verification limits**

- The supplied references are Postman screenshots, not Falcon design tokens or editable source. Their CSS viewport, device pixel ratio, original font family and zoom were not supplied. The comparisons normalize screenshot width; they do not prove exact pixel equality.
- MySQL and Postman Cloud Store live external connections were not exercised with real credentials. Source selection UI exists; backend adapter tests are separate evidence from a successful connection to those services.
- The recorded browser harness uses production Falcon components and adapters against isolated PostgreSQL with synthetic records. It is not the installed Electron binary or authenticated production tenant.
- Fresh console inspection after rebuilding the latest preview (approximately 11:09 UTC), reloading light mode at 1280 × 900, and opening/closing Existing source returned no new warnings or errors. Earlier Maximum update depth messages at 10:40:42–44 precede the callback fix and remain historical evidence, not part of this clean run. Mobile and 200% browser zoom were not captured in this pass.

## Source visual truth and captured implementation

Source reference directory: `/var/folders/m4/ss0ghsrd5dl5chxys5v0rgqm0000gn/T`.
Implementation evidence directory: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/output/falcon-tdm-settings-20261114`.

| State | Source visual truth path (basename under source directory) | Implementation screenshot (basename under evidence directory) |
| --- | --- | --- |
| Dataset overview | `codex-clipboard-69c50459-2e69-4a72-9ad7-b5735985a134.png` | `workspace-overview.png` |
| Add source open | `codex-clipboard-358e0865-1eac-4ead-91b6-b4645f37f755.png` | `workspace-source-menu.png` |
| Create view, closed source selector | `codex-clipboard-66e2488e-85ff-4e81-863a-6c85a0ff262d.png` | `workspace-create-view-closed.png` |
| Create view, source selector open | `codex-clipboard-53e77d76-bd86-44f0-a0e9-418c84d46ea9.png` | `workspace-create-view.png` |
| Data view and SQL query | `codex-clipboard-bd2a8f45-5a1e-4bea-a1aa-52299f8f539d.png` | `workspace-source-query.png` |
| Falcon light theme | No supplied light reference; existing Falcon tokens are the authority | `workspace-light.png` |
| Laptop light overview | No supplied laptop reference; desktop hierarchy is retained | `workspace-narrow.png` |
| Laptop light Create view dialog | No supplied laptop reference; same form composition | `workspace-narrow-dialog.png` |
| Standalone Static Data | No supplied type-specific reference; same workspace shell | `workspace-static-data.png` |
| Empty workspace | Supplied initial workspace composition | `workspace-empty.png` |

All listed implementation screenshots were opened, not merely located. Source and implementation were then placed together and opened in two comparison images:

- Full-view comparison: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/output/falcon-tdm-settings-20261114/tdm-full-comparison.jpg` — four paired desktop states.
- Focused comparison: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/output/falcon-tdm-settings-20261114/tdm-focused-comparison.jpg` — overview form, provider menu, dialog controls, and table header/rows.

## Viewport and density normalization

- Primary implementation: **2160 × 1250 CSS pixels, deviceScaleFactor 1**; PNGs are 2160 × 1250 physical pixels.
- Laptop implementation: **1280 × 900 CSS pixels, deviceScaleFactor 1**; corrected `workspace-narrow.png` is 1280 × 900 physical pixels.
- Overview/menu references: **3584 × 2072 physical pixels**. Dialog reference: **3584 × 2074**. Data/query reference: **3584 × 2044**. Original CSS size and DPR are unknown.
- Full comparisons fit each artifact proportionally into equal-width panels without distortion. Focused comparisons first resample references to **2160 physical pixels wide**, a factor of **2160/3584 = 0.60268**, preserving their aspect ratio, then crop matching content regions. This is composition normalization, not a claim that the source originally used this CSS viewport.
- Postman account chrome, collection categories, trial/upgrade controls and footer utilities are not cloned. The implementation retains Falcon's project header and relevant TDM categories. Content differs deliberately: four synthetic imported rows and an active-customer query with two result rows replace the reference's 100-row sample. Row count does not change the table and SQL pane hierarchy.

## Required fidelity surfaces

| Surface | Observed result and intentional differences |
| --- | --- |
| Fonts / typography | Falcon uses its existing system/Geist fallback stack, approximately 12–13px for compact workspace content, 13px category/header text, and 14px dialog title. Reference font family is not identifiable with confidence from supplied raster alone. Weight hierarchy, one-line tree labels, small muted field labels, body line heights and ellipsis are consistent; no broken wrapping or overlapping labels was visible. The normalized reference has slightly larger body glyphs than this capture, a minor P3 fidelity difference, not proof of a different original CSS size. |
| Spacing / layout | Tree is 25% viewport width: 540px at 2160 and 320px at 1280. Reference split is approximately 896/3584 = 25%. Dataset summary starts around 46.3% of full width in both normalized desktop states. Summary width is 43.3% of the detail pane (about 700px at primary capture), constrained at narrow widths. Categories are 30px high; source/view rows 40px; compact actions 26px. Dialog is about 24.6% viewport width (530px), rounded, with visible bottom actions. No decorative cards were added around name/description/source/view sections. |
| Colors / tokens | User explicitly requested Falcon colors. Sampled dark reference sidebar/content pixels are RGB(42,42,42)/(38,38,38); Falcon is RGB(30,30,30)/(24,24,24). Falcon light is RGB(252,252,252)/(255,255,255). `--falcon-*` surfaces, foregrounds, border, hover and action colors are used; no Postman orange CTA or blue input hover was copied. Neutral rounded focus treatment replaces the reference's blue border. Light source rows remain separated by subtle borders. |
| Image / asset quality | No hero imagery, avatars, image cards or generated decoration are required by this workspace. Standard Falcon/Lucide icons are sharp, consistently sized, and have no raster halos. MySQL and PostgreSQL now use real maintained-library provider assets, visually inspected in the revised capture; they are distinct and aligned with the menu labels. Their neutral color intentionally follows Falcon rather than the reference's brand-blue accents. No custom SVG/emoji/logo approximation was introduced. |
| Copy / content | Postman categories are replaced by Static Data, Shared Datasets, Reusable field sets, and Secure Credentials. Overview keeps Name, Description, Data source(s), Data views, Add source, and Create view. Extra Import file / Existing source entries expose real Falcon flows, rather than explanatory marketing blocks. Query UI shows real returned columns, rows, duration and pagination. No user instructions or implementation caveats leak into the product copy; the synthetic-data banner belongs only to the isolated QA harness. |

## Interaction and E2E matrix

Browser checks below are the parent operator's recorded run, corroborated by the captures where noted. Test-only checks are distinguished from live external-service verification.

| Flow / state | Evidence | Result |
| --- | --- | --- |
| Open Test Data workspace | Real ConfigView/TestDataRoute composition; empty and populated screenshots | Rendered; route composition inspected |
| Expand dataset and open editor in right pane | Overview/tree screenshots; presentation tests | Passed in captured browser |
| Create empty named dataset | Real browser + isolated PostgreSQL | Passed |
| Import CSV and link source | Four synthetic rows through real adapter/API | Passed |
| Create named view | Dialog captures; real save | Passed |
| Edit SQL and run active-customer query | `workspace-source-query.png`, two returned rows | Passed |
| Reload source/view and preserve saved SQL | Real browser reload against isolated PostgreSQL | Passed |
| Add existing source from scoped catalog | Parent browser run | Passed |
| Create Static Data and close editor on Save | `workspace-static-data.png`; parent browser run | Passed |
| Credential safe read | Parent browser run, masked metadata | Passed; plaintext not part of screenshot/report |
| Used In | Missing fixture route produced harness-only error; production composition was inspected | Not a successful browser Used In verification |
| Light / laptop layout | `workspace-light.png`, corrected `workspace-narrow.png`, `workspace-narrow-dialog.png` | Visually inspected; no clipping or overlapping dialog controls in shown states |
| Fresh console / Existing source interaction | Rebuilt latest preview; timestamp-filtered browser logs after reload and open/close Existing source | Passed: zero fresh warnings/errors; prior 10:40 Maximum update depth entries predate the callback correction |
| Animation / reduced motion | CSS transitions and reduced-motion rules inspected | Code checked; single still images do not prove absence of all flicker |
| Keyboard / labels / leave boundary | Dedicated component/leave tests; neutral focus CSS, aria labels and native controls inspected | Automated checks; not a complete screen-reader audit |
| Live MySQL connection | No real external credentials/server supplied to this pass | Not exercised |
| Live Postman Cloud Store connection | No real account/source supplied to this pass | Not exercised |
| Physical Electron / production deployment | Not part of isolated browser artifact | Not exercised |

Parent reported fresh frontend focused verification: 73/73 TDM tests and 13 navigation tests passed; lint, typecheck and architecture checks passed. This report does not expand that into an external integration or production-deployment claim.

## Comparison history

**Pass 1 — blocked:** Opened full and focused paired comparisons. Found provider-logo mismatch P2 in Add source: MySQL and PostgreSQL shared a generic database glyph. No visual fixes were made by this reviewer. Earlier evidence is retained as `workspace-source-menu-pass1.png`, `tdm-full-comparison-pass1.jpg`, and `tdm-focused-comparison-pass1.jpg` in the implementation evidence directory.

**Pass 2 — passed:** The implementation owner replaced the generic glyphs with `SiMysql` and `SiPostgresql` from `react-icons/si`, preserving a 14px slot and neutral Falcon foreground. The parent operator rebuilt the latest preview and recaptured Add source in `workspace-source-menu.png` at the same **2160 × 1250 CSS pixels/DPR1**. Regenerated and opened `tdm-full-comparison.jpg` and `tdm-focused-comparison.jpg`, with source and revised implementation together in each input. The provider identities are now distinct; menu spacing and labels remain aligned. No additional actionable P0/P1/P2 was found. Also opened the 1280 × 900 light Create view capture (`workspace-narrow-dialog.png`), with both footer actions and all fields inside the viewport.

**Implementation Checklist**

1. Complete: replace generic MySQL/PostgreSQL provider icons with real distinct assets.
2. Complete: recapture Add source at 2160 × 1250/DPR1 and inspect full/focused paired evidence.
3. Complete: record fresh browser console inspection; zero warnings/errors after the latest rebuild and Existing source open/close interaction, while retaining the earlier warning history.
4. Keep live external-service / physical Electron gaps explicit in release notes.

**Follow-up Polish**

- P3: If strict raster typography matching is required beyond Falcon's existing token system, obtain the source CSS viewport/DPR/font before tuning glyph scale; do not guess based on macOS screenshot density.
- Mobile and zoom resilience require their own captures before claiming those form factors.

final result: passed

---

# Historical QA record — retained from 2026-11-13

# Defect report implementation review — 2026-11-13

**Status: PASS for the requested frontend slice.** No production deployment.

## Reference and viewport

Approved source: `/Users/mercuryrucks/.codex/generated_images/01a07862-f88a-7701-bf0e-179ddf13e9b1/exec-15506e63-7a8c-42e7-a6b6-825ceb243f74.png`.
Source and implementation compared together at 1589 × 990 CSS pixels. The existing Falcon navigation, branding, theme tokens and live content rendering are retained; this is an implementation of the approved composition, not a raster embedded as UI.

Evidence directory: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/output/falcon-defect-report-20261113`.

- `reference-comparison.jpg`: full source/implementation side by side.
- `context-comparison.jpg`: focused execution-context comparison, including the detached failed-step icon.
- `dark-ru-final.png`, `light-en-final.png`: desktop themes/locales.
- `desktop-1280-dark.png`: compact laptop viewport.
- `mobile-light-top.png`, `mobile-light-bottom.png`: 390 × 844, context and bottom properties after scrolling.
- `status-tooltip-fixed.png`: pointer hover anchored directly above the status icon; both center at x=306 with a 7px gap.
- `comment-expanded.png`: actual existing rich editor after opening and typing a draft.

## Findings and corrections

1. Initial header/body/list typography was too small relative to the approved hierarchy. Increased report-owned typography and adjusted list/detail proportions.
2. Long Russian reproducibility label wrapped awkwardly. Used the approved shorter label «Повторяемость» and adjusted property tracks.
3. Initial preview size queries did not match: esbuild scopes named container identifiers per CSS module; Next production CSS preserves them. Report-owned queries now use the nearest size container, which is the report article. Both preview and production retain the same responsive boundary.
4. Empty connector links duplicated a visible integration heading. Opt-in `hideEmpty` suppresses only the ready/empty state in this rail; available connections, loading and errors remain.
5. Tooltip was anchored to the full list row and appeared over its center. It now anchors to the trailing status icon only; no extra button or tab stop was added.
6. Failed-step marker stays outside the provenance connector. The line only joins the two gray source nodes.

## Verified behavior

- Listing contains priority, title and trailing semantic status icon; no visible key/status text/assignee. Selection remains keyboard-accessible, the status remains in the accessible row name, and pointer hover on the status icon reveals its tooltip.
- Context appears first. Original run and immutable run-item snapshot are loaded through existing scoped data adapters. Original environment/build are distinct from the retest fixture.
- Original-run callback produced `{runId:"run-original",runItemId:"item-original"}` in the local preview.
- Long names wrap without page-level horizontal scrolling. Document width equals viewport width at 1589, 1280 and 390; mobile report panel also has no horizontal overflow.
- Context/body/properties scroll to the bottom at 390 × 844. Header and tabs remain available, and Back returns to the list.
- General/Attachments tabs switch to their correct panels; empty attachments state renders.
- Compact comment prompt opens the real Markdown editor, focuses it and enables Send after typing. No comment was submitted to a real service.
- Existing comments, replies, attachments, archived permissions, retest actions and shared links are retained; automated tests cover relevant state and stale-response paths.

## Validation

- `npm run typecheck`: passed.
- `npm run architecture:tms`: passed, 2778 files.
- `npm run check:tms-contract`: passed; generated contract unchanged.
- `npm run test:tms-adapters`: passed across all script suites.
- Focused final report/context tests: 59 passed, 0 failed.
- `npm run build`: passed (standard Next standalone production build).
- `git diff --check`: passed.
- Pre-publish Worker suite: 164/165 passed; one browser fixture cleanup failed with `ENOTEMPTY` while removing a temporary Chrome profile. Its complete relay test file passed on rerun (9/9); no Worker code changed.

## Limits and existing warnings

Browser verification used actual production components with isolated, read-only demonstration fixtures. No authenticated production data or physical desktop/mobile app was exercised. No backend, migrations or transport contract changed. Repository lint is a placeholder and was not represented as an actual lint check.

The existing shared HeroUI/React development shell emits a `ref` warning; existing shared native view-transition code can report a skipped-transition AbortError. These were not introduced by the changed slice (both paths exist in HEAD). The standard production build succeeds with existing optional dependency/autoprefixer warnings. Static export was not claimed: the repository's dynamic home-map API route requires its separate export preparation workflow.
