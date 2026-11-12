import assert from "node:assert/strict";
import test from "node:test";
import { createIntegrationPreviewClient } from "../../network/integration-preview-client";
import { connectorApi } from "../../../../connectors/data/connector-api";
import { providers } from "../../../../connectors/model/connector-types";
import { getYouTrackConfiguration, discoverYouTrack, getYouTrackWebhookSetup } from "../../../../youtrack/data/youtrack-api";
import { sampleWorkspace } from "../../samples/youtrack-sample";

const origin = "https://integration-preview.invalid";
const scope = { workspaceId: sampleWorkspace, projectId: "project-0" };
const query = new URLSearchParams(scope);

test("all connector samples reach real clients without global fetch or stored credential values", async t => {
  let outbound = 0;
  t.mock.method(globalThis, "fetch", async () => { outbound++; throw new Error("Unexpected outbound request"); });
  const fixture = createIntegrationPreviewClient(), api = connectorApi(fixture.http);
  for (const provider of providers) {
    const snapshot = await api.load(scope, provider, new AbortController().signal);
    assert.equal(snapshot.connection?.provider, provider);
    assert.equal(snapshot.connection.workspaceId, sampleWorkspace);
    assert.equal(snapshot.connection.projectId, "project-0");
    assert.ok(snapshot.etag);
    assert.equal(snapshot.deliveries.length, 3);
    assert.equal(snapshot.links.length, 1);
    assert.equal("secrets" in snapshot.connection, false);
    assert.equal("apiToken" in snapshot.connection, false);
    const discovery = await api.discover(scope, provider, { enabled: true, settings: snapshot.connection.settings,
      secrets: { apiToken: "synthetic-entered-token" } }, new AbortController().signal);
    assert.equal(discovery.account, "Sample QA team");
    assert.doesNotMatch(JSON.stringify(discovery), /synthetic-entered-token/);
  }
  const configured = await getYouTrackConfiguration(fixture.http, sampleWorkspace);
  assert.equal(configured.data.tokenConfigured, true);
  assert.equal("apiToken" in configured.data, false);
  const discovery = await discoverYouTrack(fixture.http, sampleWorkspace, { baseUrl: "https://untrusted.invalid", apiToken: "synthetic-entered-token" });
  assert.equal(discovery.projects.length, 3);
  assert.doesNotMatch(JSON.stringify(discovery), /synthetic-entered-token|untrusted/);
  const webhook = await getYouTrackWebhookSetup(fixture.http, sampleWorkspace);
  assert.match(webhook.authentication.headerValue, /^sample-only/);
  assert.equal(outbound, 0);
});

test("samples reject foreign origins, credentials, workspaces, projects and unsupported paths", async () => {
  const fixture = createIntegrationPreviewClient();
  const paths = [
    `${origin}/api/v1/integrations/connectors/jira/configuration?workspaceId=other&projectId=project-0`,
    `${origin}/api/v1/integrations/connectors/jira/configuration?workspaceId=${sampleWorkspace}&projectId=other`,
    `${origin}/api/v1/integrations/connectors/catalog?workspaceId=${sampleWorkspace}&projectId=other`,
    `${origin}/api/v1/integrations/connectors/catalog?workspaceId=${sampleWorkspace}`,
    `${origin}/api/v1/impact/analyses?workspaceId=${sampleWorkspace}&projectId=other`,
    `${origin}/api/v1/integrations/youtrack/configuration?workspaceId=other`,
    `${origin}/api/v1/integrations/youtrack/configuration`,
    `${origin}/api/v1/profile?${query}`,
    `https://real.example/api/v1/integrations/connectors?${query}`,
    `https://user:password@integration-preview.invalid/api/v1/integrations/connectors?${query}`,
    `http://integration-preview.invalid/api/v1/integrations/connectors?${query}`,
  ];
  for (const path of paths) {
    const response = await fixture.fetch(path);
    assert.equal(response.status, 403, path);
    assert.equal((await response.json()).error.code, "ACCESS_DENIED");
  }
});

test("durable commands stay denied and entered credentials cannot change the sample state", async () => {
  const fixture = createIntegrationPreviewClient(), path = `/api/v1/integrations/connectors/confluence/configuration?${query}`;
  const before = await (await fixture.fetch(path)).json();
  const attempts: [string, string][] = [
    [path, "PATCH"], [`/api/v1/integrations/connectors/confluence/disconnect?${query}`, "POST"],
    [`/api/v1/integrations/connectors/confluence/deliveries/sample/retry?${query}`, "POST"],
    [`/api/v1/integrations/connectors/confluence/deliveries/sample/reconcile?${query}`, "POST"],
    [`/api/v1/integrations/connectors/confluence/reports/sample/republish?${query}`, "POST"],
    [`/api/v1/integrations/youtrack/configuration?${query}`, "PATCH"],
    [`/api/v1/integrations/youtrack/disconnect?${query}`, "POST"],
    [`/api/v1/integrations/api-sources?${query}`, "POST"],
    [`/api/v1/integrations/api-sources/sample?${query}`, "PATCH"],
    [`/api/v1/impact/repositories/sample?${query}`, "PATCH"],
  ];
  for (const [url, method] of attempts) {
    const response = await fixture.fetch(url, { method, body: JSON.stringify({ secrets: { apiToken: "synthetic-entered-token" } }) });
    assert.equal(response.status, 403, `${method} ${url}`);
    assert.doesNotMatch(await response.text(), /synthetic-entered-token/);
  }
  before.data.settings.remoteId = "changed-locally";
  const after = await (await fixture.fetch(path)).json();
  assert.notEqual(after.data.settings.remoteId, "changed-locally");
  assert.equal(after.data.rowVersion, 1);
});

test("abort signals on init and Request block sample reads and discovery", async () => {
  const fixture = createIntegrationPreviewClient(), controller = new AbortController(); controller.abort();
  const path = `${origin}/api/v1/integrations/connectors/jira/configuration?${query}`;
  await assert.rejects(fixture.fetch(path, { signal: controller.signal }), { name: "AbortError" });
  await assert.rejects(fixture.fetch(new Request(path, { signal: controller.signal })), { name: "AbortError" });
  await assert.rejects(fixture.fetch(`/api/v1/integrations/youtrack/discovery?${query}`, { method: "POST", signal: controller.signal }), { name: "AbortError" });
});
