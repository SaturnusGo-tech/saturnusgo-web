# Case history and floating verification

History events use actorIdentityId and the existing private MemberAvatar loader. Legacy/system
entries without an identity retain a fallback; display names are never used as identity keys.

Verify fixes no longer reserves a bottom shell row. The fixed transparent dock passes pointer
input through to content outside its controls. X dismissal, edge-arrow restore, persisted
workspace preference, focus transfer, bulk/empty gating and reduced motion remain intact.
This supersedes the reserved-height layout in verification-launcher-2026-09-10.md.

Validation: 25 evidence/launcher tests, typecheck and architecture pass. Actual component tested
in Chromium and WebKit at desktop and 390px mobile widths, light/dark, full workspace height,
transparent fixed dock, hide/restore, focus, reload persistence, bulk/empty gating and reduced motion.
The backend release preserves test-case assets across revisions and recovers missing current links.
