import assert from "node:assert/strict";
import test from "node:test";
import { hookHarness } from "../../../../state/navigation/browser/tests/project/hook-harness";
import { portfolioRouteUrl } from "../../../../portfolios/navigation/portfolio-route";
import type { useWorkspaceResourceActions } from "../../../../state/workspace-resources/useWorkspaceResourceActions";

test("the global New project action opens its page without retaining a portfolio, inspector or old folder", () => {
  const h = hookHarness("https://tms.example/work/?workspaceId=w&projectId=p&view=portfolios&catalogProjectId=p&portfolioId=old&projectTab=cases&folderId=old-folder&caseId=c");
  const events: string[] = [];
  const hook = h.load<{ useWorkspaceResourceActions: typeof useWorkspaceResourceActions }>(new URL("../../../../state/workspace-resources/useWorkspaceResourceActions.ts", import.meta.url), (name) => {
    if (name.endsWith("portfolio-route")) return { portfolioRouteUrl };
    if (name.endsWith("workspace-history")) return { navigateWorkspace: (href: string) => { events.push("navigate"); h.navigate(href); } };
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ t: (key: string) => key }) };
    if (name.endsWith("-api")) return {};
    throw new Error(name);
  }).useWorkspaceResourceActions;
  const state = { connection: "connected", setDialog: (dialog: unknown) => { assert.equal(dialog, null); events.push("close-dialog"); },
    setView: (view: string) => { assert.equal(view, "portfolios"); events.push("view"); } };
  const actions = h.render(() => hook(state as Parameters<typeof hook>[0], {} as Parameters<typeof hook>[1], () => assert.fail("No mutation should occur")));
  actions.openNewProject();
  assert.deepEqual(events, ["close-dialog", "navigate", "view"]);
  assert.deepEqual(Object.fromEntries(new URL(h.window.location.href).searchParams), {
    workspaceId: "w", projectId: "p", view: "portfolios", organizationCreate: "project",
  });
  h.dispose();
});
