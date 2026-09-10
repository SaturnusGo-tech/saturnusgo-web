# Verification launcher

The workspace now reserves a separate bottom row for the verification control. The expanded button is 24px above the available bottom edge; its close button sits above the left corner. A collapsed 30px visible edge tab restores it. No card or editor content sits beneath the launcher. Bulk selection still owns its own action area, and empty queues still hide the launcher.

The per-workspace browser preference survives reloads and project changes. Storage access failures fall back to in-memory state. Toggle focus follows the visible control. The edge hint moves only 5px once per 14 seconds, stops during interaction, and respects reduced motion.

Validation:
- 16 verification tests passed, including preference persistence, workspace isolation and blocked storage.
- TypeScript and architecture checks passed (886 source files).
- Chromium and WebKit fixture checks passed: card/dock bounds, start action, hide/restore, keyboard focus, reload, empty queue, bulk selection, 390px viewport and reduced motion.
- Local fixture removed before release.
