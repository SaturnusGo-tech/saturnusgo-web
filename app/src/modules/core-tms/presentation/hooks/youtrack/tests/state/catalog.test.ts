import { hooksCopy } from "../../../shared/hooks-copy";
import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react-test-renderer";
import { catalogHarness } from "./catalog-harness";

test("a successful but empty enriched catalog is an explicit failure and never erases configured workflows", async () => {
  const h = await catalogHarness("empty");
  try {
    assert.deepEqual(h.requests.map(request => request.body?.projectIds ?? null), [null, null, ["main-project", "web-project"]]);
    assert.equal(h.model.loading, false); assert.equal(h.model.action, "idle");
    assert.deepEqual(h.model.draft?.routes.map(route => route.workflow), h.saved.routes.map(route => route.workflow));
    assert.equal(h.model.catalogIssue, "empty_fields");
    assert.equal(h.requests.some(request => request.method === "PATCH"), false);
  } finally { await h.dispose(); }
});
test("failed enrichment stays distinct from empty fields and existing Refresh access can recover without saving", async () => {
  const h = await catalogHarness("failure");
  try {
    assert.equal(h.model.catalogIssue, "request_failed");
    assert.deepEqual(h.model.draft?.routes[0].workflow.inbound, h.saved.routes[0].workflow.inbound);
    h.setMode("ready"); await act(async () => { await h.model.connect(); });
    assert.equal(h.model.catalogIssue, null);
    assert.equal(h.model.selectedProjects[0].stateFields?.length, 1);
    assert.equal(h.model.draft?.routes[0].workflow.statuses.length, 3);
    assert.equal(h.requests.some(request => request.method === "PATCH"), false);
    assert.ok(h.requests.every(request => !request.body || !("apiToken" in request.body)));
  } finally { await h.dispose(); }
});
test("read-only configuration does not attempt discovery and retains its server-provided mappings", async () => {
  const h = await catalogHarness("failure", false);
  try {
    assert.equal(h.requests.length, 1); assert.equal(h.model.catalogIssue, null);
    assert.deepEqual(h.model.draft?.routes[0].workflow.inbound, h.saved.routes[0].workflow.inbound);
  } finally { await h.dispose(); }
});

test("catalog failure survives a rejected disconnect and clears only after a confirmed successful disconnect", async () => {
  const h = await catalogHarness("empty");
  try {
    h.setDisconnectFailure(true);
    await act(async () => { assert.equal(await h.model.disconnect(), false); });
    assert.equal(h.model.catalogIssue, "empty_fields"); assert.equal(h.model.configuration?.enabled, true);
    h.setDisconnectFailure(false);
    await act(async () => { assert.equal(await h.model.disconnect(), true); });
    assert.equal(h.model.configuration?.enabled, false); assert.equal(h.model.configuration?.tokenConfigured, false);
    assert.equal(h.model.catalogIssue, null);
  } finally { await h.dispose(); }
});

test("explicit Refresh access keeps the actionable credential error without a duplicate catalog message", async () => {
  const h = await catalogHarness("ready");
  try {
    h.setMode("credentials"); await act(async () => { await h.model.connect(); });
    assert.deepEqual(h.model.notice, { tone: "error", text: hooksCopy(false).validation.token });
    assert.equal(h.model.catalogIssue, null);
    assert.deepEqual(h.model.draft?.routes[0].workflow.inbound, h.saved.routes[0].workflow.inbound);
    assert.equal(h.requests.some(request => request.method === "PATCH"), false);
  } finally { await h.dispose(); }
});
