import assert from "node:assert/strict";
import test from "node:test";

import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import {
  disconnectYouTrack,
  discoverYouTrack,
  getYouTrackConfiguration,
  getYouTrackIntegrationStatus,
  getYouTrackWebhookSetup,
  saveYouTrackConfiguration,
} from "../data/youtrack-api";

test("YouTrack status stays workspace-scoped and bearer-authenticated", async () => {
  let requestUrl = "";
  let request: RequestInit | undefined;
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "header.payload.signature", fetch: (async (url, init) => {
      requestUrl = String(url);
      request = init;
      return Response.json({ data: { provider: "youtrack", baseUrl: "https://youtrack.example/",
        targets: {}, linked: 4, pending: 1, failed: 0, lastSyncedAt: "2026-08-30T00:00:00.000Z" } });
    }) as typeof fetch });
  const status = await getYouTrackIntegrationStatus(http, "workspace-a");
  assert.equal(status.linked, 4);
  assert.equal(requestUrl, "https://api.example.test/api/v1/integrations/youtrack/status?workspaceId=workspace-a");
  assert.equal(new Headers(request?.headers).get("authorization"), "Bearer header.payload.signature");
});

test("v2 discovery and save are workspace-scoped and conditionally written", async () => {
  const requests: Array<{ url: string; method: string; body: unknown; ifMatch: string | null }> = [];
  const route = {
    id: "default", name: "Main", enabled: true, isDefault: true, match: null,
    project: { id: "1-1", shortName: "WEB", name: "Web" },
    workflow: {
      stateField: { id: "field-state", name: "State" },
      statuses: [{ id: "done", name: "Done", localizedName: null, ordinal: 1, isResolved: true, archived: false }],
      inbound: { backlog: [], inProgress: [], readyForRetest: ["done"], accepted: ["done"] },
      outbound: { open: null, triaged: null, inProgress: null, readyForRetest: null,
        verified: null, closed: "done", reopened: null },
    },
  };
  const configuration = {
    workspaceId: "workspace-a", enabled: true, source: "workspace" as const,
    baseUrl: "https://youtrack.example/", tokenConfigured: true, configurationVersion: 2,
    targets: { android: null, ios: null, backend: null }, readyForTestStatuses: [], acceptedStage: null,
    routes: [route], connection: { status: "connected" as const, checkedAt: null, lastErrorCode: null },
    connectionRevision: 1, rowVersion: 3,
  };
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "header.payload.signature", fetch: (async (url, init) => {
      requests.push({ url: String(url), method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : null,
        ifMatch: new Headers(init?.headers).get("if-match") });
      if (String(url).includes("discovery")) {
        return Response.json({ data: { baseUrl: "https://youtrack.example/",
          projects: [{ id: "1-1", shortName: "WEB", name: "Web", stateFields: [] }] } });
      }
      return Response.json({ data: configuration }, { headers: { etag: '"youtrack-configuration:workspace-a:3"' } });
    }) as typeof fetch });

  const resource = await getYouTrackConfiguration(http, "workspace-a");
  await discoverYouTrack(http, "workspace-a", {
    baseUrl: "https://youtrack.example/", apiToken: "new-token", projectIds: ["1-1"],
  });
  await saveYouTrackConfiguration(http, "workspace-a", {
    configurationVersion: 2, enabled: true, baseUrl: "https://youtrack.example/", routes: [route],
  }, resource.etag ?? "");

  assert.deepEqual(requests.map(({ url, method, ifMatch }) => ({ url, method, ifMatch })), [
    { url: "https://api.example.test/api/v1/integrations/youtrack/configuration?workspaceId=workspace-a", method: "GET", ifMatch: null },
    { url: "https://api.example.test/api/v1/integrations/youtrack/discovery?workspaceId=workspace-a", method: "POST", ifMatch: null },
    { url: "https://api.example.test/api/v1/integrations/youtrack/configuration?workspaceId=workspace-a", method: "PATCH", ifMatch: '"youtrack-configuration:workspace-a:3"' },
  ]);
  assert.deepEqual(requests[1]?.body, {
    baseUrl: "https://youtrack.example/", apiToken: "new-token", projectIds: ["1-1"],
  });
  assert.equal("apiToken" in (requests[2]?.body as object), false);
});

test("disconnect is explicit, workspace-scoped, and guarded by the current ETag", async () => {
  let requestUrl = "";
  let request: RequestInit | undefined;
  const configuration = {
    workspaceId: "workspace-a", enabled: false, source: "workspace" as const,
    baseUrl: null, tokenConfigured: false, configurationVersion: 2,
    targets: { android: null, ios: null, backend: null }, readyForTestStatuses: [], acceptedStage: null,
    connectionRevision: 4, routes: [],
    connection: { status: "unconfigured" as const, checkedAt: null, lastErrorCode: null }, rowVersion: 8,
  };
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "header.payload.signature",
    fetch: (async (url, init) => {
      requestUrl = String(url);
      request = init;
      return Response.json({ data: { configuration, detachedLinks: 3, cancelledJobs: 2 } }, {
        headers: { etag: '"youtrack-configuration:workspace-a:8"' },
      });
    }) as typeof fetch,
  });

  const resource = await disconnectYouTrack(
    http, "workspace-a", '"youtrack-configuration:workspace-a:7"',
  );

  assert.equal(requestUrl, "https://api.example.test/api/v1/integrations/youtrack/disconnect?workspaceId=workspace-a");
  assert.equal(request?.method, "POST");
  assert.equal(new Headers(request?.headers).get("if-match"), '"youtrack-configuration:workspace-a:7"');
  assert.deepEqual(JSON.parse(String(request?.body)), { mode: "detachExisting" });
  assert.equal(resource.data.configuration.connectionRevision, 4);
  assert.equal(resource.data.detachedLinks, 3);
  assert.equal(resource.data.cancelledJobs, 2);
});

test("webhook setup stays workspace-scoped and is never persisted by the client", async () => {
  let requestUrl = "";
  const http = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "header.payload.signature",
    fetch: (async (url) => {
      requestUrl = String(url);
      return Response.json({ data: {
        callbackUrl: "https://api.example.test/api/v1/integrations/youtrack/webhook?workspaceId=workspace-a&connectionRevision=2",
        connectionRevision: 2,
        authentication: { headerName: "X-YouTrack-Token", headerValue: "webhook-secret" },
      } });
    }) as typeof fetch,
  });

  const setup = await getYouTrackWebhookSetup(http, "workspace-a");
  assert.equal(requestUrl, "https://api.example.test/api/v1/integrations/youtrack/webhook-setup?workspaceId=workspace-a");
  assert.equal(setup.authentication.headerName, "X-YouTrack-Token");
  assert.equal(setup.connectionRevision, 2);
});
