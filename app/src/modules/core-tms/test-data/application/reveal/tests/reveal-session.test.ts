import test from "node:test";
import assert from "node:assert/strict";
import { createRevealSession } from "../reveal-session";

function clock() {
  let now = 1_000;
  const timers = new Set<() => void>();
  return { now: () => now,
    schedule(callback: () => void, delay: number) { assert.equal(delay, 30_000); timers.add(callback); return () => timers.delete(callback); },
    expire() { now = 40_000; for (const callback of [...timers]) callback(); },
    get timers() { return timers.size; },
  };
}

test("a revealed value clears when the display timeout expires", async () => {
  const time = clock();
  const session = createRevealSession(time);
  await session.reveal("actor/project/resource/attempt", async () => ({ value: "temporary-test-secret", expiresAt: 31_000 }));
  assert.equal(session.read().status, "visible");
  time.expire();
  assert.deepEqual(session.read(), { status: "hidden" });
  assert.equal(time.timers, 0);
});

test("closing while reveal is pending prevents the response from restoring the secret", async () => {
  const session = createRevealSession(clock());
  let resolve!: (value: { value: string; expiresAt: number }) => void;
  const pending = session.reveal("scope-a", () => new Promise(done => { resolve = done; }));
  session.hide();
  resolve({ value: "must-not-reappear", expiresAt: 31_000 });
  await pending;
  assert.deepEqual(session.read(), { status: "hidden" });
});

test("changing actor, resource or execution clears an already revealed value", async () => {
  const time = clock();
  const session = createRevealSession(time);
  await session.reveal("scope-a", async () => ({ value: "temporary", expiresAt: 31_000 }));
  session.changeScope("scope-b");
  assert.deepEqual(session.read(), { status: "hidden" });
  assert.equal(time.timers, 0);
});

test("a late response for another scope cannot replace current state", async () => {
  const session = createRevealSession(clock());
  let resolve!: (value: { value: string; expiresAt: number }) => void;
  const old = session.reveal("scope-a", () => new Promise(done => { resolve = done; }));
  session.changeScope("scope-b");
  await session.reveal("scope-b", async () => ({ value: "current", expiresAt: 31_000 }));
  resolve({ value: "old", expiresAt: 31_000 });
  await old;
  assert.deepEqual(session.read(), { status: "visible", value: "current", expiresAt: 31_000 });
  session.hide();
});

test("expired responses and rejected requests retain no secret in error state", async () => {
  const session = createRevealSession(clock());
  await session.reveal("scope", async () => ({ value: "expired", expiresAt: 999 }));
  assert.deepEqual(session.read(), { status: "hidden" });
  await session.reveal("scope", async () => { throw new Error("unsafe-server-message"); });
  assert.deepEqual(session.read(), { status: "error" });
});
test("credential rotation and disablement retain only an allowlisted actionable error", async () => {
  const session = createRevealSession(clock());
  for (const code of ["CREDENTIAL_VERSION_CHANGED", "CREDENTIAL_DISABLED"] as const) {
    await session.reveal("scope", async () => { throw { code, message: "do-not-copy-server-text" }; });
    assert.deepEqual(session.read(), { status: "error", errorCode: code });
  }
  await session.reveal("scope", async () => { throw { code: "UNTRUSTED_SERVER_CODE", message: "unsafe" }; });
  assert.deepEqual(session.read(), { status: "error" });
});
