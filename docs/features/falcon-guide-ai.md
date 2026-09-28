# Falcon guide chat

## User flow

Opening Help without an explicit article opens Falcon AI chat. The chat link is
the first item below guide search; the existing article tree stays visible.
Explicit article/section links continue to open that article. Search still works
without AI. The right pane contains the conversation and a bottom composer in the
current Falcon theme, using existing typography and a bounded reading width.

The user can ask a question, continue the conversation, stop a pending answer,
retry a failed request or start a new conversation. Voice input records only
after the microphone button is pressed. Transcription fills the editable draft;
it never sends the question automatically. Navigation releases the microphone.

Answer text arrives progressively from the model. It is provisional until the
request completes; a failed or invalid response removes the partial answer and
preserves the question for retry. Stopping cancels the request. The interface does
not imitate typing by replaying a completed answer with artificial delays.

Answers cite guide article sections. Where the guide has relevant screenshots,
the assistant can also return an illustrated sequence or a gallery. Each item
uses the guide's actual screenshot, instruction and expected result in the current
locale. Follow-up questions can focus on a particular step without restating the
procedure. These are reference illustrations, not a live view of the user's
workspace, and they do not prove the user has completed an action.
All selected steps are visible without an additional expansion action. Image
numbers continue across sections and match follow-up context; the enlarged
viewer uses the same complete, ordered set of up to eight screenshots.

Opening a source keeps the conversation available when the user returns to chat.
Chats are saved on the server for the current account and workspace. History
beside New chat opens a searchable, paginated list. New chat creates a blank draft;
its first question creates a new saved conversation without deleting old ones.
Changing UI language does not erase history: saved text and illustrations retain
the conversation's original locale. The server retains the opening exchange and
the most recent complete exchanges
within 20 messages and 32,000 characters. Prior illustrated answers include
bounded, ordered image references in conversation context so questions about
"the second screenshot" can be resolved against the authorized guide again.

Share answer beside Copy creates an authenticated, revocable link to one completed
question/answer pair, including sources and illustrations. It does not disclose
the rest of the private conversation. Current workspace members can view the
snapshot subject to the answer's source permissions; administration-only content
remains restricted. Recipients can start their own conversation. Private chat and
message links use stable server IDs; browser Back/Forward preserves them.

Screenshot viewing animates the image from its actual thumbnail to the native
dialog and back. The current image returns to its matching visible thumbnail,
including after arrow navigation. Missing or off-screen targets fade safely;
reduced-motion preferences disable spatial movement. The dialog retains keyboard
navigation, focus management and Escape behavior.

## Knowledge and trust

The backend receives a versioned corpus exported from the canonical RU/EN typed
guide catalogs. It does not accept user-provided documentation or source URLs.
The export includes paragraphs, steps, tables, code, warnings, walkthrough
instructions and planned-feature labels. Illustrated sections also include
`media: [{ id, title, instruction, result, src, alt }]`. A deterministic digest
detects changes to both text and media metadata.

`documentationSectionMedia` is shared by corpus export and frontend validation.
A media ID is the screenshot filename without `.jpg`, with a numbered suffix
only when necessary to avoid collisions within the section. Inserting unrelated
paragraphs does not change an illustration's ID. English images use
`/falcon/docs/YYYY-MM/`; Russian images use `/falcon/docs/YYYY-MM-ru/`.
The current edition is `2026-09`; future dated editions need no path-rule changes.
Export verifies locale correspondence, safe relative paths, existing public files
and JPEG signatures. Image binaries stay in public assets; no OCR or generated
screenshots are involved.

The model selects relevant authorized articles from the catalog and answers from
their content. Returned source identifiers must match selected article sections;
the server supplies source titles and the frontend constructs internal links.
The model selects illustration IDs from authorized sections, never image URLs or
captions. The backend resolves those IDs against its authorized corpus and adds
their canonical section citations when the model omits them. The combined source
list remains limited to eight sections. The
frontend verifies each returned item against the visible local article catalog
for the saved conversation locale
and uses that catalog's text and image metadata. Unknown, hidden or mismatched
illustrations are not rendered. Citations and illustrations become available only
with the validated final response. At most eight screenshots accompany one answer.
Unknown or undocumented behavior receives an explicit limitation instead of an
invented product capability. Previous conversation messages provide context, not
trusted facts. The assistant does not access or change cases, runs or settings.

