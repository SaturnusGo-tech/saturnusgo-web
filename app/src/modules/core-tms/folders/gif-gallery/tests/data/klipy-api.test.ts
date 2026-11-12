import assert from "node:assert/strict";
import test from "node:test";
import { getKlipyPage, registerKlipyShare, KlipyError } from "../../data/klipy-api";

const item = (id: string) => ({ id, title: `GIF ${id}`, content_description: `Description ${id}`,
  itemurl: `https://klipy.com/gifs/source-${id}`, content_description_source: "Original creator",
  media_formats: { tinygif: { url: `https://static1.klipy.com/${id}.gif?delivery=unchanged`, dims: [100, 80] } } });
const data = { results: [item("b"), item("a")], next: "opaque==" };

test("direct KLIPY trending and search preserve provider order, delivery URLs and opaque pagination", async () => {
  const calls: { url: URL; init?: RequestInit }[] = [];
  const fetcher: typeof fetch = async (input, init) => { calls.push({ url: new URL(String(input)), init }); return Response.json(data); };
  const signal = new AbortController().signal;
  const page = await getKlipyPage({ key: "public-key", query: "", locale: "en", signal }, fetcher);
  assert.equal(calls[0].url.origin, "https://api.klipy.com"); assert.equal(calls[0].url.pathname, "/v2/featured");
  assert.equal(calls[0].init?.credentials, "omit"); assert.equal(calls[0].init?.redirect, "error");
  assert.equal(new Headers(calls[0].init?.headers).has("authorization"), false);
  assert.deepEqual(page.items.map(value => value.appearance.id), ["b", "a"]);
  assert.equal(page.items[0].appearance.url, data.results[0].media_formats.tinygif.url);
  assert.equal(page.items[0].appearance.sourceUrl, data.results[0].itemurl); assert.equal(page.items[0].credit, "Original creator");
  assert.equal(page.next, "opaque==");
  await getKlipyPage({ key: "public-key", query: " hi & bye! ", locale: "ru", cursor: page.next, signal }, fetcher);
  assert.equal(calls[1].url.pathname, "/v2/search"); assert.equal(calls[1].url.searchParams.get("q"), " hi & bye! ");
  assert.equal(calls[1].url.searchParams.get("pos"), "opaque=="); assert.equal(calls[1].url.searchParams.get("locale"), "ru");
});

test("unconfigured keys never make requests, failures omit provider payloads, and rate limits preserve retry guidance", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; return new Response("secret-provider-payload", { status: 429, headers: { "retry-after": "12" } }); };
  const input = { key: "", query: "private query", locale: "en" as const, signal: new AbortController().signal };
  await assert.rejects(getKlipyPage(input, fetcher), error => error instanceof KlipyError && error.kind === "missing_key");
  assert.equal(calls, 0);
  await assert.rejects(getKlipyPage({ ...input, key: "key" }, fetcher), error => error instanceof KlipyError && error.kind === "rate" && error.retryAfter === 12 && !error.message.includes("secret"));
});

test("unexpected media/source origins fail the whole page without silently dropping or sorting content", async () => {
  const signal = new AbortController().signal;
  for (const url of ["http://static.klipy.com/a.gif", "https://static.klipy.com.evil.test/a.gif", "https://user@static.klipy.com/a.gif", "https://static.klipy.com/a.gif#x"]) {
    const invalid = item("a"); invalid.media_formats.tinygif.url = url;
    await assert.rejects(getKlipyPage({ key: "key", query: "", locale: "en", signal }, async () => Response.json({ results: [item("b"), invalid], next: "" })), error => error instanceof KlipyError && error.kind === "response");
  }
  const invalid = item("a"); invalid.itemurl = "https://outside.test/source";
  await assert.rejects(getKlipyPage({ key: "key", query: "", locale: "en", signal }, async () => Response.json({ results: [invalid] })));
});

test("network cancellation remains cancellable and selected GIF reporting stays direct", async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(getKlipyPage({ key: "key", query: "", locale: "en", signal: controller.signal }, async (_input, init) => { init?.signal?.throwIfAborted(); return Response.json(data); }));
  let target!: URL;
  await registerKlipyShare({ key: "key", id: "a", query: "hello", signal: new AbortController().signal }, async input => { target = new URL(String(input)); return Response.json({ result: true }); });
  assert.equal(target.origin, "https://api.klipy.com"); assert.equal(target.pathname, "/v2/registershare");
  assert.equal(target.searchParams.get("id"), "a"); assert.equal(target.searchParams.get("q"), "hello");
});

test("HTTP-date rate limits retain the provider's future retry deadline", async () => {
  const after = new Date(Date.now() + 120_000).toUTCString();
  await assert.rejects(getKlipyPage({ key: "key", query: "", locale: "en", signal: new AbortController().signal },
    async () => new Response("Limit", { status: 429, headers: { "retry-after": after } })),
  error => error instanceof KlipyError && error.kind === "rate" && error.retryAfter >= 119 && error.retryAfter <= 120);
});

test("selection reporting omits credentials and stops at the existing ten-second deadline", async t => {
  const deadline = new AbortController(), durations: number[] = [];
  t.mock.method(AbortSignal, "timeout", (duration: number) => { durations.push(duration); return deadline.signal; });
  let requestSignal!: AbortSignal;
  const pending = registerKlipyShare({ key: "key", query: "hello", id: "selected", signal: new AbortController().signal },
    async (_input, init) => {
      assert.equal(init?.credentials, "omit"); assert.equal(init?.redirect, "error");
      assert.equal(new Headers(init?.headers).has("authorization"), false);
      requestSignal = init?.signal as AbortSignal;
      return new Promise<Response>((_resolve, reject) => requestSignal.addEventListener("abort", () => reject(requestSignal.reason), { once: true }));
    });
  assert.deepEqual(durations, [10_000]); assert.equal(requestSignal.aborted, false);
  deadline.abort(new DOMException("Deadline elapsed", "TimeoutError"));
  await assert.rejects(pending, error => error instanceof KlipyError && error.kind === "network");
  assert.equal(requestSignal.aborted, true);
});
