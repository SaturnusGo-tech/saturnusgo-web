# Authoring leave protection

Spec: user-approved behavior in this chat. Docs autosave before navigation; cases/defects never silently create drafts. Warn before loss and default to keeping the editor open. Include attachments, properties, close controls, navigation/history, and browser/app close boundaries.

## Tasks
1. Shared leave coordinator, accessible HeroUI confirmation, browser/history integration (root).
2. Cases and shared steps dirty tracking and guarded close intents (unsaved_case_audit).
3. Docs version-aware autosave, scoped durable recovery, guarded internal navigation (unsaved_docs_defects_audit).
4. Defects, comments, and remaining standalone forms (unsaved_defect_forms).
5. Review concurrency, native desktop boundary, end-to-end/visual tests, architecture/typecheck/contract/build gates, publish and public-byte verification.

## Constraints and decisions
- Existing isolated authoring checkout, backend unchanged unless evidence requires contract work.
- Max 200 lines/file, two code files/directory, no new dependencies, no sensitive form data in navigation context.
- One whole intent per approval. Busy writes block navigation, failed saves keep data and editor open.
- Autosaved documentation uses expected draft versions; older save responses cannot clear newer edits. Recovery is identity/workspace/project scoped.
- Native browser warning wording is platform controlled. App termination or machine failure cannot be guaranteed by an in-memory confirmation; docs recovery is the durable fallback.
- Production publication is already authorized by the user. No additional permission prompt.

## Progress
- Baseline front 88f8069, backend 7c7e46c, Pages df8f92f clean.
- Audits found docs Map-only buffering and raw close/navigation operations. Tests added for common coordinator and browser rewind/replay.

- Implemented one shared leave coordinator with semantic revisions, async revalidation and scoped approved animation commits.
- Cases, defects, shared steps, comments, runs, project/portfolio/environment forms and profile editing use dirty/busy sessions; save failures retain the editor.
- Product Docs uses version-aware serialized autosave plus validated identity/workspace/project-local recovery. Recovery storage failure is surfaced to the user.
- Browser Back/Forward rewinds before confirmation and replays only the approved destination. Reload/close uses platform confirmation.
- HeroUI confirmation visually verified in dark/Russian, light/English and 390px mobile. Stay and Escape retain text; explicit Leave closes.
- Frontend typecheck, architecture and generated contract checks passed. Full app-source test run: 2,999 pass, one pre-existing public documentation image provenance failure (all relevant inputs unchanged from baseline; evidence recorded outside source). Final TMS/core transport run: 2,944/2,944 PASS across 757 test files. Changed authoring suites passed independently; final verification receipts are in output/falcon-authoring-leave-20261113/verification.
- Desktop beta 0.2.13 adds OS-native unload protection, including external-link window replacement and staging cancellation. Unit suite: 182/182 PASS. Real Electron close, reload/navigation, Stay→Leave replacement and app-quit checks pass. All three rebuilt installers verified against exact final source, CPU architectures and hardened fuses; no production claim until public bytes are verified.
- Backend and schema unchanged. No migrations or new server contract required. Existing npm lint script remains a no-op; it is not counted as lint evidence.
