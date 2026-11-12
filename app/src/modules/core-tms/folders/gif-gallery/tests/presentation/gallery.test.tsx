import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import type { KlipyAppearance } from "../../model/klipy-types";
import { TmsHttpClientProvider } from "../../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../../auth/presentation/session/TmsSessionContext";
import { FolderAppearanceContext } from "../../../state/appearance/folder-appearance-context";
import { galleryHttp, gifPage, type GalleryCall } from "../helpers/http";
const require = createRequire(import.meta.url), oldCss = require.extensions[".css"], oldReact = Object.getOwnPropertyDescriptor(globalThis, "React");
let Gallery: typeof import("../../presentation/KlipyGallery")["KlipyGallery"];
before(async () => { require.extensions[".css"] = module => { module.exports = {}; }; Object.assign(globalThis, { React });
  ({ KlipyGallery: Gallery } = await import("../../presentation/KlipyGallery")); });
after(() => { if (oldCss) require.extensions[".css"] = oldCss; else delete require.extensions[".css"];
  if (oldReact) Object.defineProperty(globalThis, "React", oldReact); else Reflect.deleteProperty(globalThis, "React"); });
function authenticated(send: (call: GalleryCall) => Promise<unknown>, content: React.ReactNode) {
  return <TmsHttpClientProvider client={galleryHttp(send)}><TmsSessionProvider value={{ kind: "managed", label: "Tester", subject: "user", workspaceId: "workspace", signOut: async () => {} }}>{content}</TmsSessionProvider></TmsHttpClientProvider>;
}

test("without authenticated scope the gallery stays attributed, disabled and sends no requests", async t => {
  let calls = 0; t.mock.method(globalThis, "fetch", async () => { calls++; throw new Error("Unexpected browser provider request"); });
  let view!: ReturnType<typeof create>; await act(async () => { view = create(<Gallery ru={false} onChoose={() => {}} />); });
  t.after(() => act(() => view.unmount()));
  assert.match(JSON.stringify(view.toJSON()), /GIF gallery is not available yet/); assert.equal(calls, 0);
  assert.equal(view.root.findByProps({ "aria-label": "Search GIFs on KLIPY" }).props.disabled, true);
  assert.equal(view.root.findByProps({ type: "search" }).props.placeholder, "Search KLIPY");
  assert.equal(view.root.findByProps({ href: "https://klipy.com" }).children.includes("Powered by KLIPY"), true);
});

test("authenticated selection preserves appearance and attribution and reports through the workspace API", async t => {
  const calls: GalleryCall[] = [], choices: KlipyAppearance[] = [];
  const delivery = "https://static.klipy.com/actual.gif?delivery=preserved";
  const send = async (call: GalleryCall) => { calls.push(call); return call.method === "POST" ? undefined : { ...gifPage("123"), items: [{ id: "123", title: "Wave", description: "A friendly wave", credit: "Artist", sourceUrl: "https://klipy.com/gifs/wave", url: delivery }] }; };
  let view!: ReturnType<typeof create>; await act(async () => { view = create(authenticated(send, <Gallery ru={false} onChoose={value => choices.push(value)} />)); });
  t.after(() => act(() => view.unmount()));
  assert.equal(view.root.findByProps({ href: "https://klipy.com/gifs/wave" }).children.includes("Source"), true);
  assert.match(JSON.stringify(view.toJSON()), /Artist/);
  await act(async () => view.root.findByProps({ "aria-label": "Use GIF: A friendly wave" }).props.onClick());
  assert.deepEqual(choices, [{ kind: "gif", provider: "klipy", id: "123", url: delivery, sourceUrl: "https://klipy.com/gifs/wave" }]);
  assert.equal(calls[1].path, "/workspaces/workspace/gifs/share"); assert.equal(calls[1].method, "POST");
});

test("the branded search shell sends typed queries through authenticated transport after debounce", async t => {
  const calls: GalleryCall[] = []; const send = async (call: GalleryCall) => { calls.push(call); return { items: [], next: "" }; };
  let view!: ReturnType<typeof create>; await act(async () => { view = create(authenticated(send, <Gallery ru onChoose={() => {}} />)); });
  t.after(() => act(() => view.unmount()));
  const search = view.root.findByProps({ type: "search" });
  assert.equal(search.parent?.props["data-input-shell"], true); assert.equal(search.props.disabled, false);
  assert.equal(search.props.placeholder, "Search KLIPY"); assert.equal(search.props["aria-label"], "Поиск GIF в KLIPY");
  await act(async () => search.props.onChange({ target: { value: "happy" } })); assert.equal(calls.length, 1);
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 330)); });
  const url = new URL(calls[1].path, "https://falcon.invalid"); assert.equal(url.searchParams.get("q"), "happy"); assert.equal(url.searchParams.get("locale"), "ru");
  await act(async () => view.root.findByProps({ "aria-label": "Очистить поиск GIF" }).props.onClick());
  assert.equal(view.root.findByProps({ type: "search" }).props.value, ""); assert.equal(calls.length, 3);
  assert.equal(new URL(calls[2].path, "https://falcon.invalid").searchParams.has("q"), false);
});

test("failed reporting preserves the selected GIF and does not become a gallery failure", async t => {
  const choices: KlipyAppearance[] = [];
  const send = async (call: GalleryCall) => { if (call.method === "POST") throw new Error("Provider unavailable"); return gifPage("selected"); };
  let view!: ReturnType<typeof create>; await act(async () => { view = create(authenticated(send, <Gallery ru={false} onChoose={value => choices.push(value)} />)); });
  t.after(() => act(() => view.unmount()));
  await act(async () => view.root.findByProps({ "aria-label": "Use GIF: selected" }).props.onClick());
  assert.equal(choices[0].id, "selected"); assert.doesNotMatch(JSON.stringify(view.toJSON()), /Could not load GIFs|Provider unavailable/);
});

test("folder appearance scope supplies its workspace when the session has no workspace", async t => {
  const paths: string[] = []; const http = galleryHttp(async call => { paths.push(call.path); return { items: [], next: "" }; });
  let view!: ReturnType<typeof create>; await act(async () => { view = create(<TmsHttpClientProvider client={http}>
    <FolderAppearanceContext.Provider value={{ folders: [], workspaceId: "folder-workspace" }}><Gallery ru={false} onChoose={() => {}} /></FolderAppearanceContext.Provider>
  </TmsHttpClientProvider>); }); t.after(() => act(() => view.unmount()));
  assert.equal(paths[0], "/workspaces/folder-workspace/gifs?locale=en");
});
