import assert from "node:assert/strict";
import { test } from "node:test";
import { createAudioRecording } from "../application/createAudioRecording";
import type { CaptureCallbacks } from "../capture/browserCapture";
import { DictationFailure } from "../model/errors";
import { deferred } from "./support/browser";

function harness() {
  let callbacks!: CaptureCallbacks, aborted = 0, stopped = 0;
  const stopResult = deferred<void>(), wavs: ArrayBuffer[] = [], errors: unknown[] = [], seconds: number[] = [];
  const timers = new Map<number, () => void>();
  const recorder = createAudioRecording({ onReady() {}, onProcessing() {}, onElapsed: (value) => seconds.push(value),
    onComplete: (wav) => wavs.push(wav), onError: (error) => errors.push(error),
    schedule: (callback, ms) => { timers.set(ms, callback); return () => { timers.delete(ms); }; },
    capture: (handlers) => { callbacks = handlers; return { start() {}, abort() { aborted++; }, stop() { stopped++; return stopResult.promise; } }; },
  });
  recorder.start();
  return { recorder, callbacks, stopResult, wavs, errors, seconds, timers, aborted: () => aborted, stopped: () => stopped };
}

test("stop waits for the last worklet batch, emits one canonical WAV and releases capture", async () => {
  const h = harness(); h.callbacks.onReady();
  h.callbacks.onSamples(new Float32Array(8000).fill(.1), 16000);
  const ending = h.recorder.stop(); void h.recorder.stop();
  assert.equal(h.wavs.length, 0); assert.equal(h.stopped(), 1);
  h.callbacks.onSamples(new Float32Array(4000).fill(.1), 16000);
  h.stopResult.resolve(); await ending;
  assert.equal(h.wavs.length, 1); assert.equal(h.wavs[0].byteLength, 24044);
  assert.equal(h.aborted(), 1); assert.equal(h.timers.size, 0);
});

test("abort while flushing publishes no recording and ignores late capture callbacks", async () => {
  const h = harness(); h.callbacks.onReady(); h.callbacks.onSamples(new Float32Array(8000).fill(.1), 16000);
  const stopping = h.recorder.stop(); h.recorder.abort();
  h.callbacks.onSamples(new Float32Array(4000).fill(.1), 16000); h.callbacks.onError(new Error("Late"));
  h.stopResult.resolve(); await stopping;
  assert.equal(h.wavs.length, 0); assert.equal(h.errors.length, 0); assert.equal(h.aborted(), 1);
});

for (const [name, samples] of [["too-short", new Float32Array(100).fill(.1)], ["silent", new Float32Array(8000)]] as const) {
  test(`${name} audio stays local and returns a friendly error`, async () => {
    const h = harness(); h.callbacks.onReady(); h.callbacks.onSamples(samples, 16000);
    const stopping = h.recorder.stop(); h.stopResult.resolve(); await stopping;
    assert.equal(h.wavs.length, 0); assert.equal((h.errors[0] as DictationFailure).code, name);
    assert.equal(h.aborted(), 1);
  });
}

test("sample count bounds an oversized batch to exactly 60 seconds and auto-stops once", async () => {
  const h = harness(); h.callbacks.onReady();
  h.callbacks.onSamples(new Float32Array(16000 * 61).fill(.1), 16000); h.callbacks.onLimit();
  assert.equal(h.stopped(), 1); assert.deepEqual(h.seconds, [60]);
  h.stopResult.resolve(); await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(h.wavs[0].byteLength, 1920044); assert.equal(h.wavs.length, 1);
});

test("permission wait and listening time are bounded and cancel cleans all timers", () => {
  const h = harness(); h.timers.get(60000)?.();
  assert.equal((h.errors[0] as DictationFailure).code, "startup-timeout");
  assert.equal(h.aborted(), 1); assert.equal(h.timers.size, 0);
  const running = harness(); running.callbacks.onReady(); running.timers.get(60000)?.();
  assert.equal(running.stopped(), 1); running.recorder.abort(); assert.equal(running.timers.size, 0);
});

test("synchronous cancellation from ready cannot leave a recording timer behind", () => {
  let callbacks!: CaptureCallbacks, timerCount = 0;
  const recorder = createAudioRecording({ onReady: () => recorder.abort(), onElapsed() {}, onProcessing() {},
    onComplete: () => assert.fail("Cancelled recording completed"), onError: (error) => assert.fail(String(error)),
    schedule: () => { timerCount++; let active = true; return () => { if (active) { active = false; timerCount--; } }; },
    capture: (handlers) => { callbacks = handlers; return { start() {}, abort() {}, stop: async () => undefined }; },
  });
  recorder.start(); callbacks.onReady(); assert.equal(timerCount, 0);
});
