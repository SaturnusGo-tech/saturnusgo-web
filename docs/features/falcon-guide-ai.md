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

Opening a source keeps the conversation
available when the user returns to chat. The in-memory conversation resets on
account, workspace or language changes and is not persisted in browser storage.
Requests retain the opening exchange and the most recent complete exchanges
within 20 messages and 32,000 characters. Prior illustrated answers include
bounded, ordered image references in conversation context so questions about
"the second screenshot" can be resolved against the authorized guide again.

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

## Contract and integration

- `POST /workspaces/{workspaceId}/ai/documentation-chat`: locale and bounded
  user/assistant message history; returns answer, validated citations and corpus
  version inside the standard data envelope, with optional validated `visuals`.
- `POST /workspaces/{workspaceId}/ai/documentation-chat/stream`: the chat client
  uses this SSE endpoint. JSON data frames carry `text_delta` with `delta`,
  `complete` with the validated `data`, or `error` with the usual safe error object.
  Only text from the provider's answer field is streamed. Source and image
  identifiers remain subject to final validation; an incomplete stream is an error.
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

Deploy the reviewed backend artifact to primary and managed API services with
schema 0066 and existing configuration unchanged. Publish the frontend export.
The existing Worker passes SSE bodies through without buffering; its audio route
allowance is already deployed. No Worker runtime change is required for this
extension. The notification worker needs no update.
Verify exact deployment/source identities, public assets, actual grounded answers
and source navigation. Recovery uses the preceding API/frontend/Worker artifacts;
this feature has no schema migration or product-data rewrite.
