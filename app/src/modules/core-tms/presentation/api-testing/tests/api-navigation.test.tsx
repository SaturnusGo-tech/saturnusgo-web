import assert from "node:assert/strict";
import test from "node:test";
import type { ApiTestingView } from "../ApiTestingView";
import { pluginSettingsLink } from "../../config/navigation/plugins/plugin-settings-route";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
function fixture(items: { id: string; name: string; enabled: boolean }[] = []) {
  const h = componentHarness("https://company.test/work/?workspaceId=w&projectId=p&view=api&caseId=c"); const visits: string[] = [];
  const { ApiTestingView: View } = h.load<{ ApiTestingView: typeof ApiTestingView }>(new URL("../ApiTestingView.tsx", import.meta.url), name => {
    if (name === "next/dynamic") return { default: () => "SwaggerDocument" };
    if (name.endsWith("workspace-history")) return { visitWorkspace: (url: string) => visits.push(url) };
    if (name.endsWith("plugin-settings-route")) return { pluginSettingsLink };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
    if (name.endsWith("useApiContext")) return { useApiContext: () => ({ context: { projectIds: ["p"] } }) };
    if (name.endsWith("api-context")) return { apiContextKey: () => "p" };
    if (name.endsWith("useApiSourceList")) return { useApiSourceList: () => ({ items, loading: false, error: null, refresh() {} }) };
    if (name.endsWith("useApiSelection")) return { useApiSelection: () => ({ source: items.length === 1 ? items[0] : null }) };
    if (name.endsWith("useApiDocument")) return { useApiDocument: () => ({ loading: false, error: null, document: null, reload() {} }) };
  });
  return { visits, render: (canManage: boolean) => nodes(h.render(() => View({ scope: { workspaceId: "w", projectId: "p" }, canManage }))) };
}
test("empty API Testing has one direct Swagger setup action preserving exact workspace scope", () => {
  const f = fixture(), all = f.render(true);
  const connect = all.find(node => node.type === "button" && node.props.children === "Connect Swagger")!;
  assert.ok(connect); assert.equal(all.some(node => node.type === "ApiSourceManager"), false);
  invoke(connect, "onClick");
  const target = new URL(f.visits[0], "https://company.test");
  assert.equal(target.search, "?workspaceId=w&projectId=p&view=config&settings=plugins&plugin=swagger&pluginSetup=connect");
});
test("read-only API Testing empty state never offers management access", () => {
  const f = fixture(), all = f.render(false);
  assert.equal(all.filter(node => node.type === "button").length, 0);
  assert.equal(all.find(node => node.type === "ApiTestingActions")?.props.canManage, false);
  assert.equal(f.visits.length, 0);
});

test("a single API does not add a redundant service selector and Manage opens the plugin overview", () => {
  const f = fixture([{ id: "a", name: "Booking API", enabled: true }]), all = f.render(true);
  assert.equal(all.some(node => node.type === "AnimatedSelect"), false);
  const actions = all.find(node => node.type === "ApiTestingActions")!;
  assert.ok(actions, "secondary actions are grouped behind one overflow trigger");
  invoke(actions, "onManage");
  const target = new URL(f.visits[0], "https://company.test");
  assert.equal(target.searchParams.get("plugin"), "swagger");
  assert.equal(target.searchParams.has("pluginSetup"), false);
});
test("multiple APIs retain a service selector", () => {
  const f = fixture([{ id: "a", name: "Booking API", enabled: true }, { id: "b", name: "Payments", enabled: true }]);
  assert.ok(f.render(true).some(node => node.type === "AnimatedSelect"));
});
