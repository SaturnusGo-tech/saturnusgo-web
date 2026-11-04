# QA profile and achievements implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the rejected profile with the approved GitHub-inspired composition, connect all 40 approved artworks to authoritative achievement progress, and introduce gamification on the public landing.

**Architecture:** Preserve Falcon's self-profile, private media, audit and notification boundaries. Server projections own counts and awards; React owns localized presentation and immutable async state. Static achievement art is shared by the private profile and public marketing, with no public identity data.

**Tech Stack:** Existing Next.js/React/TypeScript, Fastify/PostgreSQL, existing Markdown editor and Electron notification permissions.

**Spec:** /Users/mercuryrucks/.codex/attachments/a01e9926-6b09-4e16-84a1-881d12d6a12e/Pasted text.txt. Approved visual: Screenshot 2026-11-05 at 1.16.46 AM.png. Approved assets: /Users/mercuryrucks/Desktop/SaturnusGo-Universe/output/falcon-achievements-review-20261105/catalog.json.

## Global constraints

- Use the existing isolated frontend/backend worktrees on codex/falcon-sign-in-20261104; preserve unrelated work.
- No banner, location, duplicate achievement collection, popular repositories or account/security controls in the new profile.
- Square portrait left; About right; one achievement collection below portrait; calendar below About; real smooth charts below, always visible.
- Existing product tokens govern the app; #181818 content and #212121 surface in dark mode. Existing marketing design governs the landing.
- All 40 awards use approved artwork. Locked art is slightly blurred with a gold lock; requirements remain readable.
- Missing historical evidence never earns an achievement. No fabricated QA score, label-based classifications, agent credit or repeated-click inflation.
- Scope every read/write by human identity and active workspace membership. Durable awards and notification fanout are idempotent.
- First historical backfill is silent. New awards notify their owner in the inbox and by email; desktop notifications use existing trusted browser permissions.
- User performs manual UI acceptance. Run focused behavior, architecture, generated-contract and production-build checks, not extended browser QA.

## Review focus

1. A leap-year calendar has 366 days, predictable UTC grouping and no run double-count in intensity.
2. Switching account/workspace/year cannot display another identity's stale response.
3. Concurrent/retried evaluation cannot award twice or fan out duplicate notifications.
4. An empty personal profile can edit name/photo/About and access separate security settings.
5. Unsupported conditions stay honestly locked; public art never exposes private activity.

### Task 1: Server projections and award ledger

**Owner:** achievement_backend agent, backend worktree.
**Files:** activity self-profile vertical modules, new achievement vertical module/migration, notification delivery adapters, OpenAPI and owned tests.
**Interfaces:** Extend GET /me/profile/activity with year=YYYY exclusive with days; retain legacy days mode. GET /me/profile/achievements?workspaceId returns catalogVersion:1, items [{id:1..40,slug,progress,target,status,earnedAt,evidenceCount,tracking}].

- [x] Write failing rule/calendar/isolation/idempotency tests, then implement domain rules, tenant projection, durable ledger and notification fanout.
- [x] Add owned HTTP/SQL tests for year bounds, active human membership, wrong identity, retry/concurrent evaluation, silent backfill and unsupported facts.
- [x] Update checked OpenAPI; run backend typecheck, architecture, lint, contract/migration tests, integration tests and build. Record evidence/limitations.

### Task 2: Profile UI and generated transport

**Owner:** profile_frontend agent; root synchronizes checked generated transport.
**Files:** profile/self composition, identity, About, calendar, activity charts, achievement catalog/detail and resource hooks.
**Consumes:** Task 1 exact response; approved static artwork at /falcon/achievements/<file>.webp.

- [x] Write resource/calendar tests for leap year, zero days, stale cancellation and achievement status; implement the approved composition and existing Markdown edit/save semantics.
- [x] Implement accessible detail dialog, in-place collection expansion, locked treatment, precise day hover/focus detail, keyboard year control, truthful loading/error/empty states and reduced motion.
- [x] Keep photo/name editing, private media renewal and optimistic conflict handling; remove banner and account tabs.
- [x] Run owned data/state tests, typecheck and app architecture checks.

### Task 3: Assets, security separation and desktop notifications

**Owner:** root.
**Files:** public/falcon/achievements, asset manifest, profile/composition/WorkspaceProfile.tsx, config settings navigation/security composition, gateway personal-route allowlist, notification presentation.

- [x] Transcode approved originals losslessly in meaning to efficient WebP, retain original hashes and provenance.
- [x] Add Security and login setting using existing authenticated Google/password/session surfaces; preserve old deep links while keeping profile clean. Test personal/managed routing.
- [x] Allow only the exact new read endpoint through the personal gateway; assert all other /me routes remain denied.
- [x] Use owner inbox award ID for desktop toast dedupe through trusted Notification API; no privileged remote bridge. Test dedupe and unavailable/denied permission behavior.

### Task 4: Public landing chapter

**Owner:** achievement_landing agent.
**Files:** core-falcon-public/direction/achievements and FalconDirection.tsx.

- [x] Compose 7 approved overlapping badge images in the accepted marketing world, bilingual concise copy and Open app CTA. Preserve all other chapters and routes.
- [x] Ensure responsive/reduced-motion/accessibility semantics and no private network calls; run relevant tests/typecheck.

### Task 5: Integration and release

**Owner:** root plus one fresh reviewer.

- [x] Synchronize generated API from checked OpenAPI; run backend/frontend gates and critical cross-tenant/dedupe tests.
- [x] Review complete patch for contract, attribution, persistence, notification and reference-composition gaps; fix material findings in one batch.
- [x] Run mechanical UI detector once on changed files and triage actual findings. Manual visual acceptance remains the user's.
- [ ] Publish using existing release procedures only after required checks pass, verify deployed source/version and authenticated route behavior without modifying user data; retain release receipt. If release cannot be verified, report the concrete blocker without claiming deployment.
