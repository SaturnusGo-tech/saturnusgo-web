import assert from "node:assert/strict";
import { test } from "node:test";
import { createBrowserCapture } from "../../capture/browserCapture";
import { browserHarness, flush } from "../support/browser";

test("capture resumes audio in the click turn and connects only a silent graph", async () => {
  const browser = browserHarness(); let ready = 0;
  const samples: Float32Array[] = [];
  const capture = createBrowserCapture({ onReady: () => { ready++; }, onSamples: (chunk) => samples.push(chunk), onLimit() {}, onError: (error) => assert.fail(String(error)) }, browser.dependencies);
  capture.start();
  assert.equal(browser.contexts[0].resumes, 1); assert.equal(browser.mediaCalls(), 1);
  assert.equal(ready, 0);
  await flush();
  const context = browser.contexts[0], node = browser.nodes[0];
  assert.equal(ready, 0); assert.equal(context.resumes, 2);
  assert.deepEqual(context.modules, ["/falcon/ai/dictation-capture.worklet.js?v=20260919-capture"]);
  node.samples(new Float32Array([.05])); assert.equal(ready, 1);
  assert.deepEqual(context.source.connected, [node]); assert.deepEqual(node.connected, [context.gainNode]);
  assert.equal(context.gainNode.gain.value, 0);
  node.lastBatch = new Float32Array([.1, .2]);
  const stopped = capture.stop();
  assert.deepEqual(browser.tracks.map((track) => track.stops), [1, 1]);
  assert.equal(context.closes, 0);
  await stopped;
  assert.equal(samples.length, 2); assert.equal(samples[1].length, 2);
  assert.equal(context.closes, 1); assert.equal(node.port.closed, 1);
});

test("a microphone permission grant arriving after abort is immediately released", async () => {
  const browser = browserHarness({ pendingMedia: true }); let ready = 0;
  const capture = createBrowserCapture({ onReady: () => { ready++; }, onSamples: assert.fail, onLimit: assert.fail, onError: (error) => assert.fail(String(error)) }, browser.dependencies);
  capture.start(); capture.abort(); browser.permission.resolve(browser.stream); await flush();
  assert.deepEqual(browser.tracks.map((track) => track.stops), [1, 1]);
  assert.equal(browser.contexts[0].closes, 1); assert.equal(browser.nodes.length, 0); assert.equal(ready, 0);
});

for (const pending of ["pendingModule", "pendingResume"] as const) {
  test(`abort during ${pending} releases tracks and ignores late setup completion`, async () => {
    const browser = browserHarness({ [pending]: true });
    const capture = createBrowserCapture({ onReady: assert.fail, onSamples: assert.fail, onLimit: assert.fail, onError: (error) => assert.fail(String(error)) }, browser.dependencies);
    capture.start(); await flush(); capture.abort();
    browser.module.resolve(); browser.resumed.resolve(); await flush();
    assert.deepEqual(browser.tracks.map((track) => track.stops), [1, 1]);
    assert.equal(browser.contexts[0].closes, 1); assert.equal(browser.nodes.length, 0);
  });
}

test("permission denial and worklet errors release every resource and report once", async () => {
  const browser = browserHarness({ pendingMedia: true }); const errors: unknown[] = [];
  const capture = createBrowserCapture({ onReady: assert.fail, onSamples: assert.fail, onLimit() {}, onError: (error) => errors.push(error) }, browser.dependencies);
  capture.start(); browser.permission.reject({ name: "NotAllowedError" }); await flush();
  assert.equal(errors.length, 1); assert.equal((errors[0] as { code: string }).code, "not-allowed");
  assert.equal(browser.contexts[0].closes, 1);
  const active = browserHarness();
  const recording = createBrowserCapture({ onReady() {}, onSamples: assert.fail, onLimit() {}, onError: (error) => errors.push(error) }, active.dependencies);
  recording.start(); await flush(); active.nodes[0].onprocessorerror?.();
  assert.equal(errors.length, 2); assert.equal(active.contexts[0].closes, 1);
  assert.deepEqual(active.tracks.map((track) => track.stops), [1, 1]);
});

test("a missing flush acknowledgement fails instead of accepting audio with a missing tail", async () => {
  const browser = browserHarness({ noFlush: true });
  const errors: unknown[] = [];
  const capture = createBrowserCapture({ onReady() {}, onSamples() {}, onLimit() {}, onError: (error) => errors.push(error) }, browser.dependencies);
  capture.start(); await flush(); const stopped = capture.stop();
  assert.deepEqual(browser.tracks.map((track) => track.stops), [1, 1]);
  await assert.rejects(stopped); assert.equal(browser.contexts[0].closes, 1); assert.equal(errors.length, 1);
});
