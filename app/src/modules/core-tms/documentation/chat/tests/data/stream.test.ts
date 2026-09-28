import assert from "node:assert/strict";
import { test } from "node:test";
import { readPersistentGuideStream } from "../../history/data/persistent-stream";
import { guideError } from "../../data/guide-error";

const encoder = new TextEncoder(), time = "2026-09-28T10:00:00.000Z";
const answer = { answer: "Проверьте сборку 🚀", citations: [], knowledgeVersion: "fixture" };
const chat = { id: "94e3be6c-8fc9-48a9-b4c4-4d5e98e0c040", title: "Question", locale: "ru", version: 1,
  createdAt: time, updatedAt: time, archivedAt: null, pendingTurnId: "9302bbdf-79bb-4528-9d03-694064432151" };
const turn = { id: chat.pendingTurnId, question: "Question", state: "pending", answer: null, errorCode: null, createdAt: time, completedAt: null };
const event = (data: unknown) => `data: ${JSON.stringify(data)}\n\n`;
const accepted = event({ type: "accepted", chat, turn });
const complete = (data = answer) => ({ type: "complete", data, chat: { ...chat, version: 2, pendingTurnId: null },
  turn: { ...turn, state: "completed", answer: data, completedAt: time } });
function response(text: string, fragmented = false) {
  const bytes = encoder.encode(text), chunks = fragmented ? [...bytes].map(byte => new Uint8Array([byte])) : [bytes];
  return new Response(new ReadableStream({ start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close(); } }),
    { headers: { "content-type": "text/event-stream; charset=utf-8" } });
}
const noop = { accepted() {}, delta() {} };

test("fragmented UTF-8 and CRLF reconstruct accepted, real deltas and saved completion", async () => {
  const text = accepted + ": keepalive\r\n\r\ndata: {\"type\":\"text_delta\",\r\ndata: \"delta\":\"Проверьте \"}\r\n\r\n"
    + event({ type: "text_delta", delta: "сборку 🚀" }) + event(complete());
  const deltas: string[] = [], result = await readPersistentGuideStream(response(text, true), new AbortController().signal,
    { accepted(value) { assert.equal(value.turn.id, turn.id); }, delta: text => deltas.push(text) });
  assert.deepEqual(deltas, ["Проверьте ", "сборку 🚀"]); assert.equal(result.turn.answer?.answer, answer.answer);
});

test("a delta is observable before completion; completed replay does not fabricate characters", async () => {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new Response(new ReadableStream({ start(value) { controller = value; } }), { headers: { "content-type": "text/event-stream" } });
  const deltas: string[] = [], pending = readPersistentGuideStream(stream, new AbortController().signal, { accepted() {}, delta: value => deltas.push(value) });
  controller.enqueue(encoder.encode(accepted + event({ type: "text_delta", delta: "Проверьте " })));
  await new Promise(resolve => setTimeout(resolve, 0)); assert.deepEqual(deltas, ["Проверьте "]);
  controller.enqueue(encoder.encode(event(complete()))); controller.close(); await pending;
  const replay: string[] = [];
  await readPersistentGuideStream(response(event({ type: "accepted", chat, turn: complete().turn }) + event(complete())),
    new AbortController().signal, { accepted() {}, delta: value => replay.push(value) });
  assert.deepEqual(replay, []);
});

test("incomplete, malformed, mismatched and errored streams cannot return completed answers", async () => {
  for (const text of [accepted + event({ type: "text_delta", delta: "Partial" }), "data: not-json\n\n",
    event({ type: "text_delta", delta: "Before acceptance" }), accepted + event({ ...complete(), turn: { ...complete().turn, id: "wrong" } }),
    accepted + event({ ...complete(), data: { answer: "invalid" } })]) {
    await assert.rejects(readPersistentGuideStream(response(text), new AbortController().signal, noop));
  }
  for (const [code, expected] of [["AI_GUIDE_UNAVAILABLE", "unavailable"], ["AI_GUIDE_RATE_LIMITED", "limited"], ["AI_GUIDE_OUTPUT_INVALID", "invalid"]] as const) {
    await assert.rejects(readPersistentGuideStream(response(accepted + event({ type: "error", error: { code, message: "Safe error", requestId: "fixture" } })),
      new AbortController().signal, noop), error => guideError(error) === expected);
  }
});

test("aborting the read closes its body without terminal success", async () => {
  let cancelled = false;
  const stream = new Response(new ReadableStream({ cancel() { cancelled = true; } }), { headers: { "content-type": "text/event-stream" } });
  const abort = new AbortController(), pending = readPersistentGuideStream(stream, abort.signal, noop);
  abort.abort(); await assert.rejects(pending, error => (error as Error).name === "AbortError"); assert.equal(cancelled, true);
});

test("streamed text respects the cumulative 16k answer limit before publishing each delta", async () => {
  const maximum = "a".repeat(16000), deltas: string[] = [], data = { ...answer, answer: maximum };
  await readPersistentGuideStream(response(accepted + event({ type: "text_delta", delta: maximum }) + event(complete(data))),
    new AbortController().signal, { accepted() {}, delta: value => deltas.push(value) });
  assert.deepEqual(deltas, [maximum]); deltas.length = 0;
  await assert.rejects(readPersistentGuideStream(response(accepted + event({ type: "text_delta", delta: maximum }) + event({ type: "text_delta", delta: "overflow" })),
    new AbortController().signal, { accepted() {}, delta: value => deltas.push(value) }));
  assert.deepEqual(deltas, [maximum]);
});
