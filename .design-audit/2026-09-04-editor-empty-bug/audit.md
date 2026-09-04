# Narrative editor intermittent empty-state audit

Production route: `https://tms.saturnusgo.com/testcases/umbrella-home/work/?projectId=project_59c48ce2121f461c8e604f35a9706aa3&caseId=case_d62261668d5f423b8887043f0bc990eb`

Viewport: 1280 × 720 CSS px, device scale factor 1, dark theme.

## Walkthrough

1. **Existing test case → Description → Edit — needs work (before fix).** The editor was loaded through a client-only dynamic boundary whose fallback was an empty, `aria-hidden` block. During a slow module load or MDX initialization, the edit surface therefore had no focusable field and no visible value; only Cancel and Apply remained usable.
2. **Existing test case → Description → Edit — healthy (after fix).** The existing value is visible immediately through an interactive textarea fallback, the field accepts focus and typing, and the full editor replaces it only after the MDX value has painted. Repeated 5 times without an empty or non-interactive state.
3. **Existing test case → Preconditions → Edit — healthy.** The same transition and focus checks passed 5 times. The original preconditions remained visible and editable.
4. **New test case → Description and Preconditions — healthy.** Both empty fields accepted input immediately before the rich editor became ready. The creation flow was cancelled, so no production data was created.

## Interaction and accessibility checks

- Loading and initialization fallbacks are real labelled textareas, not decorative placeholders.
- The fallback preserves the current value, placeholder, autofocus request, spellcheck state, and `onChange` path.
- The rich editor is revealed only after two consecutive animation frames confirm the expected Markdown value, preventing a transient empty paint.
- Cancel/Apply behavior and the final rich-editor toolbar are unchanged.
- Production console after existing-case and new-case checks: no errors.

## Evidence

- Stable source-state capture: `01-production-editor-open.png` (1280 × 720).
- Final Description capture: `06-production-description-fixed.png` (1280 × 720).
- Final Preconditions capture: `07-production-preconditions-fixed.png` (1280 × 720).
- Side-by-side source/final comparison: `10-source-vs-final.png` (2560 × 720).
- Final field-state comparison: `09-final-fields.png` (2560 × 720).

Screenshots cannot prove sub-frame timing by themselves; the timing conclusion is supported by the captured pre-fix DOM state and the repeated focus/type checks above.

