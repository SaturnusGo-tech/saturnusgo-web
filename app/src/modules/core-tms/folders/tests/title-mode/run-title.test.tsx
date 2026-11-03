import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
require.extensions[".css"] = module => { module.exports = {}; };
const { RepositoryCaseLeaf } = require("../../presentation/case/RepositoryCaseLeaf") as typeof import("../../presentation/case/RepositoryCaseLeaf");
const item = { id: "c", key: "QA-1", title: "A long captured title" } as TestCaseSummary;
test("run title mode removes the native tooltip while ordinary repository leaves retain their presentation", async () => {
  for (const titleMode of [undefined, "marquee"] as const) {
    let view!: ReactTestRenderer;
    await act(async () => { view = create(<RepositoryCaseLeaf item={item} titleMode={titleMode} depth={0} ru={false} selected={false} active={false} locked={false} canManage={false} onOpen={() => {}} onToggle={() => {}} />); });
    const button = view.root.findByType("button");
    assert.equal(button.props.title, titleMode ? undefined : `${item.key} · ${item.title}`);
    assert.equal(button.props["aria-label"], `${item.key} · ${item.title}`);
    assert.equal(view.root.findAllByProps({ "data-case-title": true }).length, titleMode ? 1 : 0);
    await act(async () => view.unmount());
  }
});
test("SelectionTree propagates run title mode to both deeply nested and unfiled cases", async () => {
  const { SelectionTree } = require("../../../presentation/cases/selection/tree/SelectionTree") as typeof import("../../../presentation/cases/selection/tree/SelectionTree");
  const folders = [{ id: "root", name: "Root", path: "/Root", parentId: null }, { id: "child", name: "Child", path: "/Root/Child", parentId: "root" }] as import("../../model/folder").RepositoryFolder[];
  const cases = [{ ...item, id: "nested", folderId: "child", folderPath: "/Root/Child" }, { ...item, id: "free", folderId: null, folderPath: "/" }];
  let view!: ReactTestRenderer;
  await act(async () => { view = create(<SelectionTree titleMode="marquee" cases={cases} folders={folders} selected={new Set()} ru={false} onToggle={() => {}} onScope={() => {}} />); });
  const buttons = view.root.findAllByType("button").filter(button => button.props["aria-label"] === `${item.key} · ${item.title}`);
  assert.equal(buttons.length, 2); assert.ok(buttons.every(button => button.props.title === undefined));
  assert.equal(view.root.findAllByProps({ "data-case-title": true }).length, 2);
  await act(async () => view.unmount());
});
test("title overflow follows measured space and responds when the run list is resized", async () => {
  let width = 100, resize: (() => void) | undefined, disconnected = false;
  Object.assign(globalThis, { ResizeObserver: class { constructor(callback: () => void) { resize = callback; } observe() {} disconnect() { disconnected = true; } } });
  let view!: ReactTestRenderer;
  await act(async () => { view = create(<RepositoryCaseLeaf item={item} titleMode="marquee" depth={0} ru={false} selected={false} active={false} locked={false} canManage={false} onOpen={() => {}} onToggle={() => {}} />, {
    createNodeMock: element => element.props["data-case-title"] ? { get clientWidth() { return width; }, scrollWidth: 250 } : {},
  }); });
  const title = () => view.root.findByProps({ "data-case-title": true });
  assert.equal(title().props["data-overflow"], true);
  assert.equal(title().props.style["--title-offset"], "-150px");
  width = 300; await act(async () => resize?.());
  assert.equal(title().props["data-overflow"], undefined);
  await act(async () => view.unmount()); assert.equal(disconnected, true);
  delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
});
