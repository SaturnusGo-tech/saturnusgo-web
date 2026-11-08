import assert from "node:assert/strict";
import test from "node:test";
import { fetchProductDocImage } from "../productDocImageFetch";

const url = "https://images.example.test/inspection.png";

test("a third-party image is fetched without cookies, redirects or a referer", async (context) => {
  const signal = new AbortController().signal;
  context.mock.method(globalThis, "fetch", async (address: RequestInfo | URL, options?: RequestInit) => {
    assert.equal(address, url);
    assert.deepEqual(options, {
      mode: "cors", credentials: "omit", redirect: "error", referrerPolicy: "no-referrer", signal,
    });
    return new Response(new Uint8Array([137, 80, 78, 71]), { headers: { "Content-Type": "IMAGE/PNG" } });
  });
  const result = await fetchProductDocImage(url, false, signal);
  assert.equal(result?.type, "image/png");
  assert.equal(result?.size, 4);
});

test("a same-origin image reference does not attach the workspace session", async (context) => {
  const signal = new AbortController().signal;
  context.mock.method(globalThis, "fetch", async (_address: RequestInfo | URL, options?: RequestInit) => {
    assert.equal(options?.mode, "same-origin");
    assert.equal(options?.credentials, "omit");
    return new Response("<svg/>", { headers: { "Content-Type": "image/svg+xml" } });
  });
  assert.equal((await fetchProductDocImage(url, true, signal))?.type, "image/svg+xml");
});

test("external SVG and oversized image streams are refused", async (context) => {
  const signal = new AbortController().signal;
  const megabyte = new Uint8Array(1024 * 1024);
  let canceled = false;
  const oversized = new ReadableStream({
    pull(controller) { controller.enqueue(megabyte); },
    cancel() { canceled = true; },
  });
  const responses = [
    new Response("<svg/>", { headers: { "Content-Type": "image/svg+xml" } }),
    new Response(oversized, { headers: { "Content-Type": "image/png", "Content-Length": "42" } }),
  ];
  context.mock.method(globalThis, "fetch", async () => responses.shift());
  assert.equal(await fetchProductDocImage(url, false, signal), null);
  assert.equal(await fetchProductDocImage(url, false, signal), null);
  assert.ok(canceled);
});
