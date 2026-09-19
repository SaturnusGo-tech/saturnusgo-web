import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react-test-renderer";
import { hookHarness } from "../state/hook-harness";

for (const interruption of ["muted", "suspended", "interrupted"] as const) {
  test(`${interruption} input aborts recording without uploading or inserting a partial sentence`, async (t) => {
    const h = hookHarness(t, { text: "Existing command" });
    await h.start(); h.samples(48000);
    assert.equal(h.get().state, "listening");
    act(() => {
      if (interruption === "muted") h.browser.tracks[0].setMuted(true);
      else h.browser.contexts[0].setState(interruption);
    });
    h.samples(24000); await h.stop();
    assert.equal(h.get().state, "idle"); assert.ok(h.get().error);
    assert.equal(h.requests.length, 0); assert.equal(h.text(), "Existing command");
    assert.equal(h.changes.length, 0); assert.equal(h.browser.contexts[0].state, "closed");
    assert.deepEqual(h.browser.tracks.map(track => track.stops), [1, 1]);
  });
}

test("recording time advances in tenths and its level distinguishes silence, quiet and loud input", async (t) => {
  const h = hookHarness(t);
  await h.start(); assert.equal(h.get().state, "starting");
  assert.equal(h.get().elapsed, 0); assert.equal(h.get().level, 0);
  h.samples(4800, 0);
  assert.equal(h.get().elapsed, .1); assert.equal(h.get().level, 0);
  h.samples(4800, .003); const quiet = h.get().level;
  assert.equal(h.get().elapsed, .2); assert.ok(quiet > 0 && quiet < 1);
  h.samples(4800, .3); const loud = h.get().level;
  assert.equal(h.get().elapsed, .3); assert.ok(loud > quiet && loud <= 1);
  h.samples(4800, 0);
  assert.equal(h.get().elapsed, .4); assert.equal(h.get().level, 0);
  assert.equal(h.requests.length, 0);
  act(() => h.get().cancel());
});

test("frozen audio frames abort a partial command even when the browser still reports running", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const h = hookHarness(t, { text: "Existing command" });
  await h.start(); h.samples(24000);
  assert.equal(h.browser.contexts[0].state, "running");
  assert.ok(h.browser.tracks.every(track => !track.muted));
  act(() => t.mock.timers.tick(2499)); assert.equal(h.get().state, "listening");
  act(() => t.mock.timers.tick(1));
  assert.equal(h.get().state, "idle"); assert.ok(h.get().error);
  h.samples(24000); await h.stop();
  assert.equal(h.requests.length, 0); assert.equal(h.text(), "Existing command");
  assert.equal(h.changes.length, 0); assert.equal(h.browser.contexts[0].state, "closed");
});

test("silent frames between phrases refresh the heartbeat and preserve the complete recording", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const h = hookHarness(t);
  await h.start(); h.samples(24000);
  for (let pause = 0; pause < 2; pause++) {
    act(() => t.mock.timers.tick(2000)); h.samples(96000, 0);
    assert.equal(h.get().state, "listening"); assert.equal(h.get().error, "");
  }
  h.samples(24000); await h.stop();
  assert.equal(h.requests.length, 1); assert.equal(h.get().elapsed, 5);
  const wav = Buffer.from(h.requests[0].body.audio, "base64");
  assert.equal(wav.readUInt32LE(40), 16000 * 5 * 2);
  const samples = new Int16Array(wav.buffer, wav.byteOffset + 44, 16000 * 5);
  assert.ok(samples.subarray(0, 7990).some(sample => sample !== 0));
  assert.ok(samples.subarray(8020, 71980).every(sample => sample === 0));
  assert.ok(samples.subarray(72020).some(sample => sample !== 0));
  act(() => t.mock.timers.tick(10000));
  assert.equal(h.get().state, "transcribing"); assert.equal(h.get().error, "");
  await h.reply("Первая фраза. Вторая фраза.");
  assert.equal(h.text(), "Первая фраза. Вторая фраза.");
});
