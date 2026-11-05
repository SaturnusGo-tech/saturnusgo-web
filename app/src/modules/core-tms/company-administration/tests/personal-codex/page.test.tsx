import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, nodes } from "../../../portfolios/tests/support/component-harness";
import type { PersonalAdministrationWorkspace } from "../../composition/personal/PersonalAdministrationWorkspace";
test("the server-authorized owner reaches existing Codex administration from the personal account shell", () => {
  const h = componentHarness();
  const { PersonalAdministrationWorkspace: View } = h.load<{ PersonalAdministrationWorkspace: typeof PersonalAdministrationWorkspace }>(new URL("../../composition/personal/PersonalAdministrationWorkspace.tsx", import.meta.url), name => {
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
    if (name.endsWith("TmsSessionContext")) return { useTmsSession: () => ({ subject: "cloud:owner" }) };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("administration-client")) return { createAdministrationClient: () => ({}) };
    if (name.endsWith("useAdministrationResource")) return { useAdministrationResource: () => ({ value: { name: "Team" }, loading: false, refresh() {} }) };
    if (name.endsWith("useAdministrationNavigation")) return { useAdministrationNavigation: () => ({ route: { page: "codex" }, navigate() {} }) };
    if (name.endsWith("useWorkspaceCodex")) return { useWorkspaceCodex: () => ({ employee: { canManage: true } }) };
  });
  const all = nodes(h.render(() => View({ workspaceId: "space" })));
  assert.equal(all.find(node => node.type === "PersonalAdministrationShell")!.props.page, "codex");
  assert.ok(all.some(node => node.type === "CompanyCodexAdminFeature"));
});
