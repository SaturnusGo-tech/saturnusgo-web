import assert from "node:assert/strict";
import { test } from "node:test";
import { chatHarness } from "../state/harness";

test("uncertain saved turn is reconciled before retry and cannot duplicate a completed answer", async () => {
  const h = chatHarness(); h.draft("Original question"); await h.send();
  await h.run(() => { h.backend.setReadFailure(true); h.backend.complete(0, "Saved while disconnected", false); h.backend.disconnect(0); });
  assert.equal(h.get().draft, "Original question"); assert.equal(h.requests.length, 1);
  h.backend.setReadFailure(false);
  await h.run(() => h.get().refresh());
  assert.equal(h.get().messages[h.get().messages.length - 1]?.content, "Saved while disconnected");
  await h.send(); assert.equal(h.requests.length, 1); assert.equal(h.get().draft, ""); h.unmount();
});

test("Stop reconciles a server completion that won the cancellation race", async () => {
  const h = chatHarness(); h.draft("Question"); await h.send();
  h.backend.complete(0, "Already committed", false);
  await h.run(() => h.get().cancel());
  assert.equal(h.get().messages[h.get().messages.length - 1]?.content, "Already committed"); assert.equal(h.get().draft, ""); h.unmount();
});

test("switching chats during streaming cancels only the previous turn and preserves its completed answer", async () => {
  const h = chatHarness(); h.draft("First conversation"); await h.send(); await h.reply(0, "First answer");
  const first = h.get().chatId!; await h.run(() => h.get().newChat());
  h.draft("Second conversation"); await h.send(); const second = h.get().chatId!;
  await h.run(() => h.get().selectChat(first));
  assert.equal(h.requests[1].signal.aborted, true); assert.equal(h.get().messages[h.get().messages.length - 1]?.content, "First answer");
  assert.equal(h.backend.turns.get(second)![0].state, "cancelled"); h.unmount();
});

test("offline changes cancel pending streams and keep their question", async () => {
  const h = chatHarness(); h.draft("Question"); await h.send(); await h.update({ enabled: false });
  assert.equal(h.requests[0].signal.aborted, true); assert.equal(h.get().draft, "Question"); h.unmount();
});


test("reopening an interrupted conversation restores its last question as an editable draft", async () => {
  const original = chatHarness(); original.draft("Retry after interrupted session"); await original.send();
  const id = original.get().chatId!;
  await original.run(() => original.get().cancel()); original.unmount();
  const reopened = chatHarness(original.backend);
  await reopened.update({ route: { chatId: id, turnId: null, shareId: null } });
  assert.equal(reopened.get().draft, "Retry after interrupted session");
  await reopened.run(() => reopened.get().setDraft("")); await reopened.run(() => reopened.get().refresh());
  assert.equal(reopened.get().draft, ""); reopened.unmount();
});
