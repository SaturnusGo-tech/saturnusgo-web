import assert from "node:assert/strict";
import test from "node:test";
import { TmsApiError, type TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { getKlipyPage, registerKlipyShare, KlipyError } from "../../data/klipy-api";

const item = (id: string) => ({ id, title: `GIF ${id}`, description: `Description ${id}`, credit: "Original creator",
  sourceUrl: `https://klipy.com/gifs/source-${id}`, url: `https://static1.klipy.com/${id}.gif?delivery=unchanged` });
const page = { items: [item("b"), item("a")], next: "opaque==" };
const signal = () => new AbortController().signal;
const client = (getResource: TmsHttpClient["getResource"], mutate?: TmsHttpClient["mutate"]) => ({ getResource, mutate } as TmsHttpClient);

test("authenticated workspace reads preserve order, delivery URLs and opaque pagination without browser provider credentials", async t => {
  let directCalls = 0; t.mock.method(globalThis, "fetch", async () => { directCalls++; throw new Error("Direct provider requests are forbidden"); });
  const paths: string[] = [];
  const http = client(async <T,>(path: string) => { paths.push(path); return { data: page as T, etag: null }; });
  const first = await getKlipyPage({ http, workspaceId: "workspace:1", query: "", locale: "en", signal: signal() });
  assert.equal(paths[0], "/workspaces/workspace%3A1/gifs?locale=en");
  assert.deepEqual(first.items.map(value => value.appearance.id), ["b", "a"]);
  assert.equal(first.items[0].appearance.url, page.items[0].url); assert.equal(first.items[0].credit, "Original creator");
  await getKlipyPage({ http, workspaceId: "workspace:1", query: " hi & bye! ", locale: "ru", cursor: first.next, signal: signal() });
  const url = new URL(paths[1], "https://falcon.invalid");
  assert.equal(url.searchParams.get("q"), " hi & bye! "); assert.equal(url.searchParams.get("cursor"), "opaque==");
  assert.equal(url.searchParams.get("locale"), "ru"); assert.equal(url.searchParams.has("key"), false);
  assert.equal(directCalls, 0);
});

test("invalid workspace scope and oversized requests never reach authenticated transport", async () => {
  let calls = 0; const http = client(async () => { calls++; throw new Error("Unexpected request"); });
  for (const patch of [{ workspaceId: "" }, { workspaceId: "../foreign" }, { query: "q".repeat(201) }, { cursor: "x".repeat(1025) }]) {
    await assert.rejects(getKlipyPage({ http, workspaceId: "workspace", query: "", locale: "en", signal: signal(), ...patch }), KlipyError);
  }
  assert.equal(calls, 0);
});

test("malformed backend GIF DTOs fail the entire page without filtering provider content", async () => {
  const invalidPages = [
    { ...page, items: [item("b"), { ...item("a"), url: "https://static.klipy.com.evil.test/a.gif" }] },
    { ...page, items: [{ ...item("a"), sourceUrl: "https://outside.test/source" }] },
    { ...page, items: [{ ...item("a"), description: null }] },
    { ...page, items: Array.from({ length: 13 }, () => item("a")) },
    { ...page, next: "x".repeat(1025) }, { items: [] },
  ];
  for (const data of invalidPages) {
    const http = client(async <T,>() => ({ data: data as T, etag: null }));
    await assert.rejects(getKlipyPage({ http, workspaceId: "workspace", query: "", locale: "en", signal: signal() }),
      error => error instanceof KlipyError && error.kind === "response");
  }
});

test("backend failures preserve retry guidance without exposing server or provider diagnostics", async () => {
  for (const [status, kind] of [[429, "rate"], [403, "access"], [503, "network"]] as const) {
    const failure = Object.assign(new TmsApiError("private upstream diagnostics", status, null), { retryAfterSeconds: 12 });
    const http = client(async () => { throw failure; });
    await assert.rejects(getKlipyPage({ http, workspaceId: "workspace", query: "", locale: "en", signal: signal() }),
      error => error instanceof KlipyError && error.kind === kind && !error.message.includes("private") && (kind !== "rate" || error.retryAfter === 12));
  }
});

test("selection reporting uses the authenticated workspace POST and cancellation remains observable", async () => {
  const controller = new AbortController(); controller.abort(); let reads = 0;
  const http = client(async () => { reads++; throw new Error("Unexpected request"); });
  await assert.rejects(getKlipyPage({ http, workspaceId: "workspace", query: "", locale: "en", signal: controller.signal }), { name: "AbortError" });
  assert.equal(reads, 0);
  const calls: unknown[][] = [];
  const writer = client(http.getResource, async <T,>(...args: unknown[]) => { calls.push(args); return undefined as T; });
  await registerKlipyShare({ http: writer, workspaceId: "workspace", id: "selected", query: "hello", signal: signal() });
  assert.deepEqual(calls[0].slice(0, 3), ["/workspaces/workspace/gifs/share", "POST", { id: "selected", query: "hello" }]);
});

test("selection reporting retains its independent ten-second deadline", async t => {
  const deadline = new AbortController(), durations: number[] = [];
  t.mock.method(AbortSignal, "timeout", (duration: number) => { durations.push(duration); return deadline.signal; });
  let requestSignal!: AbortSignal;
  const http = client(async () => { throw new Error("Unexpected read"); }, async <T,>(_path: string, _method: string, _body: unknown, passed?: AbortSignal) => {
    requestSignal = passed!;
    return new Promise<T>((_resolve, reject) => requestSignal.addEventListener("abort", () => reject(requestSignal.reason), { once: true }));
  });
  const pending = registerKlipyShare({ http, workspaceId: "workspace", query: "hello", id: "selected", signal: signal() });
  assert.deepEqual(durations, [10_000]); assert.equal(requestSignal.aborted, false);
  deadline.abort(new DOMException("Deadline elapsed", "TimeoutError"));
  await assert.rejects(pending, error => error instanceof KlipyError && error.kind === "network");
  assert.equal(requestSignal.aborted, true);
});
