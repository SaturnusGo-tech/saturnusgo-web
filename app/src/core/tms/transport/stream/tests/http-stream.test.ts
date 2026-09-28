import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient, TmsApiError } from "../../http";

for (const session of ["bearer", "cookie"] as const) {
  test(`stream forwards ${session} authentication and exposes the first chunk before completion`, async () => {
    let request: RequestInit | undefined;
    let source!: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({ start(controller) { source = controller; } });
    const client = createTmsHttpClient({
      apiBase: "https://api.example.test/api/v1", production: true,
      ...(session === "bearer" ? { accessToken: async () => "test-token" } : { credentials: "include" as const }),
      fetch: (async (_url, init) => {
        request = init;
        return new Response(body, { headers: { "content-type": "text/event-stream" } });
      }) as typeof fetch,
    });
    const abort = new AbortController();
    const response = await client.stream!("/workspaces/a/ai/documentation-chat/stream", { locale: "ru" }, abort.signal);
    const headers = new Headers(request?.headers);
    assert.equal(headers.get("accept"), "text/event-stream");
    assert.equal(headers.get("content-type"), "application/json");
    assert.equal(headers.get("authorization"), session === "bearer" ? "Bearer test-token" : null);
    assert.equal(request?.credentials, session === "bearer" ? "omit" : "include");
    assert.equal(request?.cache, "no-store");
    assert.equal(request?.redirect, "error");
    assert.equal(request?.signal, abort.signal);
    assert.equal(request?.body, '{"locale":"ru"}');
    assert.equal(response.bodyUsed, false);
    const reader = response.body!.getReader();
    source.enqueue(new TextEncoder().encode('data: {"type":"text_delta","delta":"Hi"}\n\n'));
    const first = await reader.read();
    assert.equal(first.done, false);
    assert.match(new TextDecoder().decode(first.value), /text_delta/);
    await reader.cancel();
  });
}

test("stream preserves structured HTTP errors before the first event", async () => {
  const client = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1", production: true, accessToken: async () => "test-token",
    fetch: (async () => Response.json({ error: {
      code: "AI_GUIDE_RATE_LIMITED", message: "Please wait.", requestId: "stream-request",
    } }, { status: 429 })) as typeof fetch,
  });
  await assert.rejects(client.stream!("/guide", {}), error => {
    assert.ok(error instanceof TmsApiError);
    assert.equal(error.status, 429);
    assert.equal(error.requestId, "stream-request");
    assert.equal(error.code, "AI_GUIDE_RATE_LIMITED");
    return true;
  });
});

test("stream does not fetch when authentication or cancellation prevents the request", async () => {
  let called = false;
  const client = createTmsHttpClient({
    apiBase: "https://api.example.test/api/v1", production: true,
    accessToken: async signal => { signal?.throwIfAborted(); throw new Error("No session"); },
    fetch: (async () => { called = true; throw new Error("unexpected"); }) as typeof fetch,
  });
  await assert.rejects(client.stream!("/guide", {}), error => error instanceof TmsApiError && error.status === 401);
  const abort = new AbortController(); abort.abort();
  await assert.rejects(client.stream!("/guide", {}, abort.signal), { name: "AbortError" });
  assert.equal(called, false);
});
