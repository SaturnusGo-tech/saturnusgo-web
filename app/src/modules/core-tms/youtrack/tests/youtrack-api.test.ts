import assert from "node:assert/strict";
import test from "node:test";

import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import { getYouTrackIntegrationStatus } from "../data/youtrack-api";

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
