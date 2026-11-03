import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import type { RepositoryFolder } from "../../model/folder";
import { FolderAppearanceContext } from "../../state/appearance/folder-appearance-context";
import { folderIcons } from "../../presentation/appearance/icons/folder-icons";
import { pickerFolders } from "../../../presentation/dialogs/suite/picker/model/picker-model";

const require = createRequire(import.meta.url), previousCss = require.extensions[".css"];
const oldReact = Object.getOwnPropertyDescriptor(globalThis, "React");
let Visual: typeof import("../../presentation/appearance/visual/FolderVisual")["FolderVisual"];
let Control: typeof import("../../presentation/appearance/control/FolderAppearanceControl")["FolderAppearanceControl"];
before(async () => {
  require.extensions[".css"] = module => { module.exports = {}; }; Object.assign(globalThis, { React });
  ({ FolderVisual: Visual } = await import("../../presentation/appearance/visual/FolderVisual"));
  ({ FolderAppearanceControl: Control } = await import("../../presentation/appearance/control/FolderAppearanceControl"));
});
after(() => {
  if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];
  if (oldReact) Object.defineProperty(globalThis, "React", oldReact); else Reflect.deleteProperty(globalThis, "React");
});
const folder = { id: "api", name: "API", path: "/API", parentId: null, archivedAt: null,
  appearance: { kind: "emoji", emoji: "🧪" } } as RepositoryFolder;

test("the folder renderer resolves stable ID and path and suite adapters preserve appearance", () => {
  let view!: ReturnType<typeof create>;
  act(() => { view = create(<FolderAppearanceContext.Provider value={{ folders: [folder] }}>
    <Visual folderId="api" /><Visual path="/API" /><Visual path="/Missing" />
  </FolderAppearanceContext.Provider>); });
  assert.equal(view.root.findAllByProps({ "data-kind": "emoji" }).length, 2);
  assert.equal(view.root.findAllByProps({ "data-kind": "default" }).length, 1);
  act(() => view.unmount());
  assert.deepEqual(pickerFolders([folder], [])[0]?.appearance, folder.appearance);
  act(() => { view = create(<Visual appearance={{ kind: "icon", iconId: "star", color: "#E9759A" }} />); });
  assert.equal(view.root.findByProps({ "data-folder-visual": true }).props.style.color, "#E9759A");
  act(() => view.unmount());
  const schema = JSON.parse(readFileSync(new URL("../../../../../core/tms/generated/tms-openapi.json", import.meta.url), "utf8"));
  assert.deepEqual(Object.keys(folderIcons).sort(), schema.components.schemas.RepositoryFolderIconId.enum.slice().sort());
  assert.equal(Object.keys(folderIcons)[0], "folder");
});

test("read-only run artwork exposes no customization control", () => {
  let view!: ReturnType<typeof create>;
  act(() => { view = create(<FolderAppearanceContext.Provider value={{ folders: [folder], save: async () => folder }}>
    <Control folder={folder} ru={false} />
  </FolderAppearanceContext.Provider>); });
  assert.equal(view.root.findAllByType("button").length, 0);
  assert.equal(view.root.findAllByProps({ "data-kind": "emoji" }).length, 1);
  act(() => view.unmount());
});

test("private image access ignores stale asset responses and aborts on navigation", async t => {
  const pending: { signal: AbortSignal; resolve(value: { url: string; expiresAt: string }): void }[] = [];
  const read = (_id: string, signal: AbortSignal) => new Promise<{ url: string; expiresAt: string }>(resolve => pending.push({ signal, resolve }));
  const render = (assetId: string) => <FolderAppearanceContext.Provider value={{ folders: [], read }}>
    <Visual appearance={{ kind: "image", assetId }} />
  </FolderAppearanceContext.Provider>;
  let view!: ReturnType<typeof create>; act(() => { view = create(render("first")); });
  t.after(() => act(() => view.unmount())); act(() => view.update(render("second")));
  assert.equal(pending[0]?.signal.aborted, true);
  await act(async () => { pending[0]?.resolve({ url: "https://private.test/stale", expiresAt: new Date(Date.now() + 60000).toISOString() }); });
  assert.equal(view.root.findAllByType("img").length, 0);
  await act(async () => { pending[1]?.resolve({ url: "https://private.test/current", expiresAt: new Date(Date.now() + 60000).toISOString() }); });
  assert.equal(view.root.findByType("img").props.src, "https://private.test/current");
});

test("KLIPY artwork loads its exact CDN URL directly and falls back without private attachment access", t => {
  let reads = 0;
  const gif = { kind: "gif", provider: "klipy", id: "gif-a", url: "https://static2.klipy.com/media/a.gif?delivery=original&token=a%2Bb",
    sourceUrl: "https://klipy.com/gifs/example" } as const;
  const read = async () => { reads++; throw new Error("GIF must not request private attachment access"); };
  const render = (url: string = gif.url) => <FolderAppearanceContext.Provider value={{ folders: [], read }}>
    <Visual appearance={{ ...gif, url }} />
  </FolderAppearanceContext.Provider>;
  let view!: ReturnType<typeof create>; act(() => { view = create(render()); }); t.after(() => act(() => view.unmount()));
  assert.equal(view.root.findAllByType("img").length, 1);
  const image = view.root.findByType("img"), oldError = image.props.onError;
  assert.equal(image.props.src, gif.url); assert.equal(image.props.width, 22); assert.equal(image.props.height, 22);
  assert.equal(image.props.referrerPolicy, "strict-origin-when-cross-origin");
  const visual = view.root.findByProps({ "data-folder-visual": true });
  assert.equal(visual.props.title, "GIF via KLIPY"); assert.equal(visual.props["aria-label"], "GIF via KLIPY");
  act(() => oldError()); assert.equal(view.root.findAllByType("img").length, 0);
  assert.ok(view.root.findAllByType("svg").length > 0);
  const nextUrl = "https://static1.klipy.com/media/b.gif?delivery=original";
  act(() => view.update(render(nextUrl)));
  assert.equal(view.root.findByType("img").props.src, nextUrl);
  act(() => oldError()); assert.equal(view.root.findByType("img").props.src, nextUrl);
  assert.equal(reads, 0);
});
