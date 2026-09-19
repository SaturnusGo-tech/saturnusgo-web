import assert from "node:assert/strict";
import { test } from "node:test";
import { createBrowserCapture } from "../../capture/browserCapture";
import { browserHarness, flush } from "../support/browser";

test("connected graph remains starting until its first nonempty input batch", async (t) => {
  const browser = browserHarness(), received: Float32Array[] = [];
  let ready = 0;
  const capture = createBrowserCapture({ onReady: () => { ready++; }, onSamples: (samples) => received.push(samples),
    onLimit: assert.fail, onError: (error) => assert.fail(String(error)) }, browser.dependencies);
  t.after(capture.abort); capture.start(); await flush();
  assert.equal(ready, 0); assert.equal(browser.contexts[0].state, "running");
  browser.nodes[0].samples(new Float32Array()); assert.equal(ready, 0);
  const firstWord = Float32Array.from({ length: 2048 }, (_, i) => Math.sin(i / 8) * .12);
  browser.nodes[0].samples(firstWord);
  assert.equal(ready, 1); assert.deepEqual(received, [firstWord]);
});

test("initially muted microphone waits for input after unmute and retains the first word", async (t) => {
  const browser = browserHarness({ initiallyMuted: true }), received: Float32Array[] = [];
  let ready = 0;
  const capture = createBrowserCapture({ onReady: () => { ready++; }, onSamples: (samples) => received.push(samples),
    onLimit: assert.fail, onError: (error) => assert.fail(String(error)) }, browser.dependencies);
  t.after(capture.abort); capture.start(); await flush();
  browser.nodes[0].samples(new Float32Array(2048));
  assert.equal(ready, 0); assert.equal(received.length, 0);
  browser.tracks.forEach(track => track.setMuted(false));
  assert.equal(ready, 0);
  const firstWord = Float32Array.from({ length: 2048 }, (_, i) => Math.sin(i / 7) * .03);
  browser.nodes[0].samples(firstWord);
  assert.equal(ready, 1); assert.deepEqual(received, [firstWord]);
});

test("opening the microphone interrupts the initial session and setup resumes it again", async (t) => {
  const browser = browserHarness({ pendingMedia: true }); let ready = 0;
  const capture = createBrowserCapture({ onReady: () => { ready++; }, onSamples() {}, onLimit: assert.fail, onError: (error) => assert.fail(String(error)) }, browser.dependencies);
  t.after(capture.abort); capture.start(); await flush();
  const context = browser.contexts[0];
  assert.equal(context.state, "running"); assert.equal(context.resumes, 1);
  context.setState("interrupted"); browser.permission.resolve(browser.stream); await flush();
  assert.deepEqual(context.resumeStates, ["suspended", "interrupted"]);
  assert.equal(context.state, "running"); assert.equal(ready, 0);
  browser.nodes[0].samples(new Float32Array(2048)); assert.equal(ready, 1);
});

test("raw microphone constraints do not request speech suppression or language selection", async (t) => {
  const browser = browserHarness(); browser.install(t);
  const capture = createBrowserCapture({ onReady() {}, onSamples() {}, onLimit: assert.fail, onError: (error) => assert.fail(String(error)) });
  t.after(capture.abort); capture.start(); await flush();
  assert.deepEqual(browser.constraints, [{ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false }]);
});

test("a graph with no audio frames fails after eight seconds and releases the microphone", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const browser = browserHarness(), errors: unknown[] = [];
  const capture = createBrowserCapture({ onReady: assert.fail, onSamples: assert.fail, onLimit: assert.fail,
    onError: (error) => errors.push(error) }, browser.dependencies);
  t.after(capture.abort); capture.start(); await flush();
  t.mock.timers.tick(7999); assert.equal(errors.length, 0);
  t.mock.timers.tick(1);
  assert.equal((errors[0] as { code: string }).code, "no-input");
  assert.deepEqual(browser.tracks.map(track => track.stops), [1, 1]);
  assert.equal(browser.contexts[0].state, "closed");
});

test("a pending initial resume cannot prevent post-permission input startup", async (t) => {
  const browser = browserHarness({ pendingResumeCalls: [1] }); let ready = 0;
  const capture = createBrowserCapture({ onReady: () => { ready++; }, onSamples() {}, onLimit: assert.fail, onError: (error) => assert.fail(String(error)) }, browser.dependencies);
  t.after(capture.abort); capture.start(); await flush();
  assert.equal(browser.contexts[0].resumes, 2); assert.equal(browser.contexts[0].state, "running");
  browser.nodes[0].samples(new Float32Array(2048)); assert.equal(ready, 1);
  capture.abort(); browser.resumed.resolve(); await flush();
  assert.equal(browser.contexts[0].state, "closed"); assert.equal(ready, 1);
});

test("a stalled post-permission resume is bounded and cannot reactivate after timeout", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const browser = browserHarness({ pendingResumeCalls: [2] }), errors: unknown[] = [];
  const capture = createBrowserCapture({ onReady: assert.fail, onSamples: assert.fail, onLimit: assert.fail,
    onError: (error) => errors.push(error) }, browser.dependencies);
  t.after(capture.abort); capture.start(); await flush();
  assert.equal(browser.contexts[0].resumes, 2); assert.equal(browser.nodes.length, 0);
  t.mock.timers.tick(8000);
  assert.equal((errors[0] as { code: string }).code, "no-input");
  browser.resumed.resolve(); await flush();
  assert.equal(browser.contexts[0].state, "closed"); assert.equal(browser.nodes.length, 0);
  assert.equal(errors.length, 1); assert.deepEqual(browser.tracks.map(track => track.stops), [1, 1]);
});
