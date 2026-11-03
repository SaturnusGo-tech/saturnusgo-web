import assert from "node:assert/strict";
import test from "node:test";
import type { ApiTestingView } from "../ApiTestingView";
import { pluginSettingsLink } from "../../config/navigation/plugins/plugin-settings-route";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
function fixture() {
  const h = componentHarness("https://company.test/work/?workspaceId=w&projectId=p&view=api&caseId=c"); const visits: string[] = [];
  const { ApiTestingView: View } = h.load<{ ApiTestingView: typeof ApiTestingView }>(new URL("../ApiTestingView.tsx", import.meta.url), name => {
    if (name === "next/dynamic") return { default: () => "SwaggerDocument" };
    if (name.endsWith("workspace-history")) return { visitWorkspace: (url: string) => visits.push(url) };
    if (name.endsWith("plugin-settings-route")) return { pluginSettingsLink };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
    if (name.endsWith("useApiContext")) return { useApiContext: () => ({ context: { projectIds: ["p"] } }) };
    if (name.endsWith("api-context")) return { apiContextKey: () => "p" };
    if (name.endsWith("useApiSourceList")) return { useApiSourceList: () => ({ items: [], loading: false, error: null, refresh() {} }) };
    if (name.endsWith("useApiSelection")) return { useApiSelection: () => ({ source: null }) };
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
  assert.equal(all.filter(node => node.type === "button").length, 1, "only refresh remains");
  assert.equal(f.visits.length, 0);
});
