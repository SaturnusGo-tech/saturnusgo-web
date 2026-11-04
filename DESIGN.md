---
name: Falcon Public Marketing
description: Product-led dark marketing surface for Falcon QA.
colors:
  landing-bg: "#08090a"
  landing-text: "#f7f8f8"
  landing-muted: "#a0a1a8"
  landing-line: "#26272c"
  falcon-border: "#303136"
  falcon-on-action: "#101112"
  falcon-control: "#161719"
  falcon-panel: "#141517"
  primary-hover: "#dfe0e5"
  secondary-border: "#38393e"
  secondary-hover: "#232429"
  focus: "#d8d9df"
typography:
  display:
    fontFamily: "var(--font-geist-sans), Arial, sans-serif"
    fontSize: "clamp(46px, 5.15vw, 76px)"
    fontWeight: 500
    lineHeight: 1.07
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "var(--font-geist-sans), Arial, sans-serif"
    fontSize: "clamp(34px, 4vw, 54px)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "var(--font-geist-sans), Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.02em"
  body:
    fontFamily: "var(--font-geist-sans), Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  detail:
    fontFamily: "var(--font-geist-sans), Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "var(--font-geist-sans), Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  navigation:
    fontFamily: "var(--font-geist-sans), Arial, sans-serif"
    fontSize: "13px"
rounded:
  field: "6px"
  compact: "8px"
  scene: "12px"
  pill: "999px"
spacing:
  control-gap: "10px"
  compact-gap: "20px"
  detail-inset: "24px"
  gutter: "40px"
  scene-gap: "64px"
components:
  button-primary:
    backgroundColor: "{colors.landing-text}"
    textColor: "{colors.falcon-on-action}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 19px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.falcon-panel}"
    textColor: "{colors.landing-text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 19px"
  button-secondary-hover:
    backgroundColor: "{colors.secondary-hover}"
  navigation-primary:
    backgroundColor: "{colors.landing-text}"
    textColor: "{colors.falcon-on-action}"
    typography: "{typography.navigation}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
  demo-field:
    backgroundColor: "{colors.falcon-control}"
    textColor: "{colors.landing-text}"
    rounded: "{rounded.field}"
    padding: "15px 16px"
  demo-submit:
    backgroundColor: "{colors.landing-text}"
    textColor: "{colors.falcon-on-action}"
    typography: "{typography.label}"
    rounded: "{rounded.field}"
    padding: "15px 18px"
  product-frame:
    rounded: "{rounded.scene}"
---

# Design System: Falcon Public Marketing

## Overview

**Creative North Star: "The Quality Workspace"**

Falcon's accepted marketing world pairs a near-black canvas with off-white type, quiet graphite rules and precise Geist typography. Spacious chapters let current product screens explain coverage, execution and connected tools. Original silver isometric illustrations support the story without competing with the product.

**Scope:** this document governs the public marketing direction implemented by `app/src/modules/core-falcon-public/direction/FalconDirection.tsx`, including its embedded demo form. It does not prescribe colors, density, layout or controls for authenticated TMS, authentication, administration or documentation readers. Those surfaces retain their own references and module systems. Product screens shown here are evidence, not a new theme for the application.

**Key Characteristics:**

- Monochrome contrast and restrained controls.
- Large left-aligned headings with compact navigation.
- Current product captures, layered with shallow perspective.
- Content remains readable when motion is paused or reduced.

## Colors

### Primary

**Off-white** (`landing-text`) carries headings, body emphasis and primary actions. **Ink** (`falcon-on-action`) provides contrast inside those actions. Primary hover softly dims the off-white.

### Neutral

**Near-black** (`landing-bg`) is the continuous page canvas. **Muted silver** (`landing-muted`) supports secondary copy. **Graphite** (`landing-line`, `falcon-border`, `secondary-border`) separates chapters and controls. **Panel** and **control** tones distinguish the secondary action and demo field without introducing a bright card surface. The focus tone stays visible on dark backgrounds.

**The Product Evidence Rule.** Keep the marketing chrome monochrome; preserve meaningful semantic colors inside the actual product captures.

## Typography

