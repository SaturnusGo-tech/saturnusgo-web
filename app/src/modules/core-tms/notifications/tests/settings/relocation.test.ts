import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, nodes } from "../../../portfolios/tests/support/component-harness";
import type { ConfigView } from "../../../presentation/config/ConfigView";
import type { WorkspaceStage } from "../../../presentation/workspace-stage/WorkspaceStage";
import type { NotificationPage } from "../../presentation/NotificationPage";
import { settingsCopy, settingsSections } from "../../../presentation/config/navigation/settings-sections";

for (const selected of ["appearance", "notifications"] as const) test(`personal notifications render only while selected (${selected}), without requiring a project`, () => {
  const h = componentHarness();
  const { ConfigView: render } = h.load<{ ConfigView: typeof ConfigView }>(new URL("../../../presentation/config/ConfigView.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("settings-sections")) return { settingsCopy, settingsSections };
    if (name.endsWith("useSettingsSection")) return { useSettingsSection: () => ({ section: selected, select() {} }) };
  });
  const notification = { type: "PersonalNotifications", props: {} };
  const all = nodes(h.render(() => render({ environments: [], notifications: notification } as never)));
  assert.ok(all.some(node => node.type === "button" && Array.isArray(node.props.children) && node.props.children.includes("Notifications")));
  assert.equal(all.some(node => node.type === "PersonalNotifications"), selected === "notifications");
  assert.equal(all.some(node => node.type === "EnvironmentSettings"), false);
});

test("settings remain reachable while project data is unavailable", () => {
  const h = componentHarness();
  const { WorkspaceStage: render } = h.load<{ WorkspaceStage: typeof WorkspaceStage }>(new URL("../../../presentation/workspace-stage/WorkspaceStage.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ t: (key: string) => key }) };
    if (name.endsWith("TmsSessionContext")) return { useOptionalTmsSession: () => null };
    if (name.endsWith("company-features")) return { companyViewAvailable: () => true };
  });
  for (const view of ["config", "notifications"] as const) {
    const all = nodes(h.render(() => render({ model: { view, connection: "loading", project: undefined, data: { workspace: { id: "w" } } } as never })));
    assert.ok(all.some(node => node.type === "ConfigView")); assert.equal(all.some(node => node.type === "ProjectOnboarding"), false);
  }
});

test("embedded notifications contain channel controls and preferences, without another header or activity feed", () => {
  const h = componentHarness();
  const { NotificationPage: render } = h.load<{ NotificationPage: typeof NotificationPage }>(new URL("../../presentation/NotificationPage.tsx", import.meta.url));
  const all = nodes(h.render(() => render({ embedded: true, ru: false, model: { loading: false, settings: { categories: ["runs"] } } as never })));
  assert.ok(all.some(node => node.type === "NotificationChannels"));
  assert.ok(all.some(node => node.props.children === "Event preferences"));
  assert.equal(all.some(node => node.type === "h1" || node.props.children === "Recent activity"), false);
});
