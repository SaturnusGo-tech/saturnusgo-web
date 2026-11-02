# Chat controls and integrations store

## Direction

Implement the user's specific refinement locally in the existing isolated frontend worktree. Match the real ChatGPT plugin directory inspected at https://chatgpt.com/plugins on 2026-11-02: neutral surface, secondary sidebar, search in the heading row, quiet filter pills, grouped flat two-column service rows with real brand marks. The native Codex app was inaccessible to computer use; the shared live web directory is the visual reference. Preserve Falcon's services, localized copy, permission checks, configuration routes and backend contracts.

The composer should have a compact single-row resting state, with its placeholder aligned with microphone/send controls; multiline messages must still expand. The Falcon AI header hamburger toggles the actual history pane. Desktop history starts open, mobile history starts closed and overlays the conversation with animated dismissal.

Global navigation removes the dedicated Collapse/Expand control and supports horizontal gestures. Start expanded when no saved preference exists. In the user's final clarification, hover/focus temporarily opens a manually collapsed rail, and pointer leave closes that preview. Deliberate press-and-drag right pins it open until manually collapsed left. Both temporary and pinned expansion resize the content through the same width transition, never an overlay. A narrow right-edge separator shows the system horizontal resize cursor and a subtly brighter line; dragging the separator works directly, with arrow-key alternatives. Icons retain stable vertical anchors during hover preview. Existing mobile navigation remains reachable. Light sidebar and header share the same background, with slightly thinner official icons.

## Work

- [x] Compact 54px composer; preserve Enter/IME/dictation/send/streaming controls and multiline growth.
- [x] Header history toggle, desktop/mobile pane animation, outside/Escape/focus behavior, left swipe and visibility-gated history queries.
- [x] Global sidebar hover/focus/gesture behavior; remove redundant footer control. Add an accessible resize separator and independent profile/notification menus.
- [x] Replace integration cards with the inspected directory composition; preserve all 12 services, status/error/retry/search/filter/category/detail actions. Capability filtering remains authoritative.
- [x] Meaningful scoped behavioral regressions: 118 guide tests, 61 navigation tests and 9 catalog tests pass. TypeScript and architecture checks pass (1553 files).
- [x] Inspect desktop/mobile, light/dark, search reset, history focus/Escape, resize cursor, actual boundary drags, transient hover and profile/notification exclusions. Save captures and leave the local preview available.

## Verification notes

React18 dropped boolean `inert` attributes during the initial inspection. The history pane and conversation now assign the native DOM property through refs; browser inspection confirmed hidden history is inert and open mobile history makes the conversation inert, restoring focus on Escape. Current chat console is clear. The directory search pill also overrides the legacy global input-shell radius locally.

The user clarified navigation behavior during implementation: both transient hover and pinned expansion must resize content, temporary previews retain icon anchors, the boundary exposes the native resize cursor, and profile/notification controls never reveal the main navigation. These final rules replace the initial overlay/persistent-hover interpretations. Browser confirmation exercised both drag directions, preview dismissal and the independent menu exceptions.

The development server restarted during hot compilation under local memory pressure; frozen sources were warmed and browser captures taken from the running preview afterward. No repository build configuration changed. The local API remains synthetic/read-only; provider generation, populated production history and real integration mutations are outside this presentation verification.

## Limits

No production publication, backend edits, provider changes, new integrations, fabricated connected states or paid API calls. Handwritten TS/TSX <=200 lines per file and <=2 code files per directory. Local synthetic API is read-only, so this iteration verifies presentation/navigation rather than real integration changes or model generation.
