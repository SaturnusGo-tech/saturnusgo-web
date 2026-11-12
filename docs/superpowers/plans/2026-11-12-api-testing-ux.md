# Falcon API Testing UX

**Goal:** Fix the production execution affordance, clean API connection settings with existing Hero UI, and remove the redundant desktop Help action.

**Direction:** Keep Falcon's compact settings vocabulary. API connections are a flat list with one Connect API action; the editor uses Hero UI fields and progressive disclosure for document access and project scope. Request-server selection and native Swagger authorization remain visible. Native Try it out permits editing, while Execute requires an explicitly selected allowed destination. No request runs automatically.

**Implementation:** Three independent tasks in the existing isolated production-source worktree: public documentation header, API source settings, Swagger execution. Preserve backend contracts, encrypted specification credentials, permissions, request-origin restrictions and memory-only operation credentials. No backend or desktop binary change is expected.

- [x] Regress desktop/browser/SSR Help action visibility.
- [x] Regress server selection, Swagger editing/execution, authorization and credential isolation; preserve OpenAPI 3 and Swagger 2 server resolution.
- [x] Replace legacy connection fields/list actions with Hero UI; preserve create/edit/duplicate/project/disabled/loading behavior and smooth reduced-motion-aware disclosure.
- [x] Update English/Russian help steps for the visible server and native Authorize/Try it out/Execute flow.
- [x] Inspect actual components in local browser: dark/light, EN/RU, narrow viewport, input/disclosure states and a real harmless GET response.
- [x] Run focused tests, typecheck and architecture; independent code review.
- [ ] Build and publish the reviewed frontend via the established Pages release path and verify production release and assets.

**Review focus:** Editing credentials must not reveal saved secrets. Changing API/server must not retain another target's authorization. Request cookies stay omitted. No automatic request or production endpoint selection. Dropdowns must be opaque and fields must avoid nested square backgrounds. Do not modify customer connections during visual verification.

**Verification evidence:** 37 focused tests passed; typecheck passed; architecture checker passed (2489 files). Actual local browser cycle: explicit public HTTPS server selection, demonstration Bearer authorization, Try it out, Execute, HTTP 200 with response body and request duration. Dark/light, EN/RU, a 390px viewport, opaque selectors and field labels were inspected. Customer connections were not changed. Independent review identified hidden mounted disclosure fields retaining keyboard focus; an inert/aria-hidden wrapper fixes this for normal and reduced motion, with a failing-then-passing regression test.

**Design check triage:** the detector's type-ramp/radius advisories compare authenticated compact settings against the landing-page DESIGN.md and are left as intentional application typography/geometry; no suppression was added. The literal dropdown shadow was replaced with the existing Falcon popover-shadow token. Light controls use the existing selected-surface token so they remain visible on a white canvas.
