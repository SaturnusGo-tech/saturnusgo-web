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

Answers cite guide article sections. Opening a source keeps the conversation
available when the user returns to chat. The in-memory conversation resets on
account, workspace or language changes and is not persisted in browser storage.

## Knowledge and trust

The backend receives a versioned corpus exported from the canonical RU/EN typed
guide catalogs. It does not accept user-provided documentation or source URLs.
The export includes paragraphs, steps, tables, code, warnings, walkthrough
instructions and planned-feature labels. A deterministic digest detects drift.

The model selects relevant authorized articles from the catalog and answers from
their content. Returned source identifiers must match selected article sections;
the server supplies source titles and the frontend constructs internal links.
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
  version inside the standard data envelope.
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
provider errors and cancellation; chat request/state behavior; dictation draft
preservation; direct article links and search; light/dark and narrow layouts.
Run backend and frontend architecture/type/contract tests plus production builds.

Deploy the reviewed backend artifact to primary and managed API services with
schema 0066 and existing configuration unchanged. Publish the frontend export and
then the Worker audio route allowance. The notification worker needs no update.
Verify exact deployment/source identities, public assets, actual grounded answers
and source navigation. Recovery uses the preceding API/frontend/Worker artifacts;
this feature has no schema migration or product-data rewrite.
