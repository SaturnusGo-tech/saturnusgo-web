import assert from "node:assert/strict";
import { test } from "node:test";
import type { PlanMenuLink } from "../../presentation/menu/PlanMenuLink";
import type { ManagedProfileMenu } from "../../../auth/presentation/profile-menu/ManagedProfileMenu";
import type { WorkspaceStage } from "../../../presentation/workspace-stage/WorkspaceStage";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";

test("account plan labels reflect the server plan and distinguish no subscription from unavailable", () => {
  const h = componentHarness();
  const { PlanMenuLink: render } = h.load<{ PlanMenuLink: typeof PlanMenuLink }>(new URL("../../presentation/menu/PlanMenuLink.tsx", import.meta.url));
  const label = (planId: string | null | undefined, loading = false, failed = false, ru = false) => nodes(h.render(() => render({
    summary: planId === undefined ? null : { planId } as never, loading, failed, ru, role: "menuitem",
  })))[0];
  for (const [planId, name] of [["individual", "Individual"], ["startup", "Startup"], ["enterprise", "Enterprise"]]) assert.equal(label(planId).props.children, name);
  assert.equal(label(null).props.children, "No subscription");
  assert.equal(label(null, false, false, true).props.children, "Нет подписки");
  assert.equal(label(undefined, true).props.children, "Loading plan…");
  assert.equal(label(undefined, false, true).props.children, "Plan unavailable");
  assert.equal(label(undefined).props.children, "Plan and billing");
  assert.equal(label("enterprise").props.role, "menuitem");
  assert.equal(label("enterprise").props["aria-label"], "Plan and billing: Enterprise");
});

test("managed account menu offers both billing destinations to every workspace role", () => {
  for (const workspaceRole of ["workspace_admin", "qa_manager", "tester", "reporter", "viewer"] as const) {
    const h = componentHarness(undefined, { document: { body: {}, addEventListener() {}, removeEventListener() {} } });
    const { ManagedProfileMenu: render } = h.load<{ ManagedProfileMenu: typeof ManagedProfileMenu }>(new URL("../../../auth/presentation/profile-menu/ManagedProfileMenu.tsx", import.meta.url), name => {
      if (name === "react-dom") return { createPortal: (value: unknown) => value };
      if (name.endsWith("useDesktopDownloadsAvailable")) return { useDesktopDownloadsAvailable: () => false };
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
    });
    const session = { kind: "managed" as const, label: "QA", subject: "u", workspaceId: "w", workspaceRole, signOut: async () => {} };
    const draw = () => nodes(h.render(() => render({ session })));
    const trigger = draw().find(node => node.props["aria-label"] === "Profile menu")!;
    (trigger.props.ref as { current: unknown }).current = { getBoundingClientRect: () => ({ right: 50, bottom: 100 }) };
    invoke(trigger, "onClick");
    const links = draw().filter(node => ["BillingLink", "BillingPlanLink"].includes(node.type));
    assert.equal(links.length, 2);
    for (const link of links) { assert.equal(link.props.role, "menuitem"); assert.equal(link.props.workspaceId, "w"); }
    invoke(links[0], "onClick"); assert.equal(draw().some(node => node.props.role === "menu"), false);
    assert.equal(session.workspaceRole, workspaceRole);
  }
});

test("billing screen receives explicit isolated preview mode and does not require a project", () => {
  for (const [subject, preview] of [["preview:mercury", true], ["u", false]] as const) {
    const h = componentHarness(undefined, { process: { env: { NODE_ENV: "development" } } });
    const { WorkspaceStage: render } = h.load<{ WorkspaceStage: typeof WorkspaceStage }>(new URL("../../../presentation/workspace-stage/WorkspaceStage.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ t: (key: string) => key }) };
      if (name.endsWith("useWorkspaceCapabilities")) return { useWorkspaceCapabilities: () => ({ value: { canConnect: true } }) };
      if (name.endsWith("TmsSessionContext")) return { useOptionalTmsSession: () => ({ subject }) };
      if (name.endsWith("company-features")) return { companyViewAvailable: () => true };
    });
    const config = nodes(h.render(() => render({ model: { view: "config", connection: "connected", project: undefined,
      data: { workspace: { id: "w" }, meta: { authorization: { capabilities: [] } } } } as never }))).find(node => node.type === "ConfigView")!;
    const feature = config.props.billing as { props: Record<string, unknown> };
    assert.equal(feature.props.workspaceId, "w"); assert.equal(feature.props.preview, preview);
  }
});
