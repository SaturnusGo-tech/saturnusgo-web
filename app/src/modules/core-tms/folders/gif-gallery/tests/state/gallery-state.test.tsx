import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsApiError, type TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { useKlipyGallery } from "../../state/useKlipyGallery";
import { galleryHttp, gifPage, frame, type GalleryCall } from "../helpers/http";
Object.assign(globalThis, { React });
type Pending = GalleryCall & { resolve(value: unknown): void; reject(reason: unknown): void };
function pendingClient(calls: Pending[]) {
  return galleryHttp(call => new Promise((resolve, reject) => { calls.push({ ...call, resolve, reject }); }));
}

test("rapid queries debounce, abort old workspace reads and ignore late old pages", async t => {
  const calls: Pending[] = [], http = pendingClient(calls);
  let state!: ReturnType<typeof useKlipyGallery>;
  function Probe({ query }: { query: string }) { state = useKlipyGallery(http, "workspace", query, "en"); return null; }
  let view!: ReactTestRenderer; await act(async () => { view = create(<Probe query="" />); }); t.after(() => act(() => view.unmount()));
  assert.equal(calls.length, 1);
  await act(async () => { view.update(<Probe query="dog" />); }); assert.equal(calls[0].signal.aborted, true);
  await act(async () => { view.update(<Probe query="cat & mouse" />); }); assert.equal(state.items.length, 0);
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 330)); });
  assert.equal(calls.length, 2); assert.equal(new URL(calls[1].path, "https://falcon.invalid").searchParams.get("q"), "cat & mouse");
  await act(async () => { calls[1].resolve(gifPage("cat")); await frame(); });
  await act(async () => { calls[0].resolve(gifPage("old")); await frame(); });
  assert.deepEqual(state.items.map(item => item.appearance.id), ["cat"]); assert.equal(state.loading, false);
});

test("load more locks synchronously and retries the failed cursor without losing ordered items", async t => {
  const calls: Pending[] = [], http = pendingClient(calls); let state!: ReturnType<typeof useKlipyGallery>;
  function Probe() { state = useKlipyGallery(http, "workspace", "", "en"); return null; }
  let view!: ReactTestRenderer; await act(async () => { view = create(<Probe />); }); t.after(() => act(() => view.unmount()));
  await act(async () => { calls[0].resolve(gifPage("first", "opaque")); await frame(); });
  act(() => { state.more(); state.more(); }); assert.equal(calls.length, 2);
  assert.equal(new URL(calls[1].path, "https://falcon.invalid").searchParams.get("cursor"), "opaque");
  await act(async () => { calls[1].reject(new TmsApiError("Unavailable", 503, null)); await frame(); });
  assert.deepEqual(state.items.map(item => item.appearance.id), ["first"]); assert.equal(state.error?.kind, "network");
  act(() => state.retry()); assert.equal(calls[2].path, calls[1].path);
  await act(async () => { calls[2].resolve(gifPage("second")); await frame(); });
  assert.deepEqual(state.items.map(item => item.appearance.id), ["first", "second"]); assert.equal(state.next, "");
});

test("missing authenticated scope sends nothing and rate-limited retries respect the server interval", async t => {
  let calls = 0; const http = galleryHttp(async () => { calls++; throw Object.assign(new TmsApiError("Rate limited", 429, null), { retryAfterSeconds: 1 }); });
  let state!: ReturnType<typeof useKlipyGallery>;
  function Probe({ client, workspaceId }: { client: TmsHttpClient | null; workspaceId: string }) { state = useKlipyGallery(client, workspaceId, "", "en"); return null; }
  let view!: ReactTestRenderer; await act(async () => { view = create(<Probe client={null} workspaceId="workspace" />); }); t.after(() => act(() => view.unmount()));
  assert.equal(state.configured, false); assert.equal(calls, 0);
  await act(async () => { view.update(<Probe client={http} workspaceId="" />); }); assert.equal(calls, 0);
  await act(async () => { view.update(<Probe client={http} workspaceId="workspace" />); await frame(); });
  assert.equal(state.error?.kind, "rate"); act(() => state.retry()); assert.equal(calls, 1);
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 1050)); });
  await act(async () => { state.retry(); await frame(); }); assert.equal(calls, 2);
});

for (const transition of ["unmount", "query change"] as const) {
  test(`selected GIF reporting completes after ${transition} while catalog reads abort`, async t => {
    const calls: Pending[] = [], http = pendingClient(calls); let state!: ReturnType<typeof useKlipyGallery>;
    function Probe({ query }: { query: string }) { state = useKlipyGallery(http, "workspace", query, "en"); return null; }
    let view!: ReactTestRenderer; await act(async () => { view = create(<Probe query="" />); }); t.after(() => act(() => view.unmount()));
    await act(async () => { calls[0].resolve(gifPage("selected", "next-page")); await frame(); });
    act(() => { state.share(state.items[0]); state.more(); });
    const share = calls.find(call => call.method === "POST")!, read = calls.find(call => call.path.includes("cursor=next-page"))!;
    assert.deepEqual(share.body, { id: "selected" });
    await act(async () => { if (transition === "unmount") view.unmount(); else view.update(<Probe query="new query" />); });
    assert.equal(read.signal.aborted, true); assert.equal(share.signal.aborted, false);
    await act(async () => { share.resolve(undefined); await frame(); });
    assert.equal(share.signal.aborted, false);
  });
}

for (const transition of ["workspace", "client"] as const) {
  test(`${transition} changes clear prior results, abort reads and reject late completions`, async t => {
    const oldCalls: Pending[] = [], newCalls: Pending[] = [], first = pendingClient(oldCalls), second = pendingClient(newCalls);
    let state!: ReturnType<typeof useKlipyGallery>;
    function Probe({ http, workspaceId }: { http: TmsHttpClient; workspaceId: string }) { state = useKlipyGallery(http, workspaceId, "", "en"); return null; }
    let view!: ReactTestRenderer; await act(async () => { view = create(<Probe http={first} workspaceId="first" />); }); t.after(() => act(() => view.unmount()));
    await act(async () => { oldCalls[0].resolve(gifPage("old", "next")); await frame(); }); act(() => state.more());
    await act(async () => { view.update(<Probe http={transition === "client" ? second : first} workspaceId={transition === "workspace" ? "second" : "first"} />); });
    assert.equal(oldCalls[1].signal.aborted, true); assert.equal(state.items.length, 0);
    const fresh = transition === "client" ? newCalls[0] : oldCalls[2];
    await act(async () => { fresh.resolve(gifPage("fresh")); oldCalls[1].resolve(gifPage("stale")); await frame(); });
    assert.deepEqual(state.items.map(item => item.appearance.id), ["fresh"]);
  });
}
