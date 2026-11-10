import assert from "node:assert/strict";
import { test } from "node:test";
import type { NavigationProfile } from "../NavigationProfile";
import type { TmsSessionIdentity } from "../../../auth/presentation/session/TmsSessionContext";
import { memberRoleLabel } from "../../../company-administration/presentation/permissions/member-role-label";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";

function setup(session: Partial<TmsSessionIdentity> | null = {}, downloadsAvailable = true, locale: "en" | "ru" = "en") {
  let dismissed = 0, closed = 0, settings = 0, help = 0;
  const identity = session === null ? null : { label: "Mercury", kind: "cloud", subject: "u", workspaceId: "w", signOut: async () => {}, ...session };
  const h = componentHarness(undefined, { document: { body: {} } });
  const popup = { root: { current: null }, trigger: { current: null }, panel: { current: null }, open: true,
    position: { left: 64, top: 80 }, openHover() {}, leave() {}, cancelClose() {}, toggle() {},
    close() { closed++; }, dismiss() { dismissed++; }, triggerKeyDown() {}, panelKeyDown() {} };
  const { NavigationProfile: render } = h.load<{ NavigationProfile: typeof NavigationProfile }>(new URL("../NavigationProfile.tsx", import.meta.url), name => {
    if (name === "react-dom") return { createPortal: (value: unknown) => value };
    if (name.endsWith("TmsSessionContext")) return { useOptionalTmsSession: () => identity };
    if (name.endsWith("useRailPopup")) return { useRailPopup: () => popup };
    if (name.endsWith("useDesktopDownloadsAvailable")) return { useDesktopDownloadsAvailable: () => downloadsAvailable };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale, t: (key: string) => key }) };
    if (name.endsWith("member-role-label")) return { memberRoleLabel };
  });
  const props = { collapsed: true, workspaceId: "w", onOpenSettings() { settings++; }, onOpenHelp() { help++; } };
  const all = () => nodes(h.render(() => render(props)));
  return { all, popup, dismissed: () => dismissed, closed: () => closed, settings: () => settings, help: () => help };
}

test("account settings, help and sign out remain reachable without a profile route", () => {
  const h = setup();
  const all = h.all();
  const settings = all.find(node => node.props["data-testid"] === "nav-config");
  const help = all.find(node => node.props["data-testid"] === "nav-help-utility");
  assert.ok(settings); assert.ok(help);
  invoke(settings, "onClick"); invoke(help, "onClick");
  assert.equal(h.settings(), 1); assert.equal(h.help(), 1); assert.equal(h.dismissed(), 2);
  assert.ok(all.some(node => node.props["data-testid"] === "account-logout"));
});

test("every signed-in account can reach its profile without a legacy profile route", () => {
  for (const kind of ["cloud", "managed", "admin"] as const) {
    const h = setup({ kind });
    const link = h.all().find(node => node.type === "ProfileLink" && node.props.role === "menuitem");
    assert.ok(link, `${kind} profile remains available`);
    invoke(link, "onClick");
    assert.equal(h.dismissed(), 1);
  }
  assert.equal(setup(null).all().some(node => node.type === "ProfileLink"), false);
});

test("managed account preserves profile and administration destinations inside the popup", () => {
  const h = setup({ kind: "managed", profilePath: "/profile/", administrationPath: "/company/", workspaceRole: "qa_manager" });
  const all = h.all();
  assert.ok(all.some(node => node.type === "ProfileLink" && node.props.role === "menuitem"));
  assert.ok(all.some(node => node.type === "a" && node.props.href === "/company/" && node.props.role === "menuitem"));
  assert.ok(all.some(node => node.type === "span" && node.props.children === "QA manager"));
});

test("only the active workspace administrator can open billing from the avatar menu", () => {
  const h = setup({ workspaceRole: "workspace_admin" });
  const links = h.all().filter(node => node.type === "BillingLink" || node.type === "BillingPlanLink");
  assert.equal(links.length, 2);
  for (const link of links) {
    assert.equal(link.props.role, "menuitem");
    assert.equal(link.props.workspaceId, "w");
    invoke(link, "onClick");
  }
  assert.equal(h.dismissed(), 2);
  for (const identity of [null, { workspaceRole: null }, { workspaceId: "other", workspaceRole: "workspace_admin" }] as const) {
    assert.equal(setup(identity).all().some(node => node.type === "BillingLink" || node.type === "BillingPlanLink"), false);
  }
});

