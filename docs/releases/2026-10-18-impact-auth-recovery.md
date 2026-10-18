# Falcon session restoration and optional impact AI

The managed company boundary renders the shared loading screen while entrypoint/session checks run. It opens authorization only after a verified anonymous or restricted session; mandatory password changes and MFA remain enforced.

Impact review handles a rejected version precondition by fetching the current analysis once and requesting a new human decision. It never automatically replays approval or scope changes. Polling reads cannot overwrite an active write; unresolved accepted operations retain their original idempotency identity.

Review lists, recommendations, scope, coverage gaps and the add-test picker display ten entries per page. Search covers the loaded collection and never edits the stored selection. Gap acknowledgement text remains above paginated row state, so changing pages or filters preserves it. Related file lists start collapsed and action groups wrap within their section.

## Optional AI

`FALCON_IMPACT_AI_ENABLED` is a server switch, defaulting to true for backward compatibility. The intended production value for this release is false, as requested. The current value is projected onto analysis detail and list envelopes, including empty lists and historical results. The UI uses this server value for its illustrated status banner and AI actions.

With AI paused, deterministic recommendations, manual drafts, scope review and stored analyses remain available. AI drafting is rejected before enqueueing; an already queued AI draft ends without calling a model. Existing QA approval/build gates remain enforced. No paid provider usage is enabled.

When AI is enabled later, a budget denial uses the real UTC reset of the exhausted minute/day/month window. Deferrals do not consume failure attempts. Scheduled waits prevent repeated inference attempts and analysis version churn before the reset.

The former configured free model was retired. A compatible free model with JSON-schema output was verified using synthetic data at cost zero, but provider capacity was intermittent. This release pauses AI rather than promising free-provider availability. Existing free-only and retention safeguards remain intact.

No database migration is introduced; schema compatibility remains 0070. Backend provenance, test logs, frozen artifacts and deployment evidence are retained under `output/falcon-impact-auth-fix-20261018` in the workspace.

## Verification

Managed auth 32/32; auth transport/navigation 58/58; impact 31/31; scoped Pages deployment 12/12. Typecheck and architecture checks pass. Browser checks used the real review components inside ConnectorChrome with 127 cases and 14 gaps: search, pagination, preserved acknowledgement text, disabled AI/manual actions, and a 390px layout without horizontal document overflow or overlapping sibling buttons. Backend has separate PostgreSQL and release gates.

## Image provenance

Asset: `public/falcon/impact/ai-paused-20261018.webp` (480×320, transparent, 26,262 bytes). Created with the built-in imagegen tool, then encoded for the web. Original output remains in the Codex generated-images folder, exec-a5b3703b-7764-4f9d-82b4-1343964d34bb.png.

Prompt: “Use case: product-mockup. Asset type: a small premium editorial illustration for a Falcon software status banner, indicating that AI analysis is temporarily resting while all existing work is safely preserved. Primary request: a delicately curved silver-white feather resting lightly beside a single open frosted-glass ring, suggesting a paused connection. Photoreal studio still life, carefully crafted natural feather barbs, restrained satin silver and charcoal materials, soft neutral lighting, subtle realistic contact shadow, no blue or purple, no bright colors. Composition: isolated complete objects centered with generous clear space around them, horizontally balanced, designed to remain legible at only 180 pixels wide. Genuine transparent background. No letters, text, logos, UI, robots, brains, sparkle effects or watermarks. Calm, minimal, refined; suitable for both black and white application themes.”
