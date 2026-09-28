import assert from "node:assert/strict";
import { test } from "node:test";
import { chatHarness } from "../state/harness";
import { guideBackend } from "../history/support/backend";

test("retry after a failed initial create and confirmed chat404 can create a fresh chat", async () => {
  const backend = guideBackend(), create = backend.api.mutate;
  backend.api.mutate = async () => { backend.api.mutate = create; throw new Error("Create failed before persistence"); };
  const h = chatHarness(backend);
  try {
    h.draft("Original question"); await h.send();
    assert.equal(backend.chats.size, 0); assert.equal(h.get().draft, "Original question");
    await h.send();
    assert.equal(backend.chats.size, 1); assert.equal(h.requests.length, 1);
    await h.reply(0, "Recovered answer"); assert.equal(h.get().messages[h.get().messages.length - 1]?.content, "Recovered answer");
  } finally { h.unmount(); }
});

test("a committed initial create with a lost response is reused instead of creating a duplicate empty chat", async () => {
  const backend = guideBackend(), create = backend.api.mutate;
  backend.api.mutate = async (...args) => {
    backend.api.mutate = create; await create(...args); throw new Error("Create response lost after persistence");
  };
  const h = chatHarness(backend);
  try {
    h.draft("Original question"); await h.send(); assert.equal(backend.chats.size, 1);
    const savedId = [...backend.chats.keys()][0];
    await h.send(); assert.equal(backend.chats.size, 1); assert.equal(h.requests.length, 1);
    assert.equal(h.requests[0].chatId, savedId);
    await h.reply(0); assert.equal(h.get().chatId, savedId);
  } finally { h.unmount(); }
});

test("New chat discards recovery belonging to an unavailable prior conversation", async () => {
  const h = chatHarness();
  try {
    h.draft("Old question"); await h.send(); const oldId = h.get().chatId;
    assert.ok(oldId);
    await h.run(() => { h.backend.setReadFailure(true); h.backend.fail(0); });
    h.backend.setReadFailure(false); h.backend.chats.delete(oldId);
    await h.run(() => h.get().newChat()); h.draft("Independent question"); await h.send();
    assert.equal(h.requests.length, 2); assert.notEqual(h.requests[1].chatId, oldId);
    assert.equal(h.requests[1].body.content, "Independent question");
    await h.reply(1, "Independent answer"); assert.equal(h.get().messages[h.get().messages.length - 1]?.content, "Independent answer");
  } finally { h.unmount(); }
});
