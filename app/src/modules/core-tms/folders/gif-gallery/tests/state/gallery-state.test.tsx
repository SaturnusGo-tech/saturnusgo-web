import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useKlipyGallery } from "../../state/useKlipyGallery";
Object.assign(globalThis, { React });
const frame = () => new Promise(resolve => setTimeout(resolve, 0));
const page = (id: string, next = "") => Response.json({ results: [{ id, title: id,
  itemurl: `https://klipy.com/gifs/${id}`, media_formats: { tinygif: { url: `https://static.klipy.com/${id}.gif` } } }], next });

test("rapid queries debounce, abort old reads and ignore late old pages", async t => {
  const calls: { url: URL; signal: AbortSignal; resolve(value: Response): void }[] = [];
  t.mock.method(globalThis, "fetch", (url: URL, init: RequestInit) => new Promise(resolve => calls.push({ url, signal: init.signal!, resolve })));
  let state!: ReturnType<typeof useKlipyGallery>;
  function Probe({ query }: { query: string }) { state = useKlipyGallery("key", query, "en"); return null; }
  let view!: ReactTestRenderer; await act(async () => { view = create(<Probe query="" />); }); t.after(() => act(() => view.unmount()));
  assert.equal(calls.length, 1);
  await act(async () => { view.update(<Probe query="dog" />); }); assert.equal(calls[0].signal.aborted, true);
  await act(async () => { view.update(<Probe query="cat & mouse" />); });
  assert.equal(state.items.length, 0);
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 330)); });
  assert.equal(calls.length, 2); assert.equal(calls[1].url.searchParams.get("q"), "cat & mouse");
  await act(async () => { calls[1].resolve(page("cat")); await frame(); });
  await act(async () => { calls[0].resolve(page("old")); await frame(); });
  assert.deepEqual(state.items.map(item => item.appearance.id), ["cat"]); assert.equal(state.loading, false);
});

test("load more is locked synchronously, preserves ordered pages, and failed pages retry in place", async t => {
  const calls: { url: URL; resolve(value: Response): void }[] = [];
  t.mock.method(globalThis, "fetch", (url: URL) => new Promise(resolve => calls.push({ url, resolve })));
  let state!: ReturnType<typeof useKlipyGallery>;
  function Probe() { state = useKlipyGallery("key", "", "en"); return null; }
  let view!: ReactTestRenderer; await act(async () => { view = create(<Probe />); }); t.after(() => act(() => view.unmount()));
  await act(async () => { calls[0].resolve(page("first", "opaque")); await frame(); });
  act(() => { state.more(); state.more(); }); assert.equal(calls.length, 2);
  assert.equal(calls[1].url.searchParams.get("pos"), "opaque");
  await act(async () => { calls[1].resolve(new Response("Unavailable", { status: 503 })); await frame(); });
  assert.deepEqual(state.items.map(item => item.appearance.id), ["first"]); assert.equal(state.error?.kind, "network");
  act(() => state.retry()); assert.equal(calls[2].url.searchParams.get("pos"), "opaque");
  await act(async () => { calls[2].resolve(page("second")); await frame(); });
  assert.deepEqual(state.items.map(item => item.appearance.id), ["first", "second"]); assert.equal(state.next, "");
});

test("missing configuration sends nothing and rate-limited retries wait for the provider interval", async t => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => { calls++; return new Response("Limit", { status: 429, headers: { "retry-after": "1" } }); });
  let state!: ReturnType<typeof useKlipyGallery>;
  function Probe({ apiKey }: { apiKey: string }) { state = useKlipyGallery(apiKey, "", "en"); return null; }
  let view!: ReactTestRenderer; await act(async () => { view = create(<Probe apiKey="" />); }); t.after(() => act(() => view.unmount()));
  assert.equal(state.configured, false); assert.equal(calls, 0);
  await act(async () => { view.update(<Probe apiKey="key" />); await frame(); });
  assert.equal(state.error?.kind, "rate"); act(() => state.retry()); assert.equal(calls, 1);
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 1050)); });
  await act(async () => { state.retry(); await frame(); }); assert.equal(calls, 2);
});
