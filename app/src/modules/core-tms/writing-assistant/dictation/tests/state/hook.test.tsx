import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react-test-renderer";
import { hookHarness, target } from "./hook-harness";
import { flush } from "../support/browser";
import { TmsApiError } from "../../../../../../core/tms/transport/http";

test("only a click starts capture; stop uploads canonical WAV and a successful result appends once", async (t) => {
  const h = hookHarness(t, { text: "Перепиши" });
  assert.equal(h.browser.contexts.length, 0); assert.equal(h.requests.length, 0);
  await h.start(); h.samples();
  assert.equal(h.get().state, "listening"); assert.equal(h.text(), "Перепиши"); assert.equal(h.requests.length, 0);
  await h.stop();
  assert.equal(h.get().state, "transcribing");
  assert.deepEqual(h.browser.tracks.map((track) => track.stops), [1, 1]);
  assert.equal(h.requests.length, 1); assert.equal(h.requests[0].path, "/workspaces/workspace-a/ai/dictation");
  assert.equal(h.requests[0].body.language, undefined); assert.equal(h.requests[0].method, "POST");
  const wav = Buffer.from(h.requests[0].body.audio, "base64");
  assert.equal(wav.toString("ascii", 0, 4), "RIFF"); assert.equal(wav.readUInt32LE(24), 16000);
  assert.equal(wav.length, 16044);
  await h.reply("корректнее"); assert.equal(h.text(), "Перепиши корректнее"); assert.equal(h.get().state, "idle");
  await h.start(); h.samples(); await h.stop(); await h.reply("и добавь Markdown");
  assert.equal(h.text(), "Перепиши корректнее и добавь Markdown"); assert.equal(h.applied(), 0);
  assert.ok(h.requests.every((request) => request.path.endsWith("/ai/dictation")));
});

test("cancelling recording drops audio and never changes the manual command", async (t) => {
  const h = hookHarness(t, { text: "Manual command" }); await h.start(); h.samples();
  act(() => h.get().cancel()); await flush();
  assert.equal(h.text(), "Manual command"); assert.equal(h.requests.length, 0);
  assert.deepEqual(h.browser.tracks.map((track) => track.stops), [1, 1]);
});

test("cancelling transcription aborts HTTP and ignores a late successful response", async (t) => {
  const h = hookHarness(t, { text: "Manual" }); await h.start(); h.samples(); await h.stop();
  act(() => h.get().cancel()); assert.equal(h.requests[0].signal?.aborted, true);
  await h.reply("Late words"); assert.equal(h.text(), "Manual"); assert.equal(h.get().state, "idle");
});

for (const [name, update] of [
  ["disabled", { enabled: false }], ["workspace", { workspaceId: "workspace-b" }],
  ["target", { target: target() }],
] as const) {
  test(`${name} change aborts transcription and ignores responses from the old context`, async (t) => {
    const h = hookHarness(t, { text: "Typed" }); await h.start(); h.samples(); await h.stop();
    h.update(update); assert.equal(h.requests[0].signal?.aborted, true);
    await h.reply("Wrong context"); assert.equal(h.text(), "Typed"); assert.equal(h.get().state, "idle");
  });
}

test("unmount cancels an unresolved microphone permission request and releases a late grant", async (t) => {
  const h = hookHarness(t, { text: "Typed", browser: { pendingMedia: true } }); h.startSync(); h.unmount();
  h.browser.permission.resolve(h.browser.stream); await flush();
  assert.deepEqual(h.browser.tracks.map((track) => track.stops), [1, 1]);
  assert.equal(h.browser.contexts[0].closes, 1); assert.equal(h.requests.length, 0); assert.equal(h.changes.length, 0);
});

test("hiding the page cancels capture without uploading audio", async (t) => {
  const h = hookHarness(t, { text: "Typed" }); await h.start(); h.samples();
  act(() => { h.document.hidden = true; h.document.dispatchEvent(new Event("visibilitychange")); });
  assert.deepEqual(h.browser.tracks.map((track) => track.stops), [1, 1]);
  assert.equal(h.requests.length, 0); assert.equal(h.text(), "Typed");
});

test("permission rejection and provider failures preserve typed text", async (t) => {
  const h = hookHarness(t, { text: "Manual", browser: { pendingMedia: true } }); h.startSync();
  await act(async () => { h.browser.permission.reject({ name: "NotAllowedError" }); await flush(); });
  assert.equal(h.get().state, "idle"); assert.match(h.get().error, /микрофон/); assert.equal(h.text(), "Manual");
  assert.equal(h.requests.length, 0);
});

for (const [status, code] of [[429, "DICTATION_RATE_LIMITED"], [503, "DICTATION_UNAVAILABLE"], [422, "DICTATION_EMPTY"]] as const) {
  test(`${code} leaves the manual command untouched with a readable error`, async (t) => {
    const h = hookHarness(t, { text: "Manual" }); await h.start(); h.samples(); await h.stop();
    await act(async () => { h.requests[0].reply.reject(new TmsApiError("Provider error", status, null, code)); await flush(); });
    assert.equal(h.get().state, "idle"); assert.ok(h.get().error); assert.equal(h.text(), "Manual");
  });
}

test("short and silent recordings remain local", async (t) => {
  const h = hookHarness(t, { text: "Manual" }); await h.start(); h.samples(100); await h.stop();
  assert.match(h.get().error, /коротк/); assert.equal(h.requests.length, 0); assert.equal(h.text(), "Manual");
  await h.start(); h.samples(24000, 0); await h.stop();
  assert.match(h.get().error, /не слышен/); assert.equal(h.requests.length, 0);
});

test("transcription exceeding the command limit preserves the entire transcript without automatic submission", async (t) => {
  const h = hookHarness(t, { text: "x".repeat(15995) }); await h.start(); h.samples(); await h.stop();
  await h.reply("more words here");
  assert.equal(h.text(), `${"x".repeat(15995)} more words here`); assert.match(h.get().notice, /Вся диктовка сохранена/);
  assert.equal(h.applied(), 0); assert.equal(h.requests.length, 1);
});

test("a command edited externally while transcribing is not overwritten", async (t) => {
  const h = hookHarness(t, { text: "Old command" }); await h.start(); h.samples(); await h.stop();
  h.edit("New manual command"); await h.reply("dictation");
  assert.equal(h.text(), "New manual command"); assert.match(h.get().error, /изменена/);
});

test("a stalled final audio flush does not upload a partial command", async (t) => {
  const h = hookHarness(t, { text: "Manual", browser: { noFlush: true } });
  await h.start(); h.samples(); await h.stop();
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 450)); });
  assert.equal(h.requests.length, 0); assert.equal(h.text(), "Manual"); assert.ok(h.get().error);
  assert.equal(h.get().state, "idle"); assert.equal(h.browser.contexts[0].closes, 1);
});