test("other workspace members see a localized role as plain text under their name", () => {
  for (const [workspaceRole, en, ru] of [
    ["qa_manager", "QA manager", "QA-менеджер"], ["tester", "Tester", "Тестировщик"],
    ["reporter", "Reporter", "Репортёр"], ["viewer", "Viewer", "Наблюдатель"],
  ] as const) {
    for (const [locale, label] of [["en", en], ["ru", ru]] as const) {
      const all = setup({ workspaceRole }, true, locale).all();
      const subtitle = all.find(node => node.type === "span" && node.props.children === label);
      assert.ok(subtitle, label);
      assert.equal(subtitle.props.role, undefined);
      assert.equal(subtitle.props.onClick, undefined);
      assert.equal(all.some(node => node.type === "BillingLink" || node.type === "BillingPlanLink"), false);
    }
  }
});

test("personal accounts replace role copy with the authoritative plan link", () => {
  const session = { kind: "cloud" as const, workspaceKind: "personal" as const, workspaceRole: "workspace_admin" as const };
  const all = setup(session).all();
  assert.ok(all.some(node => node.type === "BillingPlanLink"));
  assert.equal(all.some(node => node.props.children === "Workspace administrator"), false);
  assert.equal(session.workspaceRole, "workspace_admin");
});

test("unresolved and company accounts never infer a plan from their role", () => {
  const unresolved = setup({ kind: "cloud", workspaceRole: "workspace_admin" }).all();
  assert.ok(unresolved.some(node => node.type === "BillingPlanLink"));
  const company = setup({ kind: "cloud", workspaceKind: "company", workspaceRole: "workspace_admin" }).all();
  assert.ok(company.some(node => node.type === "BillingPlanLink"));
  assert.equal(company.some(node => node.props.children === "Workspace administrator"), false);
});

test("download app opens its own panel after closing the authenticated account menu", () => {
  const h = setup();
  const download = h.all().find(node => node.props["data-testid"] === "account-download-app");
  assert.ok(download);
  invoke(download, "onClick");
  assert.equal(h.closed(), 1);
  const panel = h.all().find(node => node.type === "DesktopDownloadsPanel");
  assert.equal(panel?.props.open, true);
  h.popup.open = false;
  assert.equal(h.all().find(node => node.type === "DesktopDownloadsPanel")?.props.open, true);
  invoke(panel!, "onClose");
  assert.equal(h.all().find(node => node.type === "DesktopDownloadsPanel")?.props.open, false);
});

test("an unauthenticated profile does not offer desktop downloads", () => {
  assert.equal(setup(null).all().some(node => node.props["data-testid"] === "account-download-app"), false);
});

test("desktop accounts omit the download entry and panel while retaining settings and sign out", () => {
  const all = setup({}, false).all();
  assert.equal(all.some(node => node.props["data-testid"] === "account-download-app"), false);
  assert.equal(all.some(node => node.type === "DesktopDownloadsPanel"), false);
  assert.ok(all.some(node => node.props["data-testid"] === "nav-config"));
  assert.ok(all.some(node => node.props["data-testid"] === "account-logout"));
});

test("logout prevents duplicate requests and reports a failure without dropping the menu", async () => {
  let reject!: (reason: Error) => void, calls = 0;
  const h = setup({ signOut: () => { calls++; return new Promise<void>((_, fail) => { reject = fail; }); } });
  const button = () => h.all().find(node => node.props["data-testid"] === "account-logout")!;
  invoke(button(), "onClick");
  assert.equal(button().props.disabled, true); assert.equal(calls, 1);
  reject(new Error("network")); await Promise.resolve(); await Promise.resolve();
  assert.equal(button().props.disabled, false);
  assert.ok(h.all().some(node => node.type === "ErrorToast" && node.props.message === "auth.logoutError"));
  assert.equal(h.dismissed(), 0);
});


test("opening support dismisses the account popup while its dialog composition stays mounted", () => {
  const h = setup();
  const support = h.all().find(node => node.type === "SupportContact")!;
  assert.equal(support.props.menuItem, true);
  const wrapper = h.all().find(node => node.props.className === "support")!;
  invoke(wrapper, "onClickCapture", { target: { closest: () => ({}) } });
  assert.equal(h.closed(), 1); assert.equal(h.dismissed(), 0);
  h.popup.open = false;
  assert.ok(h.all().some(node => node.type === "SupportContact"));
  assert.ok(h.all().some(node => node.props.role === "menu" && node.props.hidden === true));
});
