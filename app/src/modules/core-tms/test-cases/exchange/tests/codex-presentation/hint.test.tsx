import assert from "node:assert/strict";
import test from "node:test";
import type { ImportCodexHint } from "../../library/presentation/codex/ImportCodexHint";
import type { ImportCodexState } from "../../state/codex/import-codex-connection";
import { importCodexSetupLink } from "../../state/codex/import-codex-connection";
import { codexImportCopy } from "../../localization/codex/copy";
import { componentHarness, nodes } from "../../../../portfolios/tests/support/component-harness";

function text(value: unknown): string {
  if (Array.isArray(value)) return value.map(text).join(" ");
  if (value && typeof value === "object" && "props" in value) return text((value as { props: { children?: unknown } }).props.children);
  return typeof value === "string" ? value : "";
}
function fixture(status: ImportCodexState["status"], ru = false, busy = false) {
  const h = componentHarness("https://tenant.example/work/?workspaceId=w&projectId=p&view=imports", { URLSearchParams });
  const state: ImportCodexState = { status, pluginUrl: "https://chatgpt.com/plugins/falcon-current", canConnect: true,
    canUpload: false, canExport: status === "ready" || status === "limited" };
  const { ImportCodexHint: View } = h.load<{ ImportCodexHint: typeof ImportCodexHint }>(new URL("../../library/presentation/codex/ImportCodexHint.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: ru ? "ru" : "en" }) };
    if (name.endsWith("use-import-codex-connection")) return { useImportCodexConnection: () => state };
    if (name.endsWith("import-codex-connection")) return { importCodexSetupLink };
    if (name.endsWith("/copy")) return { codexImportCopy };
  });
  const view = h.render(() => View({ workspaceId: "w", projectId: "p", canManage: true, busy }));
  return { all: nodes(view), text: text(view) };
}

test("unconnected guidance exposes the real installation, current MCP setup and a help prompt without extra buttons", () => {
  const result = fixture("available");
  assert.match(result.text, /Falcon plugin/); assert.match(result.text, /MCP/);
  assert.equal(result.all.some(node => node.type === "button"), false);
  assert.equal(result.all.find(node => node.type === "a" && String(node.props.href).startsWith("https://chatgpt.com/plugins/"))?.props.href,
    "https://chatgpt.com/plugins/falcon-current");
  assert.match(String(result.all.find(node => node.type === "a" && String(node.props.href).includes("pluginSetup=connect"))?.props.href), /projectId=p/);
  assert.equal(result.all.find(node => node.type === "IntegrationGuideLink")?.props.article, "codex-capabilities-exchange");
});

test("ready grants keep the guidance visible and disclose missing file-upload rights", () => {
  const result = fixture("ready");
  assert.match(result.text, /project access/i); assert.match(result.text, /enable.*Falcon plugin/i);
  assert.match(result.text, /attachment|upload/i);
  assert.equal(result.all.find(node => node.type === "IntegrationGuideLink")?.props.article, "codex-capabilities-exchange");
  assert.equal(result.all.some(node => node.type === "a" && String(node.props.href).startsWith("https://chatgpt.com/plugins/")), false);
});

test("Russian guidance and honest unresolved states use the same compact surface", () => {
  assert.match(fixture("available", true).text, /плагин Falcon/);
  assert.match(fixture("checking").text, /Checking/);
  assert.match(fixture("unknown").text, /Couldn.t check/);
  assert.match(fixture("limited").text, /export|Export/);
});

test("busy imports retain the guidance while preventing navigation away from the operation", () => {
  const result = fixture("available", false, true);
  assert.match(result.text, /Falcon plugin/);
  assert.equal(result.all.some(node => node.type === "a" || node.type === "IntegrationGuideLink"), false);
  assert.ok(result.all.some(node => node.props["aria-disabled"] === true));
});
