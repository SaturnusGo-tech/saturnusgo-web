import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes, type Node } from "../../../../portfolios/tests/support/component-harness";
import type { IntegrationPluginDetail } from "../IntegrationPluginDetail";
import { pluginContent } from "../content/plugin-content";
import { isProvider } from "../../../../connectors/model/connector-types";
import { INTEGRATIONS } from "../../catalog/integration-definitions";
const text = (value: unknown): string => Array.isArray(value) ? value.map(text).join("") : typeof value === "string" ? value : value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : "";
test("each supported integration has localized real workflows rather than generic Codex claims", () => {
  for (const item of INTEGRATIONS.filter(item => item.id === "youtrack" || isProvider(item.id))) for (const ru of [false, true]) {
    const content = pluginContent(item.id, ru); assert.equal(content.workflows.length, 3); assert.ok(content.purpose.length > 30); assert.doesNotMatch(content.purpose, /Codex|OAuth/);
  }
});
test("registration is account and project scoped, and both setup controls open Manage", () => {
  const h = componentHarness(); let phase = "idle", prepared = false, received: unknown, installed = 0, managed = 0;
  const { IntegrationPluginDetail: View } = h.load<{ IntegrationPluginDetail: typeof IntegrationPluginDetail }>(new URL("../IntegrationPluginDetail.tsx", import.meta.url), name => {
    if (name.endsWith("usePluginRegistration")) return { usePluginRegistration: (input: unknown) => { received = input; return { phase, prepared, install: async () => { installed++; } }; } };
    if (name.endsWith("plugin-content")) return { pluginContent };
  });
  const render = () => h.render(() => View({ id: "github", ru: false, status: "available", accountKey: "qa-one", scopeKey: "company-a:project-a", onBack() {}, onManage: () => { managed++; } }));
  const action = () => nodes(render()).find(node => node.type === "PluginInstallAction")!;
  assert.deepEqual(received, undefined); assert.equal(action().props.installed, false);
  assert.deepEqual(JSON.parse(JSON.stringify(received)), { id: "github", accountKey: "qa-one", scopeKey: "company-a:project-a" });
  invoke(action(), "onInstall"); assert.equal(installed, 1); prepared = true; phase = "ready"; assert.equal(action().props.installed, true);
  invoke(action(), "onManage"); assert.equal(managed, 1);
  const connection = nodes(render()).find(node => node.type === "button" && text(node).includes("Authorization, rules"))!; invoke(connection, "onClick"); assert.equal(managed, 2);
  phase = "error";
  const toast = nodes(render()).find(node => node.type === "ErrorToast");
  assert.match(String(toast?.props.message), /Could not prepare the plugin/);
  assert.equal(typeof toast?.props.onRetry, "function");
  h.dispose();
});
