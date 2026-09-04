# Design QA — intermittent empty narrative editor

## Comparison target

- Source visual truth: `.design-audit/2026-09-04-editor-empty-bug/01-production-editor-open.png` — the established, fully loaded Description editor appearance.
- Rendered implementation: `.design-audit/2026-09-04-editor-empty-bug/06-production-description-fixed.png`.
- Combined comparison input: `.design-audit/2026-09-04-editor-empty-bug/10-source-vs-final.png`.
- Viewport/state: 1280 × 720 CSS px, DPR 1, dark theme, same production route, same test case, Description edit mode.
- Pixel normalization: both inputs are 1280 × 720; no resampling or density normalization was needed. The combined image is 2560 × 720.

## Findings

No actionable P0, P1, or P2 visual differences remain.

- **Fonts and typography:** unchanged family, weights, sizes, line height, wrapping, and toolbar hierarchy. The fallback uses the surrounding editor typography and disappears after initialization.
- **Spacing and layout rhythm:** editor bounds, toolbar height, padding, actions, radius, and adjacent column alignment match the established loaded state.
- **Colors and visual tokens:** existing dark-theme surfaces, borders, foregrounds, focus color, and semantic action colors are preserved.
- **Image quality and asset fidelity:** this state contains no image asset; no logo, icon, or illustration was replaced. Existing toolbar icons remain unchanged.
- **Copy and content:** the stored Description and Preconditions values are preserved verbatim; no product copy changed.
- **States and accessibility:** the loading and initialization states are now focusable labelled textareas. The final MDX editor is exposed only after its current value has painted. No focus trap, clipped control, overlap, or console error was observed.

## Full-view comparison evidence

`10-source-vs-final.png` shows the established loaded editor and the final production editor at identical viewport, theme, route, case, and edit state. Composition and visual hierarchy remain unchanged.

## Focused comparison evidence

`09-final-fields.png` compares Description and Preconditions edit states at full readable scale. A tighter crop was unnecessary because the editor content, toolbar, focus border, and action buttons are legible at the captured resolution.

## Comparison history

1. **P0 before fix:** the client-only dynamic loading fallback was an empty non-interactive block, leaving users unable to focus or type while the editor loaded.
   - Fix: replaced it with a controlled interactive textarea and began preloading the editor module on mount.
2. **P1 after first pass:** a shorter blank interval could still occur after the JavaScript module resolved but before the MDX editor painted its value.
   - Fix: retained an interactive overlay until the MDX editor reported the expected Markdown value across two consecutive animation frames.
3. **Post-fix evidence:** Description passed 5/5 repeated opens; Preconditions passed 5/5; both new-case fields accepted immediate input; production console was clean.

## Implementation checklist

- [x] Interactive dynamic-loading fallback.
- [x] Interactive MDX-initialization overlay.
- [x] Preserve value, placeholder, focus, spellcheck, and change handling.
- [x] Existing-case Description and Preconditions regression checks.
- [x] New-case Description and Preconditions regression checks.
- [x] Production deployment and console verification.

final result: passed
