import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import ts from "typescript";
import type { VerificationQueueControl } from "../../presentation/queue/VerificationQueueControl";
import type { WorkspaceVerification } from "../../state/workspace/useWorkspaceVerification";
import { showVerificationControl } from "../../presentation/queue/visibility";
const base = { enabled: true, canStart: true, data: null, pending: false, unresolved: false,
  pendingStart: false, error: "", disabledReason: "" };
test("verification stays hidden before loading and when no linked scenarios need retesting", () => {
  assert.equal(showVerificationControl(base), false);
  assert.equal(showVerificationControl({ ...base, pending: true }), false);
  assert.equal(showVerificationControl({ ...base, data: { totalCases: 0 } }), false);
  assert.equal(showVerificationControl({ ...base, data: { totalCases: 0 }, error: "refresh failed" }), false);
});
test("ready scenarios can create a run even if the project has no existing runs", () => {
  assert.equal(showVerificationControl({ ...base, data: { totalCases: 5 } }), true);
});
test("an actual unresolved start remains recoverable independently of the current queue", () => {
  assert.equal(showVerificationControl({ ...base, data: { totalCases: 0 }, unresolved: true }), true);
  assert.equal(showVerificationControl({ ...base, unresolved: true }), true);
  assert.equal(showVerificationControl({ ...base, pending: true, unresolved: true }), true);
  assert.equal(showVerificationControl({ ...base, error: "refresh failed", unresolved: true }), true);
  assert.equal(showVerificationControl({ ...base, unresolved: true, canStart: false }), false);
  assert.equal(showVerificationControl({ ...base, unresolved: true, disabledReason: "Save your changes first" }), false);
});
test("an already started verification retains its progress during a queue refresh", () => {
  assert.equal(showVerificationControl({ ...base, pending: true, pendingStart: true }), true);
  assert.equal(showVerificationControl({ ...base, data: { totalCases: 0 }, pendingStart: true }), true);
});
test("stale counts cannot expose a disabled launcher during loading or after refresh failure", () => {
  assert.equal(showVerificationControl({ ...base, error: "load failed" }), false);
  assert.equal(showVerificationControl({ ...base, data: { totalCases: 3 }, pending: true }), false);
  assert.equal(showVerificationControl({ ...base, data: { totalCases: 3 }, error: "refresh failed" }), false);
});
test("available fixes never expose an action the current user cannot start", () => {
  assert.equal(showVerificationControl({ ...base, enabled: false, data: { totalCases: 3 } }), false);
  assert.equal(showVerificationControl({ ...base, canStart: false, data: { totalCases: 3 } }), false);
  assert.equal(showVerificationControl({ ...base, disabledReason: "Add an environment", data: { totalCases: 3 } }), false);
  assert.equal(showVerificationControl({ ...base, enabled: false, pendingStart: true }), false);
});
test("invalid counts cannot advertise actionable verification", () => {
  for (const totalCases of [-1, Number.NaN, Infinity, .5]) {
    assert.equal(showVerificationControl({ ...base, data: { totalCases } }), false);
  }
});


test("an unresolved start presents an enabled retry while the current queue is empty or refreshing", async () => {
  const require = createRequire(import.meta.url);
  const module = { exports: {} as { VerificationQueueControl: typeof VerificationQueueControl } };
  runInNewContext(ts.transpileModule(readFileSync(new URL("../../presentation/queue/VerificationQueueControl.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module, exports: module.exports, require(name: string) {
    if (name.endsWith(".css")) return { default: new Proxy({}, { get: (_target, key) => String(key) }) };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("useVerificationLauncher")) return { useVerificationLauncher: () => ({ ready: true, collapsed: false }) };
    if (name === "./visibility") return { showVerificationControl };
    return require(name);
  } });
  let started = 0;
  const state = { ...base, data: null, unresolved: true, pending: true,
    start: async () => { started += 1; } } as WorkspaceVerification;
  const tree = (value: WorkspaceVerification) => React.createElement(module.exports.VerificationQueueControl,
    { state: value, workspaceId: "workspace-1" }) as unknown as Parameters<typeof create>[0];
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => { renderer = create(tree(state)); });
    const retry = renderer.root.findAllByType("button").find(button => button.props.className === "start");
    assert.ok(retry, "The real unresolved operation needs a recovery action");
    assert.equal(retry.props.disabled, false);
    assert.match(JSON.stringify(retry.findByType("span").children), /Retry/);
    await act(async () => retry.props.onClick());
    assert.equal(started, 1);
    await act(async () => renderer.update(tree({ ...state, unresolved: false, pending: false })));
    assert.equal(renderer.toJSON(), null, "An ordinary empty queue has no launcher");
  } finally { await act(async () => renderer?.unmount()); }
});
