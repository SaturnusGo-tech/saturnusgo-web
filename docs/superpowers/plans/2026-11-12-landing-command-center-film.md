# Landing Command Center Film Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Show the approved film within the complete local Falcon landing for review before production.

**Architecture:** Package the existing React/SVG film as a same-origin static iframe to isolate its global styles. A small landing component controls visibility/replay and synchronizes locale/theme using an origin-checked message bridge.

**Tech Stack:** Next.js 14, React 18, existing esbuild film build, IntersectionObserver, postMessage.

**Spec:** `docs/superpowers/specs/2026-11-12-landing-command-center-film.md`

## Global Constraints

- Preserve the approved film; no redesign or new factual claims.
- English/Russian and light/dark remain in sync with the landing.
- Hide review controls; defer loading; stop offscreen animation.
- No production deployment in this iteration.

## Review Focus

- Theme/language changes must not reload the iframe or reset playback.
- Messages must be scoped to the correct origin and iframe window.
- Offscreen/focus transitions must pause and replay predictably.
- Small screens must scale the full desktop composition without horizontal page overflow.
- Reduced motion must not run the animation clock.

---

### Task 1: Package approved runtime

**Files:** Prototype embed bridge/build; `public/falcon/landing/command-center-film/`.

**Interfaces:** Child receives `falcon-film:update` with theme, locale, active, optional restart/reducedMotion; emits `falcon-film:ready`.

- [x] Add an origin-checked embed bridge and cover its lifecycle behavior.
- [x] Build only runtime code, styles, fonts, logos, texture and licenses; exclude reference video, maps and review assets.
- [x] Verify standalone preview remains intact and embed controls are absent.

### Task 2: Place film in landing

**Files:** `direction/command-center-film/CommandCenterFilm.tsx`, its CSS module; `FalconDirection.tsx`.

**Interfaces:** `CommandCenterFilm({locale, theme, ready})` consumes the existing landing preferences from `FalconDirection`; renders section `#connected-work`.

- [x] Add deferred iframe mount and source/origin checked synchronization.
- [x] Add viewport/focus replay and reduced-motion support; remove old ChangeStory invocation.
- [x] Run type checks and targeted lifecycle tests.

### Task 3: Verify complete dev landing

**Files:** Local QA captures and validation notes.

- [x] Start local Next dev server and inspect the actual landing, hero through footer.
- [x] Check desktop/mobile, both themes/languages, theme changes during playback and offscreen replay.
- [x] Fix material issues in one batch, confirm, and provide the complete landing URL and a contextual screenshot.
