import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react-test-renderer";
import { TmsApiError } from "../../../../../../core/tms/transport/http";
import { chatHarness } from "./harness";

test("only explicit send starts a request and follow-up includes successful conversation history", async () => {
  const h = chatHarness(); h.draft("How do I edit a run?"); assert.equal(h.requests.length, 0);
  h.send(); assert.equal(h.requests.length, 1); assert.equal(h.get().draft, ""); assert.equal(h.get().busy, true);
  assert.equal(h.get().messages.length, 1); assert.equal(h.requests[0].body.locale, "ru");
  await h.reply(0, "Use the pencil in Current run.");
  h.draft("Can I replace its build?"); h.send();
  assert.deepEqual(h.requests[1].body.messages, [
    { role: "user", content: "How do I edit a run?" }, { role: "assistant", content: "Use the pencil in Current run." },
    { role: "user", content: "Can I replace its build?" },
  ]);
  await h.reply(1); assert.equal(h.get().messages.length, 4); h.unmount();
});

test("stopping restores the pending question and ignores a late answer", async () => {
  const h = chatHarness(); h.draft("Question one"); h.send(); act(() => h.get().cancel());
  assert.equal(h.requests[0].signal?.aborted, true); assert.equal(h.get().draft, "Question one");
  assert.equal(h.get().busy, false); assert.equal(h.get().messages.length, 0);
  h.draft("Question two"); h.send(); await h.reply(0, "Late answer");
  assert.equal(h.get().busy, true); assert.equal(h.get().messages.length, 1);
  await h.reply(1, "Current answer"); assert.equal(h.get().messages[1].content, "Current answer"); h.unmount();
});

test("failure preserves the question and retries once only when requested", async () => {
  const h = chatHarness(); h.draft("Keep my question"); h.send();
  await h.fail(0, new TmsApiError("Limited", 429, null));
  assert.equal(h.get().error, "limited"); assert.equal(h.get().draft, "Keep my question");
  assert.equal(h.get().messages.length, 0); assert.equal(h.requests.length, 1); assert.equal(h.get().busy, false);
  h.draft("Clarified question"); act(() => h.get().retry());
  assert.equal(h.requests.length, 2); assert.deepEqual(h.requests[1].body.messages, [{ role: "user", content: "Clarified question" }]);
  await h.reply(1); assert.equal(h.get().error, ""); h.unmount();
});

for (const [name, patch] of [["workspace", { workspaceId: "workspace-b" }], ["account", { subject: "member-b" }], ["locale", { locale: "en" as const }]] as const) {
  test(`${name} change cancels request and clears private conversation and draft`, async () => {
    const h = chatHarness(); h.draft("Old question"); h.send(); h.update(patch);
    assert.equal(h.requests[0].signal?.aborted, true); assert.equal(h.get().messages.length, 0); assert.equal(h.get().draft, "");
    await h.reply(0, "Wrong context"); assert.equal(h.get().messages.length, 0); assert.equal(h.get().busy, false); h.unmount();
  });
}

test("new chat clears history, stops pending work and never persists a late reply", async () => {
  const h = chatHarness(); h.draft("First"); h.send(); await h.reply(0); h.draft("Second"); h.send();
  const previous = h.get().conversationId; act(() => h.get().newChat());
  assert.equal(h.requests[1].signal?.aborted, true); assert.equal(h.get().messages.length, 0);
  assert.equal(h.get().draft, ""); assert.ok(h.get().conversationId > previous);
  await h.reply(1); assert.equal(h.get().messages.length, 0); h.unmount();
});

test("unavailable transport, offline mode and oversized questions never send; disabling aborts active work", async () => {
  const h = chatHarness(); h.draft("q".repeat(8001)); h.send(); assert.equal(h.requests.length, 0);
  h.draft("Question"); h.update({ enabled: false }); h.send(); assert.equal(h.requests.length, 0);
  h.update({ enabled: true }); h.send(); assert.equal(h.requests.length, 1);
  h.update({ enabled: false }); assert.equal(h.requests[0].signal?.aborted, true); assert.equal(h.get().draft, "Question");
  await h.reply(0); assert.equal(h.get().messages.length, 0);
  h.update({ http: null, enabled: true }); h.send(); assert.equal(h.requests.length, 1); h.unmount();
});

test("unmount aborts the active request", () => {
  const h = chatHarness(); h.draft("Question"); h.send(); h.unmount(); assert.equal(h.requests[0].signal?.aborted, true);
});