Self-hosted **Geist Sans**, with Arial and sans-serif fallbacks, serves every marketing role. Medium-weight headings use tight tracking and compact line height; paragraphs are quieter and more open. The frontmatter records the desktop hierarchy from the implemented styles, rather than an invented type scale.

Display is reserved for the hero; headline for product chapters; title for principles; body for introductions; detail for supporting explanations. Chapter prose is constrained to 43ch, detail prose to 34ch and principle copy to 31ch. At the mobile breakpoint, the hero uses `clamp(38px, 7.7vw, 58px)`, chapter headings use 38px and main copy generally uses 15px.

## Layout

The main frame is capped at 1280px with 40px horizontal gutters, yielding a 1200px content measure. Navigation is 72px tall. The hero starts with generous whitespace; subsequent chapters use fine top rules and broad vertical intervals. Chapter headings pair a 1.2fr title column with a 1fr copy column; principles and supporting details use three columns.

At 1000px and below, gaps and scene heights tighten. At 760px and below, gutters become 20px, navigation becomes 64px tall with a menu, chapters and details become single columns, and scenes use clipped wide image planes. The demo form stacks its input and submit action at 1000px and its two main columns at 680px. These are marketing-specific breakpoints.

## Elevation & Depth

Ordinary content stays flat, separated by space, rules and tonal contrast. Depth belongs to the product scene: a 1400px perspective, lightly rotated frames, a lower fade and broad dark shadows make real screens readable as a connected workflow. The sticky navigation uses a translucent near-black background and 18px backdrop blur. Exact shadow and motion values live in the sidecar.

**The Evidence Depth Rule.** Use elevated framing for product evidence; keep surrounding prose and sections on the continuous canvas.

## Shapes

Primary and secondary navigation actions are pills. Demo input and submit controls have small, matching corners. Product frames have softer corners that reduce on mobile. Principles remain open columns divided by rules rather than enclosed cards. The existing linear Falcon mark remains the identity asset.

## Components

### Buttons and text links

Primary actions use off-white on ink; secondary actions use a dark panel with a fine graphite stroke. Both have a 42px minimum height. Navigation primary actions tighten to 35px minimum height and 13px type; the mobile variant is 34px tall. Hover changes background over 180ms. Inline workflow and documentation links remain lightweight, with a small arrow translating 3px on hover.

All page links, buttons and fields receive a visible 2px focus outline with 4px offset. Preserve actual component error and busy states when reusing the demo form.

### Navigation

Keep the Falcon mark and name left, product anchors central/right, and language, Docs and Open app actions grouped at the end. Mobile navigation exposes the same destinations through the menu. **Open app leads to the web login** (`/cloud-login/?lang=…`). Desktop downloads belong only in the authenticated profile. Public Docs is a readable, text-only guide; it is available before sign-in.

### Product scenes and illustrations

Use current captures from the isolated demonstration workspace and retain their readable interface detail. Layer main and overlay frames with the existing masks and restrained perspective. The silver isometric illustrations remain secondary to product evidence; keep their provenance with the shipping assets.

### Demo field

The email field uses a dark control fill, fine border, 15px text and compact corners; its submit button shares the shape. Keep the visible label, consent, validation, pending and result states. The form's module owns its semantic error/focus tokens; do not convert that behavior into a new global marketing palette.

### Motion

The hero settles once over 1.3s. The integration marquee loops linearly over 48s and offers an explicit pause/resume control. Reduced motion disables animations and transitions, makes the logo strip scrollable and removes duplicate decorative logos. Content must not depend on animation completion.

## Do's and Don'ts

### Do:

- Do preserve the current linear Falcon mark, Geist typography and monochrome marketing chrome.
- Do use current product captures and original silver illustrations with asset provenance.
- Do keep Open app pointed at web login, desktop downloads in the authenticated profile and public Docs readable without sign-in.
- Do preserve keyboard focus, marquee pause and reduced-motion behavior.

### Don't:

- Don't apply this marketing token set to authenticated TMS, authentication, administration or documentation-reader interfaces.
- Don't replace product evidence with generic SaaS cards or introduce decorative color into the marketing chrome.
- Don't make the content depend on animation or invent product capabilities in illustrative screens.
