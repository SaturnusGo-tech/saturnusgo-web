import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react-test-renderer";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { chatHarness } from "../state/harness";

function streamingHarness() {
  const streams: { controller: ReadableStreamDefaultController<Uint8Array>; signal: AbortSignal; cancelled: boolean }[] = [];
  const http = { stream: async (_path: string, _body: unknown, signal: AbortSignal) => {
    const current = { signal, cancelled: false } as typeof streams[number]; streams.push(current);
    return new Response(new ReadableStream({ start(controller) { current.controller = controller; }, cancel() { current.cancelled = true; } }),
      { headers: { "content-type": "text/event-stream" } });
  } } as unknown as TmsHttpClient;
  const h = chatHarness(http);
  const event = async (index: number, value: unknown) => act(async () => {
    streams[index].controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(value)}\n\n`));
    await new Promise(resolve => setTimeout(resolve, 22));
  });
  const complete = (index: number) => event(index, { type: "complete", data: { answer: "Validated answer", citations: [], knowledgeVersion: "fixture" } });
  return { ...h, streams, event, complete };
}

test("real text deltas render provisionally and only complete event commits answer and citations", async () => {
  const h = streamingHarness(); h.draft("Question"); h.send();
  await h.event(0, { type: "text_delta", delta: "Validated " });
  assert.equal(h.get().partialText, "Validated "); assert.equal(h.get().busy, true); assert.equal(h.get().messages.length, 1);
  await h.event(0, { type: "text_delta", delta: "answer" }); assert.equal(h.get().partialText, "Validated answer");
  await h.complete(0); assert.equal(h.get().messages[1].content, "Validated answer");
  assert.equal(h.get().partialText, ""); assert.equal(h.get().busy, false); h.unmount();
});

test("provider failure after deltas removes partial response and restores question for retry", async () => {
  const h = streamingHarness(); h.draft("Keep my question"); h.send();
  await h.event(0, { type: "text_delta", delta: "An incomplete answer" });
  await h.event(0, { type: "error", error: { code: "AI_GUIDE_OUTPUT_INVALID", message: "Safe failure", requestId: "fixture" } });
  assert.equal(h.get().partialText, ""); assert.equal(h.get().messages.length, 0); assert.equal(h.get().draft, "Keep my question");
  assert.equal(h.get().error, "invalid"); assert.equal(h.get().busy, false); h.unmount();
});

for (const mode of ["stop", "new-chat", "workspace", "unmount"] as const) {
  test(`${mode} aborts the real stream and removes unvalidated partial text`, async () => {
    const h = streamingHarness(); h.draft("Question"); h.send(); await h.event(0, { type: "text_delta", delta: "Partial" });
    if (mode === "stop") act(() => h.get().cancel());
    if (mode === "new-chat") act(() => h.get().newChat());
    if (mode === "workspace") h.update({ workspaceId: "another-workspace" });
    if (mode === "unmount") h.unmount();
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 22)); });
    assert.equal(h.streams[0].signal.aborted, true); assert.equal(h.streams[0].cancelled, true);
    if (mode !== "unmount") { assert.equal(h.get().partialText, ""); assert.equal(h.get().messages.length, 0); h.unmount(); }
  });
}
