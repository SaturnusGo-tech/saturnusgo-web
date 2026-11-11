# Landing themes implementation plan

**Goal:** Complete light/dark landing with fresh bilingual product evidence and a useful animated QA workflow.

**Architecture:** Use a small landing-only React context with the `falcon-landing-theme` storage key; leave the ancestor workspace `next-themes` provider and `sg-theme` preference independent. Run a pre-content document-attribute bootstrap and initialize the context in an isomorphic layout effect so both full loads and client navigation select the saved theme before paint. Restore the previous attribute on unmount. Keep theme tokens in existing stylesheets, scope document rules to the landing, and use CSS to select between both server-rendered screenshot planes. Render the new story as one bounded state sequence independent of product requests. Keep the theme provider state-only and dynamically load HeroUI theme/workflow controls after hydration, as the existing language menu does; preserve the full content in server HTML. Verify both language routes with `FALCON_LANDING_SSR_TEST_URL=http://127.0.0.1:4650 node --import tsx --test app/src/modules/core-falcon-public/landing/theme/tests/landing-http.test.ts`.

**Spec:** docs/superpowers/specs/2026-11-11-landing-themes-design.md

- [ ] Add persistent accessible theme control and theme-aware scenes, preserving locale and no duplicate header actions.
- [ ] Adapt all existing landing surfaces, menus, pricing and footer for light/dark contrast.
- [ ] Replace the rejected principles section with a paused-offscreen prompt-to-workflow sequence, including reduced motion.
- [ ] Capture current actual product modules with isolated sample data in both languages/themes at 1728 × 1117, DPR 2. Inspect every frame and record provenance.
- [ ] Check theme persistence, scene completeness, animation visibility/pause/reduced-motion, English/Russian overflow and mobile layout.
- [ ] Capture sections from hero to footer, fix observed defects as one batch, verify and publish an isolated release.

**Review focus:** Saved light preference must not flash dark; image selection must not lag theme changes; overlays remain layered; no private company records enter public captures; animation must not restart on every scroll tick or run in hidden tabs.
