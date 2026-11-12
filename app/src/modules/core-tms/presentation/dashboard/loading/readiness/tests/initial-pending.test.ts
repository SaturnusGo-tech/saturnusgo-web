import assert from "node:assert/strict";
import test from "node:test";
import { isDashboardInitialPending, type DashboardInitialReadiness } from "../initial-pending";

const ready: DashboardInitialReadiness = {
  layoutPending: false, preferences: { ready: true, stored: true },
  analytics: { snapshot: {}, loading: false }, workbench: { enabled: true, snapshot: {}, loading: false },
};

test("initial dashboard waits for layout, preferences, analytics and enabled workbench", () => {
  for (const state of [
    { ...ready, layoutPending: true },
    { ...ready, preferences: { ready: false, stored: true } },
    { ...ready, analytics: { snapshot: null, loading: true } },
    { ...ready, workbench: { enabled: true, snapshot: null, loading: true } },
  ]) assert.equal(isDashboardInitialPending(state), true);
  assert.equal(isDashboardInitialPending(ready), false);
});

test("cached snapshots remain ready during background refresh", () => {
  assert.equal(isDashboardInitialPending({ ...ready,
    analytics: { snapshot: {}, loading: true }, workbench: { enabled: true, snapshot: {}, loading: true },
  }), false);
});

test("terminal failures and a disabled workbench cannot create an infinite first-load gate", () => {
  assert.equal(isDashboardInitialPending({ ...ready, preferences: { ready: false, stored: false },
    analytics: { snapshot: null, loading: false }, workbench: { enabled: true, snapshot: null, loading: false },
  }), false);
  assert.equal(isDashboardInitialPending({ ...ready, workbench: { enabled: false, snapshot: null, loading: true } }), false);
});
