# Falcon defect report design

Approved by the user on 2026-11-13. Visual target:
`/Users/mercuryrucks/.codex/generated_images/01a07862-f88a-7701-bf0e-179ddf13e9b1/exec-15506e63-7a8c-42e7-a6b6-825ceb243f74.png`.

- Keep Falcon's existing shell, palette, navigation, attachments and retest behavior.
- Header: separate resource key/status line, readable title, existing tabs/actions.
- Listing: priority icon, title and trailing status icon only; no visible ID,
  assignee or status text. Status has a localized hover/focus tooltip.
- Execution context comes before the report description, on the base surface.
  Show original run, immutable run-case title and failed step/checklist item.
  Source environment/build must come from the original run, not its retest.
- The failed-step icon must not overlap a provenance connector or another dot.
- Link source run and item to existing navigation. Keep source-case links for
  defects without a run. Do not expose raw resource UUIDs as readable content.
- Preserve the report's Markdown description and results. Compare actual and
  expected as aligned full-width labeled rows. Do not fabricate reproduction
  steps, translate user data, or infer successful execution from a verified flag.
- Compact, explicitly labeled properties; status already appears in the header.
- Preserve comments, permissions, attachments, external links and retest history.
- Use existing HeroUI controls/tooltips, icon library and Falcon theme tokens.
- Support English/Russian, dark/light, narrow viewports, keyboard and reduced motion.
- No publication in this task: implement and verify for the user to inspect.

The mock's shortened composer represents the existing expanding comment pattern;
do not replace rich comments or drop their formatting/attachment capabilities.
