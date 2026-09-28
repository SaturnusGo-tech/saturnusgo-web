import assert from "node:assert/strict";
import { test } from "node:test";
import { readGuideStream } from "../../data/stream/read-guide-stream";
import { guideError } from "../../data/ask-guide";

const encoder = new TextEncoder();
const answer = { answer: "Проверьте сборку 🚀", citations: [{ articleId: "create-run", sectionId: "builds", title: "Builds" }], knowledgeVersion: "fixture" };
const event = (data: unknown) => `data: ${JSON.stringify(data)}\n\n`;
function response(chunks: Uint8Array[]) {
  return new Response(new ReadableStream({ start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close(); } }),
    { headers: { "content-type": "text/event-stream; charset=utf-8" } });
}

test("fragmented UTF-8, CRLF, comments and multiline data reconstruct real deltas and complete answer", async () => {
  const text = ": keepalive\r\n\r\nevent: message\r\ndata: {\"type\":\"text_delta\",\r\ndata: \"delta\":\"Проверьте \"}\r\n\r\n"
    + event({ type: "text_delta", delta: "сборку 🚀" }) + event({ type: "complete", data: answer });
  const chunks = [...encoder.encode(text)].map(byte => new Uint8Array([byte])), deltas: string[] = [];
  const result = await readGuideStream(response(chunks), new AbortController().signal, delta => deltas.push(delta));
  assert.deepEqual(deltas, ["Проверьте ", "сборку 🚀"]); assert.deepEqual(result, answer);
});

test("a delta is observable before the final event and streaming never fabricates characters", async () => {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new Response(new ReadableStream({ start(value) { controller = value; } }), { headers: { "content-type": "text/event-stream" } });
  const deltas: string[] = [], pending = readGuideStream(stream, new AbortController().signal, value => deltas.push(value));
  controller.enqueue(encoder.encode(event({ type: "text_delta", delta: "Проверьте " })));
  await new Promise(resolve => setTimeout(resolve, 0)); assert.deepEqual(deltas, ["Проверьте "]);
  controller.enqueue(encoder.encode(event({ type: "complete", data: answer }))); controller.close();
  assert.deepEqual(await pending, answer); assert.deepEqual(deltas, ["Проверьте "]);
});

test("incomplete, malformed and errored streams cannot return a completed answer", async () => {
  for (const text of [event({ type: "text_delta", delta: "Partial" }), "data: not-json\n\n",
    event({ type: "complete", data: { answer: "invalid" } }), event({ type: "unexpected" })]) {
    await assert.rejects(readGuideStream(response([encoder.encode(text)]), new AbortController().signal, () => {}));
  }
  for (const [code, expected] of [["AI_GUIDE_UNAVAILABLE", "unavailable"], ["AI_GUIDE_RATE_LIMITED", "limited"], ["AI_GUIDE_OUTPUT_INVALID", "invalid"]] as const) {
    await assert.rejects(readGuideStream(response([encoder.encode(event({ type: "text_delta", delta: "Unverified" })
      + event({ type: "error", error: { code, message: "Safe error", requestId: "fixture" } }))]), new AbortController().signal, () => {}),
    error => guideError(error) === expected);
  }
});

test("aborting a pending read closes the body and rejects without terminal success", async () => {
  let cancelled = false;
  const stream = new Response(new ReadableStream({ cancel() { cancelled = true; } }), { headers: { "content-type": "text/event-stream" } });
  const abort = new AbortController(), pending = readGuideStream(stream, abort.signal, () => {});
  abort.abort(); await assert.rejects(pending, error => (error as Error).name === "AbortError"); assert.equal(cancelled, true);
});

test("streamed text respects the same 16k total answer limit before publishing each delta", async () => {
  const maximum = "a".repeat(16000), deltas: string[] = [];
  const complete = { ...answer, answer: maximum };
  const accepted = await readGuideStream(response([encoder.encode(event({ type: "text_delta", delta: maximum })
    + event({ type: "complete", data: complete }))]), new AbortController().signal, delta => deltas.push(delta));
  assert.equal(accepted.answer.length, 16000); assert.deepEqual(deltas, [maximum]);
  deltas.length = 0;
  await assert.rejects(readGuideStream(response([encoder.encode(event({ type: "text_delta", delta: maximum })
    + event({ type: "text_delta", delta: "overflow" }))]), new AbortController().signal, delta => deltas.push(delta)));
  assert.deepEqual(deltas, [maximum]);
});
