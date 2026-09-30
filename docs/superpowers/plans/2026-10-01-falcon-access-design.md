# Falcon access design implementation plan

**Goal:** Apply the selected sign-in composition and password-change form to the existing managed Falcon access flow.

**Architecture:** Keep the managed authentication hook, API and server-controlled stages intact. Put the form and localized hero in a responsive shared presentation layout. Reuse one text-free wing image on every stage; all copy remains accessible HTML.

**Visual specification:** Sign-in uses displayed option 2 (`exec-6f46a2d2-6cc1-4015-add6-52de07142502.png`). Password change uses option 3's form (`exec-5db13e54-4768-4a04-937f-43c63691b78e.png`) with the same wing from option 2, per the user's final correction.

**Constraints:** Neutral light form and black hero, Geist Sans, supplied Falcon mark, no social authentication. Preserve username/email, first-password validation, MFA and recovery codes. No decorative nonfunctional remember-me checkbox: the API already uses persistent sessions and has no such option. Forgot-password help uses the existing company administrator contact. Profile password controls retain their existing styles and authorization requirements.

## Tasks

- [x] Prepare and optimize the generated text-free wing asset for the shared hero.
- [x] Update `ManagedAccessScreen`, its localized copy and scoped styles; polish `LoginForm`, `FirstPasswordForm` and optional icons in `AccessField`.
- [x] Verify existing managed/auth tests and TypeScript. Check loading, error, MFA and recovery stages retain their controls.
- [x] Run a local-only API fixture proxy to render the real `/admin/` page, verify sign-in and password stages in EN/RU at desktop, laptop and mobile sizes.
- [x] Compare browser captures with both selected references, resolve visual defects, record `design-qa.md`, and leave a working preview open.

## Review focus

Long Russian headings; narrow or short viewports; inherited dark theme; repeated submission and password mismatch; shared AccessField usage outside authentication.
