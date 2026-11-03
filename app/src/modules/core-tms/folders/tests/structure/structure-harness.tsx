import { createRequire } from "node:module";
import { after, before, type TestContext } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { FolderResource, RepositoryFolder } from "../../model/folder";

const require = createRequire(import.meta.url), previousCss = require.extensions[".css"];
const globals = ["React", "requestAnimationFrame", "cancelAnimationFrame"] as const;
const previous = new Map(globals.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
let Page: typeof import("../../presentation/structure/FolderStructurePage")["FolderStructurePage"];
before(async () => {
  require.extensions[".css"] = module => { module.exports = {}; };
  Object.assign(globalThis, { React, requestAnimationFrame: () => 1, cancelAnimationFrame() {} });
  ({ FolderStructurePage: Page } = await import("../../presentation/structure/FolderStructurePage"));
});
after(() => {
  if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];
  for (const key of globals) { const value = previous.get(key); if (value) Object.defineProperty(globalThis, key, value); else Reflect.deleteProperty(globalThis, key); }
});
export function folder(id: string, name: string, parentId: string | null = null, path = `/${name}`): RepositoryFolder {
  return { id, name, parentId, path, appearance: null, workspaceId: "w", projectId: "p", archivedAt: null, rowVersion: 1,
    createdAt: "2026-11-04T00:00:00Z", updatedAt: "2026-11-04T00:00:00Z", etag: `folder:${id}:1` };
}
export function fixture(t: TestContext, overrides: Partial<FolderResource> = {}) {
  const calls: { name: string; parentId: string | null }[] = [];
  let back = 0, reloads = 0;
  const resource: FolderResource = { items: [folder("api", "API"), folder("auth", "Auth", "api", "/API/Auth"),
    folder("empty", "Empty"), { ...folder("archived", "Archived"), archivedAt: "2026-11-03T00:00:00Z" }],
    loading: false, busy: false, error: "", canManage: true, reload() { reloads++; },
    async create(name, parentId) { calls.push({ name, parentId }); return folder(`created-${calls.length}`, name, parentId, parentId ? `/API/${name}` : `/${name}`); },
    async update() { return false; }, async archive() { return false; }, async restore() { return false; },
    async moveCases() { return { ok: false, message: "unused" }; }, async archiveCases() { return { ok: false, message: "unused" }; }, ...overrides };
  let root!: ReactTestRenderer;
  const render = () => <Page resource={resource} ru={false} onBack={() => { back++; }} />;
  act(() => { root = create(render()); });
  t.after(() => act(() => root.unmount()));
  return { resource, calls, back: () => back, reloads: () => reloads, get root() { return root; },
    update: (next: Partial<FolderResource>) => { Object.assign(resource, next); act(() => root.update(render())); },
    buttons: (label: string) => root.root.findAllByType("button").filter(node => node.props["aria-label"] === label),
    submit: async () => { const form = root.root.findByType("form"); await act(async () => { await form.props.onSubmit({ preventDefault() {} }); }); },
    name: (value: string) => act(() => root.root.findByProps({ "aria-label": "Folder name" }).props.onChange({ target: { value } })),
  };
}
