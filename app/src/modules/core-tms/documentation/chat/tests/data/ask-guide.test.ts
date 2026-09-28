import assert from "node:assert/strict";
import { test } from "node:test";
import { createTmsHttpClient, TmsApiError, type TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { askGuide, guideError } from "../../data/ask-guide";

test("chat sends only bounded conversation and locale through authenticated workspace transport", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const result = { answer: "Open **Current run**.", citations: [{ articleId: "create-run", sectionId: "settings", title: "Run settings" }], knowledgeVersion: "fixture-version" };
  const http = createTmsHttpClient({ apiBase: "https://falcon.example/api/v1", accessToken: async () => "synthetic-token", production: true,
    fetch: async (url, init) => { calls.push({ url: String(url), init: init! }); return new Response(`data: ${JSON.stringify({ type: "complete", data: result })}\n\n`, { headers: { "content-type": "text/event-stream" } }); } });
  const abort = new AbortController(), messages = [{ role: "user" as const, content: "How do I edit a run?" }];
  assert.deepEqual(await askGuide(http, "workspace/a", "en", messages, abort.signal), result);
  assert.equal(calls.length, 1); assert.equal(calls[0].url, "https://falcon.example/api/v1/workspaces/workspace%2Fa/ai/documentation-chat/stream");
  assert.equal(new Headers(calls[0].init.headers).get("Authorization"), "Bearer synthetic-token");
  assert.equal(calls[0].init.signal, abort.signal);
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), { locale: "en", messages });
});

test("malformed provider responses fail instead of rendering fabricated success", async () => {
  for (const data of [null, {}, { answer: " ", citations: [], knowledgeVersion: "v" },
    { answer: "Answer", citations: [null], knowledgeVersion: "v" }, { answer: "Answer", citations: [{ articleId: "a" }], knowledgeVersion: "v" }]) {
    const http = { mutate: async () => data } as unknown as TmsHttpClient;
    await assert.rejects(askGuide(http, "workspace", "ru", [{ role: "user", content: "Question" }], new AbortController().signal));
  }
  for (const [status, key] of [[401, "signedOut"], [403, "forbidden"], [429, "limited"], [422, "invalid"], [503, "unavailable"]] as const) {
    assert.equal(guideError(new TmsApiError("Failure", status, null)), key);
  }
});

test("legacy mock transports without streaming retain the real JSON API fallback", async () => {
  const calls: string[] = [], result = { answer: "Verified answer", citations: [], knowledgeVersion: "fixture" };
  const http = { mutate: async (path: string) => { calls.push(path); return result; } } as unknown as TmsHttpClient;
  assert.deepEqual(await askGuide(http, "workspace", "ru", [{ role: "user", content: "Question" }], new AbortController().signal), result);
  assert.deepEqual(calls, ["/workspaces/workspace/ai/documentation-chat"]);
});
