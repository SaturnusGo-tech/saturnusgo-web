import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient, TmsApiError } from "../../http";

test("authenticated API rate failures retain bounded numeric and HTTP-date retry guidance", async () => {
  for (const [header, minimum, maximum] of [["60", 60, 60], [new Date(Date.now() + 120_000).toUTCString(), 119, 120], ["invalid", null, null], ["9999999", 86_400, 86_400]] as const) {
    const http = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1", accessToken: async () => "token", production: true,
      fetch: async () => Response.json({ error: { code: "GIF_RATE_LIMITED", message: "Try later" } }, { status: 429, headers: { "retry-after": header } }) });
    await assert.rejects(http.get("/workspaces/workspace/gifs"), error => {
      assert.ok(error instanceof TmsApiError);
      if (minimum === null) assert.equal(error.retryAfterSeconds, null);
      else assert.ok(error.retryAfterSeconds !== null && error.retryAfterSeconds >= minimum && error.retryAfterSeconds <= maximum);
      return true;
    });
  }
});
