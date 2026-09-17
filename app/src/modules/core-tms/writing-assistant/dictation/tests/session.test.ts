import assert from "node:assert/strict";
import { test } from "node:test";
import { harness, result } from "./harness";

test("configures recognition and aggregates the result list without duplicating earlier words", () => {
  const h = harness();
  h.session.start(); h.session.start();
  assert.equal(h.recognition.starts, 1);
  assert.equal(h.recognition.lang, "ru-RU");
  assert.equal(h.recognition.continuous, true);
  assert.equal(h.recognition.interimResults, true);
  assert.deepEqual(h.states, ["starting"]);
  h.recognition.onstart?.();
  h.recognition.onresult?.(result([["Перепиши", false]]));
  h.recognition.onresult?.(result([["Перепиши", true], ["кор", false]], 1));
  h.recognition.onresult?.(result([["Перепиши", true], ["корректнее", false]], 1));
  h.recognition.onresult?.(result([["Перепиши", true], ["корректнее", false]], 1));
  h.recognition.onresult?.(result([["Перепиши", true], ["корректнее", true]], 1));
  assert.deepEqual(h.transcripts, [
    { final: "", interim: "Перепиши" }, { final: "Перепиши", interim: "кор" },
    { final: "Перепиши", interim: "корректнее" }, { final: "Перепиши корректнее", interim: "" },
  ]);
  h.session.abort();
});

test("stop waits for the browser's final result and returns to idle on end", () => {
  const h = harness(); h.session.start(); h.recognition.onstart?.();
  h.recognition.onresult?.(result([["Добавь Markdown", false]]));
  h.session.stop(); h.session.stop();
  assert.equal(h.recognition.stops, 1);
  assert.deepEqual(h.states, ["starting", "listening", "stopping"]);
  h.recognition.onresult?.(result([["Добавь Markdown", true]]));
  h.recognition.onend?.();
  assert.deepEqual(h.transcripts[h.transcripts.length - 1], { final: "Добавь Markdown", interim: "" });
  assert.equal(h.states[h.states.length - 1], "idle");
  assert.equal(h.recognition.aborts, 0);
  assert.equal(h.timers.size, 0);
  assert.equal(h.recognition.onresult, null);
});

test("stop fallback releases a stalled microphone and discards unconfirmed interim words", () => {
  const h = harness(); h.session.start(); h.recognition.onstart?.();
  h.recognition.onresult?.(result([["Сократи", true], ["не уверен", false]]));
  h.session.stop(); h.advance(1499);
  assert.equal(h.recognition.aborts, 0);
  h.advance(1);
  assert.equal(h.recognition.aborts, 1);
  assert.equal(h.states[h.states.length - 1], "idle");
  assert.deepEqual(h.transcripts[h.transcripts.length - 1], { final: "Сократи", interim: "" });
  assert.equal(h.timers.size, 0);
});

test("abort immediately releases recognition and ignores saved late callbacks", () => {
  const h = harness(); h.session.start(); h.recognition.onstart?.();
  h.recognition.onresult?.(result([["Draft", false]]));
  const lateResult = h.recognition.onresult, lateError = h.recognition.onerror, lateStart = h.recognition.onstart;
  h.session.abort(); h.session.abort();
  lateResult?.(result([["Stale final", true]])); lateError?.({ error: "network" }); lateStart?.();
  h.advance(120000);
  assert.equal(h.recognition.aborts, 1);
  assert.deepEqual(h.transcripts, [{ final: "", interim: "Draft" }]);
  assert.deepEqual(h.errors, []);
  assert.deepEqual(h.states, ["starting", "listening", "idle"]);
  assert.equal(h.timers.size, 0);
});

test("stop cancels an unresolved permission request and does not start a late session", () => {
  const h = harness(); h.session.start();
  const lateStart = h.recognition.onstart;
  h.session.stop(); lateStart?.(); h.advance(120000);
  assert.equal(h.recognition.aborts, 1);
  assert.equal(h.recognition.stops, 0);
  assert.deepEqual(h.states, ["starting", "idle"]);
  assert.deepEqual(h.errors, []);
});

test("permission wait is bounded and abort before start prevents all capture", () => {
  const h = harness(); h.session.start(); h.advance(10000);
  assert.deepEqual(h.errors, ["startup-timeout"]);
  assert.equal(h.recognition.aborts, 1);
  assert.equal(h.states[h.states.length - 1], "idle");
  const cancelled = harness(); cancelled.session.abort(); cancelled.session.start();
  assert.equal(cancelled.recognition.starts, 0);
  assert.deepEqual(cancelled.states, []);
});

test("recording duration is bounded, with time measured from actual microphone start", () => {
  const h = harness(); h.session.start(); h.advance(9000); h.recognition.onstart?.();
  h.advance(59999); assert.equal(h.recognition.stops, 0);
  h.advance(1); assert.equal(h.recognition.stops, 1);
  h.advance(1500); assert.equal(h.recognition.aborts, 1);
  assert.equal(h.timers.size, 0);
});

for (const code of ["not-allowed", "service-not-allowed", "audio-capture", "network", "no-speech", "language-not-supported"] as const) {
  test(`browser ${code} error is reported once and releases capture`, () => {
    const h = harness(); h.session.start(); h.recognition.onstart?.();
    const lateError = h.recognition.onerror;
    h.recognition.onerror?.({ error: code }); lateError?.({ error: code });
    assert.deepEqual(h.errors, [code]);
    assert.equal(h.recognition.aborts, 1);
    assert.equal(h.states[h.states.length - 1], "idle");
    assert.equal(h.timers.size, 0);
  });
}

test("silence following finalized speech ends normally without a misleading no-speech error", () => {
  const h = harness(); h.session.start(); h.recognition.onstart?.();
  h.recognition.onresult?.(result([["Keep this", true]]));
  h.recognition.onerror?.({ error: "no-speech" });
  assert.deepEqual(h.errors, []);
  assert.deepEqual(h.transcripts, [{ final: "Keep this", interim: "" }]);
  assert.equal(h.states[h.states.length - 1], "idle");
});

test("factory and synchronous permission failures return readable error codes", () => {
  const unavailable = harness({ factoryFailure: true }); unavailable.session.start();
  assert.deepEqual(unavailable.errors, ["unavailable"]);
  assert.equal(unavailable.timers.size, 0);
  const denied = harness({ startFailure: { name: "NotAllowedError" } }); denied.session.start();
  assert.deepEqual(denied.errors, ["not-allowed"]);
  assert.equal(denied.recognition.aborts, 1);
  assert.equal(denied.timers.size, 0);
});

test("a synchronous stop failure still releases recognition and preserves the final draft", () => {
  const h = harness(); h.session.start(); h.recognition.onstart?.();
  h.recognition.onresult?.(result([["Keep", true], ["uncertain", false]]));
  h.recognition.stopFailure = new Error("Already stopped"); h.session.stop();
  assert.deepEqual(h.transcripts[h.transcripts.length - 1], { final: "Keep", interim: "" });
  assert.equal(h.recognition.aborts, 1);
  assert.equal(h.timers.size, 0);
});
