import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { useFolderAppearanceCatalog } from "../../state/appearance-catalog/useFolderAppearanceCatalog";
import type { RepositoryFolder } from "../../model/folder";
const old = Object.getOwnPropertyDescriptor(globalThis, "React");
before(() => Object.assign(globalThis, { React }));
after(() => { if (old) Object.defineProperty(globalThis, "React", old); else Reflect.deleteProperty(globalThis, "React"); });

void test("visible run projects reuse scoped catalogs, bound concurrency and discard old workspace completions", async t => {
  const requests: { path: string; signal: AbortSignal; resolve(value: unknown): void }[] = [];
  const http = { get: (path: string, signal: AbortSignal) => new Promise(resolve => requests.push({ path, signal, resolve })) } as unknown as TmsHttpClient;
  let state!: ReturnType<typeof useFolderAppearanceCatalog>;
  const primary = [{ id: "active", projectId: "primary", workspaceId: "workspace-a", appearance: null }] as RepositoryFolder[];
  function Probe({ workspace }: { workspace: string }) { state = useFolderAppearanceCatalog(workspace, workspace === "workspace-a" ? primary : []); return null; }
  const render = (workspace: string) => <TmsHttpClientProvider client={http}><Probe workspace={workspace} /></TmsHttpClientProvider>;
  let view!: ReturnType<typeof create>; act(() => { view = create(render("workspace-a")); }); t.after(() => act(() => view.unmount()));
  const controller = new AbortController(); let work!: Promise<void>;
  act(() => { work = state.loadProjects(["primary", "b", "c", "d", "e"], controller.signal); });
  assert.equal(requests.length, 3); assert.equal(requests.some(r => r.path.includes("/primary/")), false);
  await act(async () => {
    requests[0]?.resolve({ data: [{ id: "b-folder", workspaceId: "workspace-a", projectId: "b", appearance: { kind: "emoji", emoji: "🐞" } }], meta: { nextCursor: null } });
    await Promise.resolve(); await Promise.resolve();
  });
  assert.equal(requests.length, 4);
  await act(async () => {
    for (const request of requests.slice(1)) request.resolve({ data: [], meta: { nextCursor: null } });
    await work;
  });
  assert.equal(state.folders.some(folder => folder.id === "b-folder"), true);
  await act(async () => { await state.loadProjects(["b", "c", "primary"], controller.signal); }); assert.equal(requests.length, 4);
  let oldWork!: Promise<void>; act(() => { oldWork = state.loadProjects(["old"], controller.signal); });
  act(() => view.update(render("workspace-b"))); await act(async () => { await Promise.resolve(); });
  assert.equal(requests[4]?.signal.aborted, true);
  await act(async () => { requests[4]?.resolve({ data: [{ id: "stale", workspaceId: "workspace-a", projectId: "old" }], meta: {} }); await oldWork; });
  assert.deepEqual(state.folders, []);
});

test("a live visible scope retries a shared catalog request aborted by its previous scope", async t => {
  const requests: { signal: AbortSignal; resolve(value: unknown): void }[] = [];
  const http = { get: (_path: string, signal: AbortSignal) => new Promise((resolve, reject) => {
    requests.push({ signal, resolve }); signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
  }) } as unknown as TmsHttpClient;
  let state!: ReturnType<typeof useFolderAppearanceCatalog>;
  function Probe() { state = useFolderAppearanceCatalog("workspace-a", [], "primary"); return null; }
  let view!: ReturnType<typeof create>; act(() => { view = create(<TmsHttpClientProvider client={http}><Probe /></TmsHttpClientProvider>); });
  t.after(() => act(() => view.unmount()));
  const first = new AbortController(), second = new AbortController(), third = new AbortController();
  let oldWork!: Promise<void>, liveWork!: Promise<void>, duplicateWork!: Promise<void>;
  await act(async () => {
    oldWork = state.loadProjects(["b"], first.signal); first.abort();
    liveWork = state.loadProjects(["b"], second.signal);
    duplicateWork = state.loadProjects(["b"], third.signal);
    await oldWork; await Promise.resolve(); await Promise.resolve();
  });
  assert.equal(requests[0]?.signal.aborted, true);
  assert.equal(requests.length, 2, "the live scope must replace the aborted shared read");
  await act(async () => {
    requests[1]!.resolve({ data: [{ id: "b-folder", workspaceId: "workspace-a", projectId: "b", appearance: null }], meta: { nextCursor: null } });
    await Promise.all([liveWork, duplicateWork]);
  });
  assert.equal(requests[1]?.signal.aborted, false); assert.equal(state.folders.some(folder => folder.id === "b-folder"), true);
});

test("a replacement consumer cancelled while awaiting shared cleanup cannot start another catalog read", async t => {
  const requests: AbortSignal[] = [];
  const http = { get: (_path: string, signal: AbortSignal) => new Promise((_resolve, reject) => {
    requests.push(signal); signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
  }) } as unknown as TmsHttpClient;
  let state!: ReturnType<typeof useFolderAppearanceCatalog>;
  function Probe() { state = useFolderAppearanceCatalog("workspace-a", [], "primary"); return null; }
  let view!: ReturnType<typeof create>; act(() => { view = create(<TmsHttpClientProvider client={http}><Probe /></TmsHttpClientProvider>); });
  t.after(() => act(() => view.unmount()));
  const first = new AbortController(), second = new AbortController();
  await act(async () => {
    const a = state.loadProjects(["b"], first.signal); first.abort();
    const b = state.loadProjects(["b"], second.signal); second.abort();
    await Promise.all([a, b]);
  });
  assert.equal(requests.length, 1); assert.equal(state.folders.length, 0);
});
