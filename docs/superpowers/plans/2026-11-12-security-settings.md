# Security and Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Falcon Security and Login a compact, readable settings page with focused credential and session actions.

**Architecture:** Keep server-owned authentication and existing administration ports. Render factual account/security rows and reveal the existing password and session flows on demand. Key the managed surface by workspace and subject; never expose credentials or fabricate capabilities.

**Tech Stack:** Existing React, HeroUI Modal/Button, Lucide, Falcon theme tokens and generated API types. No new dependency.

**Spec:** The user's Security and Login request and the following scoped design decisions.

## Global Constraints

- ≤200 physical lines per handwritten TypeScript/TSX file; ≤2 code files per directory.
- Flat rows, restrained neutrals, one concise description per action, no nested cards or decorative animation.
- RU/EN, light/dark, narrow viewport, keyboard focus and reduced motion.
- Password action retains current/new/confirmation plus conditional TOTP/recovery proof; no separate pre-reauthentication.
- Google capability is availability, not connection status. No invented unlink, MFA management, location, last-active or revoke-all controls.
- Preserve legacy profile security/session links and browser Back.
- Only sample fixtures may receive test credential/revocation requests; no customer security changes.

## Review Focus

- Switching workspace/subject must discard prior identity data and form secrets.
- Pending credential submission must not be silently dismissed or double-submitted.
- Closing and reopening password must clear every secret.
- Google unavailable/unknown must not leave an empty section or claim it is connected.
- Current session cannot be revoked from its device row; pagination and selected revocation remain scoped.

## Design grounding

- OpenAI sessions: https://help.openai.com/en/articles/20001257-managing-active-sessions-in-chatgpt
- Dribbble compact rows: https://dribbble.com/shots/21227631-Account-Security-UX-Setting
- Pinterest public search attempted; login wall prevents inspecting pins.
- HeroUI Modal: https://v2.heroui.com/docs/components/modal
- shadcn Item reviewed for transparent row hierarchy; use existing HeroUI controls rather than adding a redundant primitive package.

### Task 1: Capture and compose focused settings

**Files:** `profile/security/composition/ManagedSecurity.tsx`, new `profile/security/presentation/*`, `profile/security/presentation/dialog/*`, `presentation/config/security/*`, `auth/google-link/{composition,presentation}/*`.

**Interfaces:** Existing `Profile`/`AdministrationPort`; `ProfilePasswordForm.onPendingChange?`; `ProfileSessions(showHeading=false)`; existing `useProfileScreen` hash navigation.

- [x] Capture exact current components in the isolated sample-data preview before UI edits.
- [x] Add behavior tests for explicit opening, identity remount, close/reopen secret clearing and hash navigation; run RED.
- [x] Implement factual email, password, MFA status, optional Google linking and sessions rows. Use focused HeroUI dialogs, pending guards and existing navigation.
- [x] Run focused tests and architecture check; expected PASS.

### Task 2: Refine existing credential and device flows

**Files:** `company-administration/presentation/profile/ProfilePasswordForm.tsx`, password CSS; `presentation/devices/ProfileSessions.tsx`, device CSS; owned test subdirectories.

**Interfaces:** Add optional `onPendingChange(pending:boolean)` to password form; preserve existing payload and shared profile route. Session confirmation calls only `revokeSession(selectedId, signal)`.

- [x] Add tests covering pending notifications, conditional MFA, mismatch with zero writes, current-session protection and explicit revoke confirmation; run RED.
- [x] Use compact, themed fields and HeroUI buttons; show actual browser/OS and creation timestamp, retain pagination/cancellation.
- [x] Run relevant profile/device/password tests; expected PASS. Update stale inline-error expectation to existing global toast contract, without weakening behavior assertions.

### Task 3: Verify and release

- [x] One batched visual review: desktop dark EN/light RU, narrow viewport, password/session dialogs, personal account, unavailable Google, keyboard and reduced motion. Fix concrete findings together, then confirm.
- [x] Independent code review; fix material regressions with tests. Preview and test-control components split to comply with one runtime component per file.
- [x] Run architecture, typecheck, managed/sign-in/auth/notification regressions, contract generation check and lint command. Correct existing history tests’ browser fixture; no production history changes. Record unrelated theme-check debt and the existing no-op lint script honestly.
- [ ] Production build and live publication evidence are recorded outside the source tree in the security release artifact folder after the source-pinned publisher runs.
- [ ] Commit reviewed changes; publish the source-pinned Pages/Worker release using established scripts; verify public release/assets. No backend or native update required for this web-only presentation change.
