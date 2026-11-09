import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../../../../../portfolios/tests/support/component-harness";

function activityHarness(reduced = false) {
  const timers = new Map<number, () => void>();
  let nextTimer = 0;
  const h = componentHarness(undefined, {
    setTimeout: (callback: () => void) => { timers.set(++nextTimer, callback); return nextTimer; },
    clearTimeout: (id: number) => timers.delete(id),
  });
  const { useStructuredBlockActivity } = h.load<{
    useStructuredBlockActivity(pending: boolean, active: boolean): { phase?: string; reveal: boolean };
  }>(new URL("../motion/useStructuredBlockActivity.ts", import.meta.url), name => {
    if (name === "framer-motion") return { useReducedMotion: () => reduced };
  });
  return {
    read: (pending: boolean, active = true) => h.render(() => useStructuredBlockActivity(pending, active)),
    elapse() {
      const callbacks = [...timers.values()];
      timers.clear();
      callbacks.forEach(callback => callback());
    },
    dispose: h.dispose,
    pendingTimers: () => timers.size,
  };
}

test("quick structured previews reveal without showing an orb", () => {
  const activity = activityHarness();
  assert.equal(activity.read(true).phase, undefined);
  assert.equal(activity.read(false).reveal, true);
  activity.elapse();
  assert.equal(activity.read(false).phase, undefined);
});

test("slow previews hold the result through the orb exit and cancel that exit for newer work", () => {
  const activity = activityHarness();
  activity.read(true);
  activity.elapse();
  assert.equal(activity.read(true).phase, "solving");
  assert.equal(activity.read(false).phase, "leaving");
  assert.equal(activity.read(false).reveal, false);
  assert.equal(activity.read(true).phase, "solving");
  activity.elapse();
  assert.equal(activity.read(true).phase, "solving");
  activity.read(false);
  activity.elapse();
  assert.equal(activity.read(false).reveal, true);
});

test("source mode and unmount clear pending presentation timers", () => {
  const activity = activityHarness();
  activity.read(true);
  assert.equal(activity.pendingTimers(), 1);
  assert.equal(activity.read(false, false).phase, undefined);
  assert.equal(activity.pendingTimers(), 0);
  activity.read(true);
  activity.dispose();
  assert.equal(activity.pendingTimers(), 0);
});

test("reduced motion reveals the result immediately after slow work", () => {
  const activity = activityHarness(true);
  activity.read(true);
  activity.elapse();
  assert.equal(activity.read(true).phase, "solving");
  const done = activity.read(false);
  assert.equal(done.phase, undefined);
  assert.equal(done.reveal, true);
});
