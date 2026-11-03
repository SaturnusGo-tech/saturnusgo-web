import assert from "node:assert/strict";
import test from "node:test";
import type { TestRunSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import type { RunClock } from "../RunClock";
import { componentHarness, nodes } from "../../../../portfolios/tests/support/component-harness";
const epoch = "2026-11-03T00:00:00.000Z";
const at = (seconds: number) => new Date(Date.parse(epoch) + seconds * 1000).toISOString();
function fixture() {
  let now = 0, sequence = 0;
  const timers = new Map<number, () => void>();
  const h = componentHarness("https://falcon.test/work/", { performance: { now: () => now },
    setInterval: (callback: () => void) => { const id = ++sequence; timers.set(id, callback); return id; },
    clearInterval: (id: number) => timers.delete(id) });
  const { RunClock: View } = h.load<{ RunClock: typeof RunClock }>(new URL("../RunClock.tsx", import.meta.url));
  let run = { id: "run-a", elapsedMilliseconds: 60000, activeSince: epoch, measuredAt: epoch } as TestRunSummary;
  const render = () => nodes(h.render(() => View({ run }))).find(node => node.type === "time")!.props.children;
  return { render, timers, update(value: Partial<TestRunSummary>) { run = { ...run, ...value }; },
    advance(milliseconds: number) { now += milliseconds; Array.from(timers.values()).forEach(callback => callback()); },
    dispose: h.dispose };
}
test("a fresh server measurement does not reuse elapsed ticks from the previous baseline", () => {
  const f = fixture(); try {
    assert.equal(f.render(), "00:01:00"); f.advance(5000); assert.equal(f.render(), "00:01:05");
    f.update({ measuredAt: at(5) });
    assert.equal(f.render(), "00:01:05", "the first render before passive effects must not double-count five seconds");
    assert.equal(f.render(), "00:01:05");
    f.advance(1000); assert.equal(f.render(), "00:01:06");
  } finally { f.dispose(); }
});
test("server accumulated time survives pause and resume while paused wall time is excluded", () => {
  const f = fixture(); try {
    f.render(); f.advance(5000); f.render();
    f.update({ status: "paused", elapsedMilliseconds: 65000, activeSince: null, measuredAt: at(5) });
    assert.equal(f.render(), "00:01:05"); assert.equal(f.timers.size, 0);
    f.advance(100000); assert.equal(f.render(), "00:01:05");
    f.update({ status: "active", activeSince: at(105), measuredAt: at(105) });
    assert.equal(f.render(), "00:01:05"); f.advance(3000); assert.equal(f.render(), "00:01:08");
  } finally { f.dispose(); }
});
test("switching run identity cannot carry elapsed ticks into another run", () => {
  const f = fixture(); try {
    f.render(); f.advance(5000); f.render();
    f.update({ id: "run-b", elapsedMilliseconds: 2000, activeSince: at(5), measuredAt: at(5) });
    assert.equal(f.render(), "00:00:02");
  } finally { f.dispose(); }
});
