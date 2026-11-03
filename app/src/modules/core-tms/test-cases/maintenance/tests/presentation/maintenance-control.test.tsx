import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
require.extensions[".css"] = module => { module.exports = {}; };
const { MaintenanceControl } = require("../../presentation/MaintenanceControl") as typeof import("../../presentation/MaintenanceControl");
const source = { runId: "r", runItemId: "i", attemptNo: 2, revision: 4 };
const projection = { status: "current", rowVersion: 0, updatedBy: null, updatedAt: null, note: null, source: null, etag: "own-etag" } as const;
function setup(overrides: Record<string, unknown> = {}) {
  const writes: unknown[] = []; let refreshes = 0;
  const state = { projection, pending: false, loading: false, error: null, etag: "own-etag", change: async (change: unknown) => { writes.push(change); return true; }, refresh: () => { refreshes++; }, ...overrides } as unknown as Parameters<typeof MaintenanceControl>[0]["state"];
  return { state, writes, refreshes: () => refreshes, render: (canManage = true, runSource: typeof source | undefined = source) => <MaintenanceControl state={state} workspaceId="w" ru canManage={canManage} source={runSource} /> };
}
test("run maintenance sends only mark context and optional reason while explaining unchanged execution", async () => {
  const h = setup(); let view!: ReactTestRenderer; await act(async () => { view = create(h.render()); });
  const trigger = view.root.findByProps({ "aria-label": "Отправить на доработку" });
  assert.ok(trigger.props["aria-describedby"]);
  assert.match(JSON.stringify(view.toJSON()), /Результат прогона/);
  await act(async () => trigger.props.onClick());
  await act(async () => view.root.findByType("textarea").props.onChange({ target: { value: "Уточнить шаг" } }));
  await act(async () => view.root.findByType("form").props.onSubmit({ preventDefault() {} }));
  assert.deepEqual(h.writes, [{ status: "needs_update", source, note: "Уточнить шаг" }]);
  await act(async () => view.unmount());
});
test("source case retains a needs-update star and offers explicit clear, including after a new revision", async () => {
  const h = setup({ projection: { ...projection, status: "needs_update", rowVersion: 3, source, note: "Старая формулировка" } });
  let view!: ReactTestRenderer; await act(async () => { view = create(h.render(true, undefined)); });
  const trigger = view.root.findByProps({ "aria-label": "На доработке" });
  assert.match(JSON.stringify(view.toJSON()), /На доработке/);
  await act(async () => trigger.props.onClick());
  assert.match(JSON.stringify(view.toJSON()), /Старая формулировка/);
  assert.ok(view.root.findAllByType("button").some(button => button.children.includes("Снять отметку")));
  await act(async () => view.root.findByType("form").props.onSubmit({ preventDefault() {} }));
  assert.deepEqual(h.writes, [{ status: "current" }]);
  await act(async () => view.unmount());
});
test("read-only viewers see the persistent star and reason while maintenance writes stay unavailable", async () => {
  const h = setup({ projection: { ...projection, status: "needs_update", source } });
  let view!: ReactTestRenderer; await act(async () => { view = create(h.render(false)); });
  await act(async () => view.root.findByProps({ "aria-label": "На доработке" }).props.onClick());
  assert.equal(view.root.findAllByType("form").length, 0); assert.equal(h.writes.length, 0);
  await act(async () => view.unmount());
});
test("clearing the source-case badge returns keyboard focus to a surviving header action", async () => {
  let focused = 0, view!: ReactTestRenderer;
  const fallback = { isConnected: true, focus: () => { focused++; } };
  const h = setup({ projection: { ...projection, status: "needs_update", source } });
  const render = () => <MaintenanceControl state={h.state} workspaceId="w" ru canManage />;
  h.state.change = async () => { h.state.projection = projection; view.update(render()); return true; };
  await act(async () => { view = create(render(), { createNodeMock: element => element.props.role === "dialog" ? null : element.type === "div" ? {
    closest: () => ({ querySelector: () => fallback }), contains: () => false,
  } : { isConnected: false, focus() {} } }); });
  await act(async () => view.root.findByProps({ "aria-label": "На доработке" }).props.onClick());
  await act(async () => view.root.findByType("form").props.onSubmit({ preventDefault() {} }));
  assert.equal(view.toJSON(), null); assert.equal(focused, 1);
  await act(async () => view.unmount());
});
test("a failed conflict reload does not claim that the current maintenance state was loaded", async () => {
  const h = setup({ error: "conflict", etag: null }); let view!: ReactTestRenderer;
  await act(async () => { view = create(h.render()); });
  await act(async () => view.root.findByProps({ "aria-label": "Отправить на доработку" }).props.onClick());
  const content = JSON.stringify(view.toJSON());
  assert.doesNotMatch(content, /Загружено актуальное состояние/);
  assert.equal(view.root.findAllByType("button").find(button => button.props.type === "submit")?.props.disabled, true);
  await act(async () => view.unmount());
});
