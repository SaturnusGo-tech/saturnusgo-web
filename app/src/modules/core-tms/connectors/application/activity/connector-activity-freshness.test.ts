import assert from "node:assert/strict";
import test from "node:test";
import { ConnectorActivityFreshness } from "./connector-activity-freshness";
import { ConnectorRequestOwner } from "../requests/connector-request-owner";

test("returning from automation after twenty minutes reloads the formerly empty activity", () => {
  const freshness = new ConnectorActivityFreshness();
  freshness.loaded(0);
  assert.equal(freshness.refreshOnEntry(false, true, 1000), false);
  assert.equal(freshness.refreshOnEntry(true, true, 20 * 60 * 1000), true);
  assert.equal(freshness.refreshOnEntry(true, true, 20 * 60 * 1000 + 1), false);
});

test("fresh tab switches do not duplicate the initial load or refresh continuously", () => {
  const freshness = new ConnectorActivityFreshness();
  freshness.loaded(1000);
  assert.equal(freshness.refreshOnEntry(true, true, 1001), false);
  assert.equal(freshness.refreshOnEntry(true, true, 50_000), false);
  freshness.refreshOnEntry(false, true, 50_001);
  assert.equal(freshness.refreshOnEntry(true, true, 50_002), true);
  freshness.loaded(50_003);
  freshness.refreshOnEntry(false, true, 50_004);
  assert.equal(freshness.refreshOnEntry(true, true, 50_005), false);
});

test("an automatic entry refresh waits for a save or reconciliation without cancelling it", () => {
  const freshness = new ConnectorActivityFreshness(); const requests = new ConnectorRequestOwner();
  freshness.loaded(0); const save = requests.begin();
  assert.equal(freshness.refreshOnEntry(true, !requests.busy(), 20_000), false);
  assert.equal(save.aborted, false);
  const newer = requests.begin(); requests.finish(save);
  assert.equal(requests.busy(), true);
  assert.equal(freshness.refreshOnEntry(true, !requests.busy(), 20_001), false);
  requests.finish(newer);
  assert.equal(freshness.refreshOnEntry(true, !requests.busy(), 20_002), true);
});

test("a failed refresh is attempted once per entry and a new scope cannot reuse old freshness", () => {
  const freshness = new ConnectorActivityFreshness();
  assert.equal(freshness.refreshOnEntry(true, false, 1), false);
  assert.equal(freshness.refreshOnEntry(true, true, 2), true);
  assert.equal(freshness.refreshOnEntry(true, true, 3), false);
  freshness.refreshOnEntry(false, true, 4);
  assert.equal(freshness.refreshOnEntry(true, true, 5), true);
  freshness.loaded(6); freshness.reset();
  assert.equal(freshness.refreshOnEntry(true, true, 7), true);
});
