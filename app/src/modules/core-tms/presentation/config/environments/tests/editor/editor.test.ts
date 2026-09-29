import test from "node:test";
import assert from "node:assert/strict";
import { componentHarness, nodes, invoke } from "../../../../../portfolios/tests/support/component-harness";
import { getEnvironmentDialogCopy } from "../../../../dialogs/environment/copy";
import type { EnvironmentEditor } from "../../editor/EnvironmentEditor";
import type { Environment } from "../../../../../../../core/tms/contracts/legacy-contract";

const environment = { id: "env", projectId: "p", name: "Staging", key: "STAGING", baseUrl: "https://old.example", description: "Old", status: "active", isDefault: false } as Environment;
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup(read: () => Promise<unknown>, write: (input: Record<string, unknown>) => Promise<unknown>) {
  const h = componentHarness(); let saved: Environment | null = null;
  const module = h.load<{ EnvironmentEditor: typeof EnvironmentEditor }>(new URL("../../editor/EnvironmentEditor.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("copy")) return { getEnvironmentDialogCopy };
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => http };
    if (name.endsWith("readEnvironmentForEdit")) return { readEnvironmentForEdit: read };
    if (name.endsWith("createEnvironment")) return { updateEnvironment: write, createEnvironment: write };
  });
  const http = {};
  return { h, saved: () => saved, render: (editing: boolean) => nodes(h.render(() => module.EnvironmentEditor({ projectId: "p", environment: editing ? environment : undefined, offline: false, onClose() {}, onBusy() {}, onSaved(value) { saved = value; } }))) };
}
test("edit uses freshly loaded data and ETag; retry preserves draft and operation key", async () => {
  const calls: Record<string, unknown>[] = [];
  const s = setup(async () => ({ data: { ...environment, name: "Fresh" }, etag: "etag-v2" }), async input => { calls.push(input); if (calls.length === 1) throw Error("offline"); return { data: environment }; });
  s.render(true); await tick(); let tree = s.render(true);
  const name = tree.find(node => node.type === "input" && node.props["aria-label"] === "Name")!;
  assert.equal(name.props.value, "Fresh"); invoke(name, "onChange", { target: { value: "Renamed" } });
  tree = s.render(true); await invoke(tree.find(node => node.type === "form")!, "onSubmit", { preventDefault() {} });
  tree = s.render(true); assert.equal(tree.some(node => node.props.role === "alert"), true);
  await invoke(tree.find(node => node.type === "form")!, "onSubmit", { preventDefault() {} });
  assert.equal(calls[0].etag, "etag-v2"); assert.equal(calls[0].name, "Renamed"); assert.equal(calls[0].operationKey, calls[1].operationKey); assert.ok(s.saved());
});
test("failed version lookup never permits overwriting an environment", async () => {
  let calls = 0; const s = setup(async () => { throw Error("unavailable"); }, async () => { calls++; });
  s.render(true); await tick(); const tree = s.render(true);
  await invoke(tree.find(node => node.type === "form")!, "onSubmit", { preventDefault() {} });
  assert.equal(calls, 0); assert.equal(tree.some(node => node.props.role === "alert"), true);
});
