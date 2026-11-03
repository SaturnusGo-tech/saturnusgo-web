# Falcon QA customization

## Intent and authority

Extend the existing Falcon UI with the folder customization shown in the user's two references, emoji insertion, and less intrusive run controls. Preserve existing neutral light/dark tokens, typography, folder hierarchy, immutable case revisions and run snapshots. The user delegated placement and implementation choices and confirmed a persistent “На доработке” star on the source case plus a repository filter.

## Chosen design

- One folder renderer everywhere: 22px artwork in a fixed 26px box. Default folder retains its existing identity/open state. An icon, native emoji or private image occupies the same box without stretching rows. Generic project/category icons are not repository folder identities.
- Clicking folder artwork in the repository or folder architecture opens an anchored, keyboard accessible picker. Existing folder actions also expose customization. Runs show customization read-only.
- Three tabs: Icons, Emojis, Upload. Icons start with the selected default folder, use an explicit Phosphor catalog from the existing dependency, and support palette/HEX/continuous color selection. Use React Colorful, not a newly written color engine. Use Emoji Mart with lazy local data/native rendering and RU/EN labels. Do not fetch emoji data from a third party when a user opens the picker.
- Choices autosave. Color previews update locally during drag and persist after the gesture; rapid selections serialize/coalesce and cannot overwrite a later choice. A failed request retains the last confirmed appearance and exposes retry; do not claim success before server confirmation. There is no Save button.
- Upload PNG/JPEG/WebP/AVIF/GIF and normalize other accepted still images, including actual HEIC decoding. Private folder-scoped storage, stable asset IDs, authorized expiring reads; never persist signed URLs. GIF remains animated and is not run through the static avatar converter. Unsupported/corrupt/oversized images show an actionable error and leave the prior appearance intact.
- Emoji control immediately left of the paperclip in editable text composers. Insert at the last caret/selection, preserve surrounding markdown and undo behavior, restore focus. Shared picker supports folder use and composers without coupling folder data to editors.
- Run outcomes keep the same labels, policy and semantic green/red/orange; use subdued fills, semantic text/icons and restrained hover instead of saturated blocks.
- Run history moves from the permanent full-width content block to a History icon in the header byline. Opening shows a compact bounded scroll area with existing attempt/step filters and paginated records; an empty history never occupies the case content. Preserve author provenance, pagination, loading/retry and stale-response protection.
- Long run-list case titles use overflow-only hover/focus marquee, with reduced-motion fallback and no native/custom title tooltip. Ordinary repository titles do not marquee.
- “Отправить на доработку” flags the current source case, with golden star and “На доработке” in its header and a repository filter. Store actor/time/source run/item/attempt/revision and optional note. Explicitly clear after repair. This does not change Draft/Ready/Deprecated, Pass/Fail/Blocked or pinned historical content.

## Persistence and boundaries

Current frontend source is 913f4d47; current backend is 14a693c, schema 0077. Both are isolated worktrees on codex/falcon-qa-customization-20261104. Backend is the source of truth; extend OpenAPI and regenerate the frontend transport types. No browser-only folder customization or maintenance state.

Folder appearance is nullable or `{kind: icon, iconId, color}`, `{kind: emoji, emoji}`, `{kind: image, assetId}`. Extend the existing ETag/idempotent scoped PATCH. Dedicated repository_folder attachment ownership preserves existing upload intent/PUT/finalize/read flow and authorization. Replaced/abandoned ready images need bounded orphan cleanup; referenced images cannot be deleted; archive/restore retains artwork. HEIC normalization is transient before ordinary immutable upload identity is established.

Case maintenance is a separate current-case projection and command with optimistic concurrency, idempotency, audit and tenant scope. It must be visible beside pinned run snapshots without rewriting them. Filter is supported server-side as well as in current repository state.

Use additive migrations, preserve existing data and old checksums, test real PostgreSQL behavior. Schema readiness currently accepts 0077 only; publication requires a tested compatibility bridge for both APIs and notification consumers before applying new migrations. A migration file existing locally is not permission to run unverified changes in production.

## Alternatives considered

- Local-only customization was rejected because teammates and other screens would disagree.
- Reusing Draft as maintenance status was rejected by the user's requested independent mark/filter and would conflate content lifecycle with feedback.
- Project-owned artwork is less work but weakens exact folder ownership and deletion rules; use dedicated ownership.
- Static avatar normalization cannot preserve GIF or prove HEIC support; use separate bounded normalization.

## Acceptance

Verify all folder surfaces, dark/light, keyboard/caret insertion, long names, rapid selection/navigation, upload failure/cancel, real HEIC and animated GIF, private cross-tenant denial, ETag conflicts, retries, archive/restore, 100 history records with bounded UI, no empty content block, run-only marquee, maintenance star/filter/clear, unchanged execution result. Files remain ≤200 physical TS/TSX lines and ≤2 handwritten code files per directory. Production release follows full gates and existing authorization, with no synthetic fixture shipped.


## User refinement — compact picker and GIF gallery

User review requests a wider, shorter folder picker; HEX and custom color controls are visible at the top with no disclosure button,50 icon choices in a horizontal scroller, preset colors below. Upload presents a real browsable GIF catalog plus a quiet own-file upload action and concise format guidance. User selected KLIPY over Wikimedia. KLIPY standard API terms require direct client requests/CDN display with attribution and prohibit rehosting; therefore catalog selections are provider references, while user-uploaded media retain existing private assets. API registration/key is pending user sign-in; do not invent a shared/demo credential or fake a catalog. No production migration has run;0078 final artifact must include the expanded allowlist and provider-reference shape before its final restore rehearsal.
