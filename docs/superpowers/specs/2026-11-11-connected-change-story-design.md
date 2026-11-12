# Connected Web QA story — local prototype

Owner steering 11 November 2026, 14:09 replaces the generic Falcon writing demo.

The input asks Codex to find Umbrella coverage and check the actual Umbrella Home site. A continuous camera follows context → six prepared test cases → a linked seven-node QA guide → an illustrated Web QA canvas showing a browser action, a three-row check table and linked evidence → Codex × Falcon.

50-second, visibility-aware, replayable presentation. No pause or reset controls. Returning after the scene fully leaves view, or after tab/window focus is lost, restarts the presentation from the prompt once it is visible again. Minor scrolls within the scene do not restart it; the ending holds until the next visit. Reduced-motion fallback remains static. The final brand row has no subtitle. White compact nodes in light; dark nodes use the borderless, translucent Codex composer material. Existing story artifacts retain 24px corners and soft offset shadows. Native React Flow handles and colored complete connectors remain.

The current browser chapter is an illustration with no video or live iframe, network request or form submission. The earlier recorded-media version is superseded by the replacement below. For that earlier local evidence gathering, the owner authorised an early-access test using a supplied business email. The application and its idempotent retry received the page’s acknowledgement and email-confirmation message; email delivery is not asserted. Public assets contain no owner email; the typed example is qa@example.com. Case and guide contents are illustrative preparations, not fabricated Falcon run evidence.

The six prepared checks cover section navigation, language, scroll/3D, FAQ, email/consent, and application response. The real browser checks and captures are kept in the QA evidence directory. No production deploy in this iteration.

## Illustrated Web QA replacement — 11 November

The owner rejected the fourth chapter’s accelerated screencast and supplied a Miro Flows reference: `/var/folders/m4/ss0ghsrd5dl5chxys5v0rgqm0000gn/T/codex-clipboard-7d3133d2-138e-4d16-b0fe-2cdc657a0974.png`. The finished local extension replaces only that chapter (22–44 seconds), preserving the input, context map, cases, guide, final Codex × Falcon and replay-on-return behavior.

The visual target is the supplied light dotted canvas with connected UI artifacts, coloured collaborator cursors and restrained depth. Adapt its visual grammar to Falcon: an Umbrella browser/form artifact at left, a compact check table at upper right, and an evidence/report artifact below it. The canvas itself has no enclosing panel. Surfaces use white in light mode and the existing borderless graphite composer material in dark mode; colour belongs to agent cursors, connection lines and check state.

Motion thesis: the cursor’s action causes a visible check transition, which produces a linked artifact. The browser does not race through a whole page. A header action completes navigation, the illustrated email/consent state completes the form check, and illustrated submission creates a confirmation linked to the report. The memoized component takes its phases and camera movement from the existing shared MotionValue; it introduces no independent timer. Returning to the scene resets the entire illustration atomically. No native video, backend request, live form submission or asynchronous media gate is used. Static reduced-motion content shows the coherent connected result. The visible caption and accessible description explicitly identify a workflow illustration rather than live execution evidence.

Use existing React/Framer Motion and real brand assets. No new library is required. Desktop presents the complete connected board. On phones, a camera visits the same artifacts inside a stable 600px viewport so each phase can be read before the full board returns:

| Story time | Phone reading hold |
| --- | --- |
| 22–31.5s | Browser and example form |
| 33.8–36s | Three-row check table |
| 38.4–41s | Linked evidence/report |
| From 42.3s | Full connected overview before the finale |

Camera travel joins the holds; the board is not replaced by separate phone slides. Reduced motion bypasses the camera and shows the whole completed result.

Light success text uses the scoped ink `#256c55`, with local contrast measurements of 5.41:1 on the status badge and 6.26:1 for the confirmation. Mint connectors, ports and cursors remain unchanged. Falcon typography, theme tokens, composer materials and real brand assets remain the existing system; this chapter does not introduce a global visual system change.

Local handoff evidence, 11 November: the independent visual reviewer returned **SHIP** after the phone reading holds and light success contrast fixes. The comparison retained the owner reference's open dotted canvas, connected artifact hierarchy, sparse labels, collaborator pointers and shallow offset shadows. Desktop light/dark, phone phases, connected result, motion boundaries and replay were reviewed for the local handoff. Production is not authorized in this iteration.

Final captures are local in `.impeccable/review/webqa/`; all use DPR 1. The scoped QA report is `.impeccable/review/webqa/design-qa.md`.

| Capture | Shared-clock time | Viewport |
| --- | --- | --- |
| `desktop-light-final.png` | 41,391ms | 1728×1117 |
| `desktop-dark-result.png` | 40,413ms | 1728×1117 |
| `mobile-browser-final.png` | 24,925ms | 390×844 |
| `mobile-checks.png` | 34,481ms | 390×844 |
| `mobile-report-final.png` | 41,091ms | 390×844 |
| `mobile-overview-final.png` | 42,758ms | 390×844 |


## Final fourth-chapter motion refinement, v2

The 11 November follow-up retains the approved local illustration rather than redesigning the story. Browser/check/cursor actions use a shared 1.25× action clock; six checks finish at about 32.1s. Browser content scrolls, shows required/invalid/valid email feedback, records consent and transitions into a faceless confirmation page. That confirmation becomes the report thumbnail. A compact report is visible from 32.2s before expanding; native ports remain independent of its paper transform.

Desktop and phone both pull back before travelling to checks (33.2–34.9s), then the report (36.5–39.1s), returning to the whole board from 40.2s. Other chapters, the ending, focus-return replay and reduced motion remain unchanged. Full typechecks and nine clock tests pass; independent final visual review says SHIP for local review. See `.impeccable/review/webqa/design-qa.md` for captures and limits. No production publication is authorized yet.
