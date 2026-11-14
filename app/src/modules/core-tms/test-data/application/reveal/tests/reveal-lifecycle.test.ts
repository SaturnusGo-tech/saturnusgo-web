import assert from "node:assert/strict";
import { test } from "node:test";
import { watchSecretVisibility } from "../reveal-lifecycle";
import { createRevealSession } from "../reveal-session";
test("window blur clears a visible secret even while the document remains visible", async () => {
  const windowEvents = new EventTarget(), documentEvents = Object.assign(new EventTarget(), { hidden: false });
  const session = createRevealSession({ now: () => 0, schedule: () => () => {} });
  const stop = watchSecretVisibility(windowEvents, documentEvents, session.hide);
  await session.reveal("scope", async () => ({ value: "ephemeral", expiresAt: 30_000 }));
  assert.equal(session.read().status, "visible");
  windowEvents.dispatchEvent(new Event("blur"));
  assert.deepEqual(session.read(), { status: "hidden" });
  stop();
});
test("window blur aborts pending materialization and its late response cannot restore the secret", async () => {
  const windowEvents = new EventTarget(), documentEvents = Object.assign(new EventTarget(), { hidden: false });
  const request = new AbortController();
  const session = createRevealSession({ now: () => 0, schedule: () => () => {} });
  const stop = watchSecretVisibility(windowEvents, documentEvents, () => { request.abort(); session.hide(); });
  let reply!: (value: { value: string; expiresAt: number }) => void;
  const pending = session.reveal("scope", () => new Promise(resolve => { reply = resolve; }));
  windowEvents.dispatchEvent(new Event("blur"));
  reply({ value: "must-not-return", expiresAt: 30_000 }); await pending;
  assert.equal(request.signal.aborted, true); assert.deepEqual(session.read(), { status: "hidden" });
  stop();
});
