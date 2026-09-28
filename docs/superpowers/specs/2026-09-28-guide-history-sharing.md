# Falcon guide: saved chats, answer links and image motion

Status: implementation authorized by the user's request on 2026-09-28.

## Behavior

Help keeps its article tree and chat layout. A small history control beside New
chat opens a searchable, paginated list of the signed-in user's conversations in
the current workspace. New chat starts an empty draft; the server creates the
conversation on its first question. Reopening Help or reloading restores a
conversation addressed by its stable ID. Changing UI language does not erase
history; each conversation retains its original answer and illustration locale.

Conversation state is durable PostgreSQL data, private to its owner. The server
constructs bounded model context from completed turns, retaining the opening goal
and recent turns, including ordered illustration references. A turn is one
question and one validated answer. Partial streaming text is never a saved answer.
Stable turn IDs and version checks prevent duplicate generation on retries and
concurrent sends. A stopped or interrupted turn remains distinguishable from a
completed answer and can be retried deliberately.

Each completed answer offers Share beside Copy. An anchored control explains
that a copied link shares this question and answer with current workspace members
after sign-in. It does not share the rest of the conversation. The owner can
revoke the link. A recipient sees a read-only snapshot with its sources and
illustrations and can start a separate personal conversation. No anonymous
access or public indexing is introduced.

Help URLs accept `chat=<uuid>&message=<turn uuid>` for private history and
`share=<uuid>` for a shared answer, mutually exclusively. The existing article
parameter and section links remain valid. The central workspace URL normalizer
must preserve these parameters. A message link loads its target without walking
an unbounded history and scrolls/focuses the answer.

## Images

Opening an image expands it from the actual thumbnail rectangle to the viewer.
Closing reverses that movement to the visible thumbnail of the currently shown
image. The backdrop fades independently. Native dialog focus, Escape and image
navigation remain intact. An off-screen/removed thumbnail uses a short fade;
reduced-motion users do not receive the spatial movement. Chrome and Safari must
work without depending on the View Transition API. Resize, scroll or interrupted
animation must leave no ghost element or locked dialog.

## Data and authorization

Migration 0067 adds `guide_chats`, `guide_chat_turns`, and separate immutable
`guide_answer_shares` snapshots. Private tables enforce workspace and owner RLS.
Share reads additionally require an owner or the specifically requested share ID;
only the owner can create/revoke. Every application query checks current active
membership. Admin-only sources remain restricted on history and share reads,
including content inherited from previous context. Store all selected source IDs,
not only final citations, and keep the admin requirement sticky.

Generation holds no SQL transaction across the provider call. Short transactions
claim a pending turn with a lease and complete/cancel it with a claim-token CAS.
The SSE complete event follows successful persistence. Paid generation is not
repeated for the same completed turn ID. Audit events contain IDs and operation
metadata, never question/answer text.

## Acceptance

Two chats survive reload independently; previous answers and their images remain
available. New chat does not erase history. Search and older pages are bounded.
A same-workspace different user cannot read private chats. Shared links disclose
one pair only, enforce current permissions and become unavailable after revoke.
Repeated or interrupted requests cannot duplicate saved turns or resurrect a
cancelled answer. RU/EN content follows the saved conversation locale. Direct
message links, browser Back/Forward, keyboard operation and narrow screens work.

## Release

Before migration, deploy a schema 0066..0067 compatibility bridge to primary API,
managed API and notification worker. Take and rehearse recovery from a database
backup. Apply additive migration 0067, then deploy exact reviewed API artifacts
and the frontend. Recovery retains schema 0067 and uses the compatible bridge;
never roll back to binaries that require exactly schema 0066.
