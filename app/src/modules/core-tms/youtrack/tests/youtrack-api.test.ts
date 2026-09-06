import assert from "node:assert/strict";
import test from "node:test";

import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import {
  getYouTrackConfiguration,
  getYouTrackIntegrationStatus,
  saveYouTrackConfiguration,
  testYouTrackConnection,
} from "../data/youtrack-api";

test("YouTrack status stays workspace-scoped and bearer-authenticated", async () => {
  let requestUrl = "";
  let request: RequestInit | undefined;
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "header.payload.signature", fetch: (async (url, init) => {
      requestUrl = String(url);
      request = init;
      return new Response(JSON.stringify({ data: { provider: "youtrack",
        baseUrl: "https://youtrack.example/", targets: {
          android: { shortName: "umbrellandroid" }, ios: { shortName: "UmbrellaIos" },
          backend: { shortName: "umbrella" } }, linked: 4, pending: 1, failed: 0,
        lastSyncedAt: "2026-08-30T00:00:00.000Z" } }), { status: 200,
        headers: { "content-type": "application/json" } });
    }) as typeof fetch });
  const status = await getYouTrackIntegrationStatus(http, "workspace-a");
  assert.equal(status.linked, 4);
  assert.equal(requestUrl, "https://api.example.test/api/v1/integrations/youtrack/status?workspaceId=workspace-a");
  assert.equal(new Headers(request?.headers).get("authorization"), "Bearer header.payload.signature");
});

test("YouTrack settings use workspace-scoped authenticated and conditional management endpoints", async () => {
  const requests: Array<{ url: string; method: string; body: unknown; ifMatch: string | null }> = [];
  const configuration = {
    workspaceId: "workspace-a", enabled: true,
    source: "workspace" as const, baseUrl: "https://youtrack.example/", tokenConfigured: true,
    targets: {
      android: { projectId: "1-1", shortName: "ANDROID" },
      ios: { projectId: "1-2", shortName: "IOS" },
      backend: { projectId: "1-3", shortName: "BACK" },
    },
    readyForTestStatuses: ["Test" as const], acceptedStage: "Done" as const,
    connection: { status: "connected" as const, checkedAt: null, lastErrorCode: null },
    rowVersion: 3,
  };
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "header.payload.signature", fetch: (async (url, init) => {
      requests.push({ url: String(url), method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : null,
        ifMatch: new Headers(init?.headers).get("if-match") });
      if (String(url).includes("connection-test")) {
        return Response.json({ data: { baseUrl: "https://youtrack.example/",
          projects: [{ id: "1-1", shortName: "ANDROID", name: "Android" }] } });
      }
      return Response.json({ data: configuration }, { headers: { etag: '"youtrack-configuration:workspace-a:3"' } });
    }) as typeof fetch });

  const resource = await getYouTrackConfiguration(http, "workspace-a");
  await testYouTrackConnection(http, "workspace-a", {
    baseUrl: "https://youtrack.example/", apiToken: "new-token",
  });
  await saveYouTrackConfiguration(http, "workspace-a", {
    enabled: true, baseUrl: "https://youtrack.example/", targets: configuration.targets,
    readyForTestStatuses: ["Test"], acceptedStage: "Done",
  }, resource.etag ?? "");

  assert.deepEqual(requests.map(({ url, method, ifMatch }) => ({ url, method, ifMatch })), [
    { url: "https://api.example.test/api/v1/integrations/youtrack/configuration?workspaceId=workspace-a", method: "GET", ifMatch: null },
    { url: "https://api.example.test/api/v1/integrations/youtrack/connection-test?workspaceId=workspace-a", method: "POST", ifMatch: null },
    { url: "https://api.example.test/api/v1/integrations/youtrack/configuration?workspaceId=workspace-a", method: "PATCH", ifMatch: '"youtrack-configuration:workspace-a:3"' },
  ]);
  assert.deepEqual(requests[1]?.body, {
    baseUrl: "https://youtrack.example/", apiToken: "new-token",
  });
  assert.equal("apiToken" in (requests[2]?.body as object), false);
});
