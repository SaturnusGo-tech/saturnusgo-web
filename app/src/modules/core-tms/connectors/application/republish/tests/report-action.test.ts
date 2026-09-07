import assert from "node:assert/strict";
import test from "node:test";
import { reportRepublishAvailable } from "../../../presentation/activity/report-republish-action";
import { connectionDraft } from "../../../model/connector-draft";
import type { Delivery, Snapshot } from "../../../model/connector-types";

const delivery: Delivery = { id: "d", event: "run.complete", targetId: "r", direction: "outbound",
  status: "delivered", attempts: 1, errorCode: null, createdAt: "2026-09-07T00:00:00Z", updatedAt: "2026-09-07T00:00:00Z" };
const snapshot: Snapshot = {
  connection: { workspaceId: "w", projectId: "p", id: "c", provider: "confluence", enabled: true,
    settings: connectionDraft("confluence", null).settings, rowVersion: 2, checkedAt: null,
    credentialsConfigured: true, webhookConfigured: false },
  etag: '"v2"', catalog: { projects: [], suites: [], environments: [] }, deliveries: [delivery], nextCursor: null,
  webhook: { url: null, configured: false }, links: [{ workspaceId: "w", projectId: "p", connectionId: "c",
    targetType: "run", targetId: "r", remoteId: "123", remoteKey: "QA report", url: "https://qa.atlassian.net/wiki/pages/123",
    remoteStatus: "published", remoteUpdatedAt: null, metadata: {} }],
};

test("republish is offered for an enabled Confluence delivery with the exact scoped run/page link", () => {
  assert.equal(reportRepublishAvailable(snapshot, delivery), true);
  assert.equal(reportRepublishAvailable({ ...snapshot, links: [] }, delivery), false);
  assert.equal(reportRepublishAvailable({ ...snapshot, connection: null }, delivery), false);
  assert.equal(reportRepublishAvailable({ ...snapshot, etag: null }, delivery), false);
  for (const connection of [{ ...snapshot.connection!, enabled: false }, { ...snapshot.connection!, provider: "jira" as const }]) {
    assert.equal(reportRepublishAvailable({ ...snapshot, connection }, delivery), false);
  }
  for (const patch of [{ workspaceId: "foreign" }, { projectId: "foreign" }, { connectionId: "foreign" },
    { targetId: "another-run" }, { targetType: "defect" as const }]) {
    assert.equal(reportRepublishAvailable({ ...snapshot, links: [{ ...snapshot.links[0]!, ...patch }] }, delivery), false);
  }
});

test("republish does not turn failed, uncertain, or inbound deliveries into generic replay actions", () => {
  for (const status of ["pending", "processing", "failed", "uncertain", "cancelled", "ignored"] as const) {
    assert.equal(reportRepublishAvailable(snapshot, { ...delivery, status }), false);
  }
  assert.equal(reportRepublishAvailable(snapshot, { ...delivery, direction: "inbound" }), false);
  assert.equal(reportRepublishAvailable(snapshot, { ...delivery, event: "run.start" }), false);
});