Every request requires active workspace read access. Administration material is
available only to workspace administrators. The existing server-side OpenAI
configuration is reused; credentials are never sent to the frontend. Provider
requests use `store: false`, bounded input/output, cancellation and timeouts.
Durable member, workspace and global budgets cap provider usage.

Private chat and turn tables enforce both workspace and owner RLS. Shared answer
snapshots have separate policies permitting only the owner or a specifically
requested share ID. Application authorization is repeated against current
membership and source access. All selected source IDs are retained, not only
citations, with a sticky administration requirement inherited from context.
Completed turns and share content are immutable; shares can be revoked.

Turns use client-generated stable UUIDs, request digests, version checks and
database leases. Provider calls do not hold an open SQL transaction. Complete and
cancel operations compare the claim token; the final stream event follows commit.
A retry of a completed turn replays its saved answer without another generation.
Partial/failed responses are never persisted as completed answers.

## Contract and integration

- `POST /workspaces/{workspaceId}/ai/documentation-chat`: locale and bounded
  user/assistant message history; returns answer, validated citations and corpus
  version inside the standard data envelope, with optional validated `visuals`.
- `POST /workspaces/{workspaceId}/ai/documentation-chat/stream`: backward-compatible
  stateless SSE endpoint. JSON data frames carry `text_delta` with `delta`,
  `complete` with the validated `data`, or `error` with the usual safe error object.
  Only text from the provider's answer field is streamed. Source and image
  identifiers remain subject to final validation; an incomplete stream is an error.
- `/workspaces/{workspaceId}/ai/documentation-chats`: owner-scoped creation,
  searchable/paginated history, metadata and turn pages. The persistent chat client
  sends new questions to `/{chatId}/turns/stream`, not browser-supplied history.
  The stream emits `accepted` with durable IDs, `text_delta`, then committed
  `complete` with answer, chat and turn metadata. Stable turn lookup supports
  direct message links. Cancellation is an explicit turn command.
- `/{chatId}/turns/{turnId}/share` creates an idempotent share snapshot;
  `/{chatId}/shares` lists owner metadata and `/{chatId}/shares/{shareId}` revokes
  it. `/workspaces/{workspaceId}/ai/documentation-shares/{shareId}` reads just the
  shared pair after current membership/source authorization. See OpenAPI for all
  bounded DTOs, cursor rules and errors.
- `POST /workspaces/{workspaceId}/ai/documentation-dictation`: existing canonical
  WAV/transcription contract with read-member authorization. The writing endpoint
  retains its editing permission requirements.
- The existing dictation hook supports a documentation purpose, conversation
  reset key and composer limit. Missing authenticated transport disables AI while
  static Help remains readable.
- Cloudflare's existing bounded audio allowance applies to the exact new
  transcription path, with the same timeout and cancellation behavior.

## Verification and rollout

Verify corpus drift and both locales; authorization, quotas, source validation,
provider errors and cancellation; fragmented SSE and final-response reconciliation;
image identity, locale and file availability; chat request/state behavior; dictation draft
preservation; direct article links and search; light/dark and narrow layouts.
Run backend and frontend architecture/type/contract tests plus production builds.

Run `npx tsx --test scripts/documentation-ai/tests/*.test.ts scripts/documentation-ai/tests/media/*.test.ts`
when updating the exporter. Its `--output` and `--check` commands validate the same
asset inventory before writing or comparing the backend corpus.

Current import illustrations cover the empty import page, destination folder
picker and Import and export settings. The guide describes file preparation,
processing, source-file history and partial-import recovery in text, but does not
yet contain screenshots of those states. Do not substitute unrelated images or
claim a complete illustrated migration walkthrough until those states are
captured from the actual product with neutral data.

History requires additive schema migration 0067. Before migrating, deploy a schema
0066..0067 compatibility bridge to primary API, managed API and notifications.
Back up the database and rehearse restore. Then apply migration 0067, deploy the
reviewed API artifact and publish the frontend. The existing Worker forwards SSE
without buffering. Verify deployment/source identities, schema readiness, public
assets, saved history, shared-answer revocation and source navigation. Recovery
retains schema 0067 and uses the compatible bridge; binaries pinned to exactly
0066 are not a valid post-migration rollback. No existing case/run data is rewritten.
