import assert from "node:assert/strict";
import { test } from "node:test";
import { chatHarness, flush } from "./harness";

test("first Send creates a persisted chat and later sends only a new turn, never browser history", async () => {
  const h = chatHarness(); h.draft("How do I edit a run?"); assert.equal(h.backend.chats.size, 0);
  await h.send(); assert.equal(h.requests.length, 1); assert.equal(h.backend.chats.size, 1); assert.equal(h.get().busy, true);
  assert.equal(h.get().messages.length, 1); assert.equal(h.get().draft, "");
  await h.reply(0, "Use the pencil."); h.draft("Can I replace the build?"); await h.send();
  assert.equal(h.backend.chats.size, 1); assert.deepEqual(Object.keys(h.requests[1].body).sort(), ["content", "expectedVersion", "turnId"]);
  assert.equal(h.requests[1].body.content, "Can I replace the build?"); await h.reply(1);
  assert.equal(h.get().messages.length, 4); assert.ok(h.get().messages[3].id); h.unmount();
});

test("plus keeps previous chats and reopening restores messages and unsent drafts", async () => {
  const h = chatHarness(); h.draft("First question"); await h.send(); await h.reply(0, "Saved answer");
  const id = h.get().chatId!; h.draft("Unsent follow-up"); await h.run(() => h.get().newChat());
  assert.equal(h.get().messages.length, 0); assert.equal(h.get().draft, ""); assert.equal(h.backend.chats.size, 1);
  await h.run(() => h.get().selectChat(id)); assert.equal(h.get().messages[1].content, "Saved answer");
  assert.equal(h.get().draft, "Unsent follow-up"); h.unmount();
});

test("a fresh mounted controller restores persisted history through its stable chat route", async () => {
  const h = chatHarness(); h.draft("Saved question"); await h.send(); await h.reply(0, "Saved answer");
  const id = h.get().chatId!, backend = h.backend; h.unmount();
  const reopened = chatHarness(backend); await reopened.update({ route: { chatId: id, turnId: backend.turns.get(id)![0].id, shareId: null } });
  assert.equal(reopened.get().messages[1].content, "Saved answer"); assert.equal(reopened.get().targetTurnId, backend.turns.get(id)![0].id); reopened.unmount();
});

test("Stop preserves completed history and restores the interrupted question for a new durable turn", async () => {
  const h = chatHarness(); h.draft("Question one"); await h.send();
  await h.run(() => h.get().cancel()); assert.equal(h.requests[0].signal.aborted, true);
  assert.equal(h.get().draft, "Question one"); assert.equal(h.get().busy, false); assert.equal(h.get().messages.length, 1);
  await h.send(); assert.notEqual(h.requests[0].body.turnId, h.requests[1].body.turnId);
  await h.reply(1, "Current answer"); assert.equal(h.get().messages[h.get().messages.length - 1]?.content, "Current answer"); h.unmount();
});

test("failure restores the question; explicit retry uses a fresh turn and latest server version", async () => {
  const h = chatHarness(); h.draft("Keep my question"); await h.send(); await h.fail(0, "AI_GUIDE_RATE_LIMITED");
  assert.equal(h.get().draft, "Keep my question"); assert.equal(h.get().error, "limited"); assert.equal(h.get().busy, false);
  await h.send(); assert.equal(h.requests.length, 2); assert.notEqual(h.requests[0].body.turnId, h.requests[1].body.turnId);
  await h.reply(1); assert.equal(h.get().error, ""); h.unmount();
});

for (const patch of [{ workspaceId: "workspace-b" }, { subject: "member-b" }]) {
  test("identity/workspace change cancels requests and clears local private state", async () => {
    const h = chatHarness(); h.draft("Old question"); await h.send(); await h.update(patch);
    assert.equal(h.requests[0].signal.aborted, true); assert.equal(h.get().messages.length, 0); assert.equal(h.get().draft, ""); h.unmount();
  });
}

test("changing shell language keeps original saved answer locale and conversation", async () => {
  const h = chatHarness(); h.draft("Русский вопрос"); await h.send(); await h.reply(0, "Русский ответ");
  const id = h.get().chatId; await h.update({ locale: "en" });
  assert.equal(h.get().chatId, id); assert.equal(h.get().locale, "en"); assert.equal(h.get().messages[1].locale, "ru"); h.unmount();
});

test("uncertain disconnect reconciles a committed answer without generating it twice", async () => {
  const h = chatHarness(); h.draft("Question"); await h.send();
  await h.run(() => { h.backend.complete(0, "Committed answer", false); h.backend.disconnect(0); });
  assert.equal(h.get().messages[h.get().messages.length - 1]?.content, "Committed answer"); assert.equal(h.get().error, ""); assert.equal(h.requests.length, 1); h.unmount();
});

test("unavailable transport, offline mode and oversized drafts never create a chat", async () => {
  const h = chatHarness(); h.draft("q".repeat(8001)); await h.send(); assert.equal(h.backend.chats.size, 0);
  h.draft("Question"); await h.update({ enabled: false }); await h.send(); assert.equal(h.backend.chats.size, 0);
  await h.update({ enabled: true, http: null }); await h.send(); assert.equal(h.backend.chats.size, 0); h.unmount();
});

test("unmount aborts and cancels the pending server turn", async () => {
  const h = chatHarness(); h.draft("Question"); await h.send(); h.unmount(); await flush();
  assert.equal(h.requests[0].signal.aborted, true); assert.equal(h.backend.turns.get(h.requests[0].chatId)![0].state, "cancelled");
});
