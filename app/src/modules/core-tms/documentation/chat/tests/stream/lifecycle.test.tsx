import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react-test-renderer";
import { chatHarness } from "../state/harness";

async function delta(h: ReturnType<typeof chatHarness>, value: string) {
  await act(async () => { h.backend.event(0, { type: "text_delta", delta: value }); await new Promise(resolve => setTimeout(resolve, 22)); });
}
test("real text renders provisionally and only persisted completion commits the assistant message", async () => {
  const h = chatHarness(); h.draft("Question"); await h.send(); await delta(h, "Actual ");
  assert.equal(h.get().partialText, "Actual "); assert.equal(h.get().messages.length, 1);
  await delta(h, "answer"); assert.equal(h.get().partialText, "Actual answer");
  await h.reply(0, "Actual answer"); assert.equal(h.get().messages[1].content, "Actual answer"); assert.equal(h.get().partialText, ""); h.unmount();
});
test("provider failure removes provisional text while keeping the saved question retryable", async () => {
  const h = chatHarness(); h.draft("Keep my question"); await h.send(); await delta(h, "Unverified");
  await h.fail(0, "AI_GUIDE_OUTPUT_INVALID");
  assert.equal(h.get().partialText, ""); assert.equal(h.get().messages.length, 1); assert.equal(h.get().draft, "Keep my question");
  assert.equal(h.get().error, "invalid"); h.unmount();
});
for (const mode of ["stop", "new-chat", "workspace", "unmount"] as const) {
  test(`${mode} aborts streaming and prevents partial text from becoming a saved answer`, async () => {
    const h = chatHarness(); h.draft("Question"); await h.send(); await delta(h, "Partial");
    if (mode === "stop") await h.run(() => h.get().cancel());
    if (mode === "new-chat") await h.run(() => h.get().newChat());
    if (mode === "workspace") await h.update({ workspaceId: "another-workspace" });
    if (mode === "unmount") h.unmount();
    await new Promise(resolve => setTimeout(resolve, 22));
    assert.equal(h.requests[0].signal.aborted, true); assert.equal(h.requests[0].cancelled, true);
    if (mode !== "unmount") { assert.equal(h.get().partialText, ""); assert.ok(h.get().messages.every(message => message.role === "user")); h.unmount(); }
  });
}
