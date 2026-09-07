import assert from "node:assert/strict";
import test from "node:test";
import { ConnectorRequestOwner } from "../application/requests/connector-request-owner";
import { connectionDraft } from "../model/connector-draft";
import { connectorError } from "../application/connector-errors";
import { TmsApiError } from "../../../../core/tms/transport/http";
import { providers, type Connection } from "../model/connector-types";

test("late completion cannot replace a newer connector operation or clear its pending state", async () => {
  const owner = new ConnectorRequestOwner(); const first = owner.begin();
  const newer = owner.begin(); let visible = "new";
  await Promise.resolve().then(() => { if (owner.current(first)) visible = "stale"; });
  assert.equal(first.aborted, true); assert.equal(visible, "new");
  assert.equal(owner.current(newer), true);
  owner.cancel(); assert.equal(newer.aborted, true); assert.equal(owner.current(newer), false);
});
test("draft settings and secrets are independent across provider forms", () => {
  const one = connectionDraft("trello", null); const two = connectionDraft("trello", null);
  one.settings.events.length = 0; one.secrets.apiToken = "local-test-only";
  assert.ok(two.settings.events.length > 0); assert.deepEqual(two.secrets, {});
  assert.deepEqual(connectionDraft("confluence", null).settings.events, ["run.complete"]);
});
test("new connections save paused so webhook registration can precede activation", () => {
  for (const provider of providers) {
    const draft = connectionDraft(provider, null);
    assert.equal(draft.enabled, false, provider);
    assert.deepEqual(draft.secrets, {}, provider);
    assert.equal(draft.settings.remoteId, "", provider);
  }
});
test("editing preserves saved activation and settings without hydrating stored credentials", () => {
  const saved: Connection = {
    workspaceId: "workspace-1", projectId: "project-1", id: "connection-1", provider: "linear",
    enabled: true, settings: { ...connectionDraft("linear", null).settings,
      remoteId: "team-1", inboundReadyStatuses: ["state-1"], outboundStatuses: { open: "state-2" } },
    rowVersion: 2, checkedAt: "2026-09-07T00:00:00.000Z", credentialsConfigured: true, webhookConfigured: true,
  };
  const draft = connectionDraft("linear", saved);
  assert.equal(draft.enabled, true);
  assert.deepEqual(draft.secrets, {});
  assert.equal(draft.settings.remoteId, "team-1");
  draft.settings.inboundReadyStatuses.length = 0;
  draft.settings.outboundStatuses.open = "another-state";
  assert.deepEqual(saved.settings.inboundReadyStatuses, ["state-1"]);
  assert.equal(saved.settings.outboundStatuses.open, "state-2");
  assert.equal(connectionDraft("linear", { ...saved, enabled: false }).enabled, false);
});
test("safe errors preserve a support request ID and never render upstream response text", () => {
  const failure = new TmsApiError("secret-token-in-upstream-response", 403, "request-safe", "UPSTREAM_ACCESS_DENIED");
  const message = connectorError(failure, true);
  assert.match(message, /request-safe/); assert.equal(message.includes("secret-token"), false);
});
