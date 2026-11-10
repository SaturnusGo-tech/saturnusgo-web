import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
const moduleStub = { exports: {} as typeof import("../../presentation/MaintenanceControl") };
const Button = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button"> & { onPress?: () => void; isDisabled?: boolean }>(
  function Button({ onPress, isDisabled, type, children, ...rest }, ref) {
    return <button ref={ref} type={type} disabled={isDisabled} onClick={onPress}
      aria-label={rest["aria-label"]} aria-describedby={rest["aria-describedby"]}>{children}</button>;
  },
);
runInNewContext(ts.transpileModule(readFileSync(new URL("../../presentation/MaintenanceControl.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  module: moduleStub, exports: moduleStub.exports,
  require(name: string) {
    if (name === "react") return React;
    if (name === "react/jsx-runtime") return jsxRuntime;
    if (name === "@heroui/react") return {
      Button,
      Popover: ({ children, isOpen }: { children: [React.ReactNode, React.ReactNode]; isOpen: boolean }) => <>{children[0]}{isOpen && children[1]}</>,
      PopoverContent: ({ children }: { children: React.ReactNode }) => <div role="dialog">{children}</div>,
      Textarea: ({ onValueChange, value }: { onValueChange(value: string): void; value: string }) =>
        <textarea value={value} onChange={event => onValueChange(event.target.value)} />,
    };
    if (name.endsWith("/ErrorToast")) return { ErrorToast: () => null };
    if (name.endsWith("/ResponsibleName")) return { ResponsibleName: () => null };
    if (name.endsWith(".css")) return { default: {} };
    return require(name);
  },
});
const { MaintenanceControl } = moduleStub.exports;
const source = { runId: "r", runItemId: "i", attemptNo: 2, revision: 4 };
const projection = { status: "current", rowVersion: 0, updatedBy: null, updatedAt: null, note: null, source: null, etag: "own-etag" } as const;
function setup(overrides: Record<string, unknown> = {}) {
  const writes: unknown[] = []; let refreshes = 0;
  const state = { projection, pending: false, loading: false, error: null, etag: "own-etag", change: async (change: unknown) => { writes.push(change); return true; }, refresh: () => { refreshes++; }, ...overrides } as unknown as Parameters<typeof MaintenanceControl>[0]["state"];
  return { state, writes, refreshes: () => refreshes, render: (canManage = true, runSource: typeof source | undefined = source) => <MaintenanceControl state={state} workspaceId="w" ru canManage={canManage} source={runSource} /> };
}
test("run maintenance sends only mark context and optional reason while explaining unchanged execution", async () => {
  const h = setup(); let view!: ReactTestRenderer; await act(async () => { view = create(h.render()); });
  const trigger = view.root.findByType("button").findByProps({ "aria-label": "Отправить на доработку" });
  assert.ok(trigger.props["aria-describedby"]);
  assert.match(JSON.stringify(view.toJSON()), /Результат прогона/);
  await act(async () => trigger.props.onClick());
  await act(async () => view.root.findByType("textarea").props.onChange({ target: { value: "Уточнить шаг" } }));
  await act(async () => view.root.findByType("form").props.onSubmit({ preventDefault() {} }));
  assert.deepEqual(JSON.parse(JSON.stringify(h.writes)), [{ status: "needs_update", source, note: "Уточнить шаг" }]);
  await act(async () => view.unmount());
});
test("source case retains a needs-update star and offers explicit clear, including after a new revision", async () => {
  const h = setup({ projection: { ...projection, status: "needs_update", rowVersion: 3, source, note: "Старая формулировка" } });
  let view!: ReactTestRenderer; await act(async () => { view = create(h.render(true, undefined)); });
  const trigger = view.root.findAllByType("button").find(button => button.props["aria-label"] === "На доработке")!;
  assert.match(JSON.stringify(view.toJSON()), /На доработке/);
  await act(async () => trigger.props.onClick());
  assert.match(JSON.stringify(view.toJSON()), /Старая формулировка/);
  assert.ok(view.root.findAllByType("button").some(button => button.children.includes("Снять отметку")));
  await act(async () => view.root.findByType("form").props.onSubmit({ preventDefault() {} }));
  assert.deepEqual(JSON.parse(JSON.stringify(h.writes)), [{ status: "current" }]);
  await act(async () => view.unmount());
});
test("read-only viewers see the persistent star and reason while maintenance writes stay unavailable", async () => {
  const h = setup({ projection: { ...projection, status: "needs_update", source } });
  let view!: ReactTestRenderer; await act(async () => { view = create(h.render(false)); });
  await act(async () => view.root.findAllByType("button").find(button => button.props["aria-label"] === "На доработке")!.props.onClick());
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
  await act(async () => view.root.findAllByType("button").find(button => button.props["aria-label"] === "На доработке")!.props.onClick());
  await act(async () => view.root.findByType("form").props.onSubmit({ preventDefault() {} }));
  assert.equal(view.toJSON(), null); assert.equal(focused, 1);
  await act(async () => view.unmount());
});
test("a failed conflict reload does not claim that the current maintenance state was loaded", async () => {
  const h = setup({ error: "conflict", etag: null }); let view!: ReactTestRenderer;
  await act(async () => { view = create(h.render()); });
  await act(async () => view.root.findByType("button").findByProps({ "aria-label": "Отправить на доработку" }).props.onClick());
  const content = JSON.stringify(view.toJSON());
  assert.doesNotMatch(content, /Загружено актуальное состояние/);
  assert.equal(view.root.findAllByType("button").find(button => button.props.type === "submit")?.props.disabled, true);
  await act(async () => view.unmount());
});
