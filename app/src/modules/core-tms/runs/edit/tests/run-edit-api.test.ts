import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient, TmsApiError } from "../../../../../core/tms/transport/http";
import { runEditApi } from "../data/run-edit-api";
import { runDto } from "./support/run-edit-fixture";

test("run edit transport fetches ETag and PATCHes exact metadata without retrying stale versions", async () => {
  const requests: { path: string; init: RequestInit }[] = [];
  const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "token",
    fetch: async (input, init = {}) => {
      requests.push({ path: String(input), init });
      return init.method === "PATCH" ? new Response(JSON.stringify({ error: { code: "PRECONDITION_FAILED", message: "Stale", requestId: "request-a" } }), { status: 412 })
        : new Response(JSON.stringify({ data: runDto }), { headers: { etag: '"run:run-a:7"' } });
    } });
  const api = runEditApi(http); const resource = await api.load("run-a", new AbortController().signal);
  assert.equal(resource.etag, '"run:run-a:7"');
  await assert.rejects(api.save("run-a", { name: "Corrected", ownerIdentityId: null, platformBuilds: [] }, resource.etag, "edit-test-key"),
    (error: unknown) => error instanceof TmsApiError && error.status === 412);
  assert.equal(requests.length, 2); const headers = new Headers(requests[1].init.headers);
  assert.equal(headers.get("if-match"), '"run:run-a:7"'); assert.equal(headers.get("idempotency-key"), "edit-test-key");
  assert.deepEqual(JSON.parse(String(requests[1].init.body)), { name: "Corrected", ownerIdentityId: null, platformBuilds: [] });
});

test("run editing rejects missing ETags and resources belonging to another run", async () => {
  for (const mismatch of [false, true]) {
    const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "token",
      fetch: async () => new Response(JSON.stringify({ data: { ...runDto, id: mismatch ? "another-run" : runDto.id } }),
        { headers: mismatch ? { etag: '"run:another-run:1"' } : {} }) });
    await assert.rejects(runEditApi(http).load("run-a", new AbortController().signal), /cannot be edited safely/);
  }
});
