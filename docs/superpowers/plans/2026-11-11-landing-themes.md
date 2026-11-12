# Landing themes implementation plan

**Goal:** Complete light/dark landing with fresh bilingual product evidence.

**Architecture:** Scope next-themes to the public landing with a separate storage key. Keep theme tokens in existing stylesheets and select versioned product assets by theme.

**Spec:** docs/superpowers/specs/2026-11-11-landing-themes-design.md

- [ ] Add persistent accessible theme control and theme-aware scenes, preserving locale and no duplicate header actions.
- [ ] Adapt all existing landing surfaces, menus, pricing and footer for light/dark contrast.
- [x] Remove the rejected principles section and the entire cancelled replacement workflow animation; leave no placeholder or reserved gap.
- [ ] Capture current actual product modules with isolated sample data in both languages/themes at 1728 × 1117, DPR 2. Inspect every frame and record provenance.
- [ ] Check theme persistence, scene completeness, animation visibility/pause/reduced-motion, English/Russian overflow and mobile layout.
- [ ] Capture sections from hero to footer, fix observed defects as one batch, verify and publish an isolated release.

**Review focus:** Saved light preference must not flash dark; image selection must not lag theme changes; overlays remain layered; no private company records enter public captures; integration logo motion must not restart on every scroll tick or run in hidden tabs.
