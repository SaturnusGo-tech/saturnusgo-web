# Falcon first-use onboarding

The owner has pinned the supplied November 4 welcome-widget reference and authorized implementation and production delivery. This is a local extension of the established charcoal ChatGPT/Linear-style interface, not a new design direction.

## Result

- A genuinely empty repository shows a small folder-tree illustration and useful localized copy; filtered, archived, loading and failed repositories retain their own states.
- The personal trial notice becomes a compact right-side welcome panel: server-provided start date, New label, seven-day trial information, a decorative generated Falcon-screen collage, two first steps and a rounded action opening the existing create-test-case documentation. No payment or team upsell.
- Dismissing or following the welcome guide persists for the signed-in user/workspace and trial. Trial expiry remains server authoritative and keeps a truthful compact read-only notice.
- The structure screen teaches folder-icon customization once, with an inline dismissible cue. It neither opens a modal nor changes folder-management permissions.

## Work and verification

1. Create one raster collage with exact prompt provenance (parallel asset task).
2. Implement repository empty state and structure cue within folders (parallel feature task).
3. Replace trial notice and persist dismissal within the auth presentation feature.
4. Verify actual documentation navigation, trial/account isolation and one-time cue behavior with focused tests; run TypeScript and architecture gates.
5. Inspect desktop/mobile and light/dark together in two bounded rounds, then fresh visual review. Preserve actual production data.
6. Commit and publish through canonical Pages + Worker release scripts; verify the exact live source revision and save a production screenshot.

## Verification results and handoff

- Auth sign-in tests: 50 passed.
- Organization tests: 272 passed under Node 22.
- TypeScript typecheck passed; the architecture gate passed across 1,820 files.
- Final focused code review found no outstanding actionable defects after the guide link was updated to follow project navigation.
- The decorative WebP collage has a prompt sidecar (`public/falcon/onboarding/welcome-workspace-20261104.webp.json`) and separate provenance metadata. It is an illustration, not product evidence.
- Production release is pending.

## Durable interface patterns

- Welcome: keep personal-trial eligibility and dates server authoritative. Read dismissal before showing the panel, scope its preference to the account, workspace and trial, and retain the current project when opening documentation. Keep the collage decorative with empty alternative text and honor reduced-motion preferences.
- Repository empty state: use the small folder-tree illustration only for a genuinely empty active repository. Preserve distinct loading, error, filtered and archive states; keep the illustration hidden from assistive technology and the localized guidance readable.
- Folder appearance tip: use a compact inline cue beside the existing folder controls, with keyboard-accessible dismissal and focus returned to the actual folder icon. Show it once per workspace/project when appearance editing is available; opening the picker also completes discovery.
- Reuse the existing `--falcon-*` semantic CSS tokens for surfaces, text, borders, folder accents, actions and focus. These patterns require no global `DESIGN.md` or token changes.

## Browser evidence

- English dark desktop (1728 × 1117) and mobile (390 × 844): welcome content, close control and documentation action fit without clipping.
- The guide action opened the real create-test-case article with the same workspace and project.
- A folder created in the isolated local preview showed the appearance cue; clicking its icon dismissed it and opened appearance. No production data was created or changed.
- Fresh visual/code finish review: pass, no actionable defects. Russian and light-theme behavior are supported in code; screenshots for these variants were not captured in this bounded pass.
- Local captures: `.impeccable/review/desktop.png`, `mobile.png`, `folder-tip.png`.
