import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../auth/presentation/session/TmsSessionContext";
import { TmsLocaleContext } from "../../../localization/context/TmsLocaleProvider";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const previousCss = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { BillingFeature } = require("../../composition/BillingFeature") as typeof import("../../composition/BillingFeature");
const { BillingPlanLink } = require("../../composition/menu/BillingPlanLink") as typeof import("../../composition/menu/BillingPlanLink");
const { CompanyAdministrationLink } = require("../../../company-administration/composition/menu/CompanyAdministrationLink") as typeof import("../../../company-administration/composition/menu/CompanyAdministrationLink");
if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];

function providers(locale: "ru" | "en", http: TmsHttpClient, child: React.ReactNode, administrationPath?: string) {
  return <TmsLocaleContext.Provider value={{ locale, languageTag: locale === "ru" ? "ru-RU" : "en-US", setLocale() {}, t: key => key }}>
    <TmsSessionProvider value={{ kind: "cloud", subject: "cloud:owner", workspaceId: "space", workspaceKind: "personal", workspaceRole: "workspace_admin", label: "QA owner", administrationPath, signOut: async () => undefined }}>
      <TmsHttpClientProvider client={http}>{child}</TmsHttpClientProvider>
    </TmsSessionProvider>
  </TmsLocaleContext.Provider>;
}
for (const locale of ["en", "ru"] as const) test(`production ${locale} setup is usable while payment remains disabled`, async () => {
  const environment = process.env.NODE_ENV; Reflect.set(process.env, "NODE_ENV", "production");
  const calls: string[] = []; let mutations = 0, view!: ReactTestRenderer;
  const draft = { id: "setup", version: 1, displayName: "Team", slug: "team", hostname: "team-falcon.saturnusgo.com", status: "ready", expiresAt: "2027-11-06T12:30:00Z" };
  const http = { async getResource(path: string) { calls.push(path);
    if (path.startsWith("/billing/summary")) return { data: { workspaceKind: "personal", canManage: true, status: "trial", planId: null }, etag: null };
    if (path.startsWith("/billing/startup-setup")) return { data: { setup: draft }, etag: null };
    return { data: { plans: [{ id: "startup", seats: 5, amount: 5900, currency: "USD" }], subscription: null, checkout: null, occupiedSeats: 1,
      checkoutQuotes: [{ planId: "startup", subtotal: 5900, currency: "USD", periodEnd: "2026-12-06T00:00:00Z", prorated: false }], suggestedPlanId: "startup", allowedCheckoutPlanIds: ["startup"], allowedChangePlanIds: [], provider: "mock", testMode: true }, etag: null };
  }, async get() { return { data: [], meta: { limit: 30 } }; }, async mutateResource() { mutations++; throw new Error("Payment must remain disabled"); } } as unknown as TmsHttpClient;
  try {
    await act(async () => { view = create(providers(locale, http, <BillingFeature workspaceId="space" />)); });
    const action = view.root.findByProps({ "data-plan": "startup" }); assert.equal(action.props.disabled, false);
    await act(async () => action.props.onClick());
    assert.ok(calls.includes("/billing/startup-setup?workspaceId=space"));
    assert.equal(view.root.findByProps({ id: "startup-name" }).props.required, true);
    await act(async () => view.root.findByProps({ "data-wizard-next": "name" }).props.onClick());
    assert.equal(view.root.findByProps({ id: "startup-slug" }).props.required, true);
    await act(async () => view.root.findByProps({ "data-wizard-next": "address" }).props.onClick());
    await act(async () => view.root.findByProps({ id: "startup-consent" }).props.onChange({ target: { checked: true } }));
    const checkout = view.root.findByProps({ "data-wizard-checkout": true });
    assert.equal(checkout.props.disabled, true);
    await act(async () => checkout.props.onClick()); assert.equal(mutations, 0);
  } finally { await act(async () => view?.unmount()); if (environment === undefined) Reflect.deleteProperty(process.env, "NODE_ENV"); else Reflect.set(process.env, "NODE_ENV", environment); }
});
test("the disabled release account link stays neutral and makes no summary request", async () => {
  let requests = 0, view!: ReactTestRenderer;
  const fail = async () => { requests++; throw new Error("No summary requests before launch"); };
  const http = { get: fail, getResource: fail, mutate: fail, mutateResource: fail } as TmsHttpClient;
  for (const locale of ["en", "ru"] as const) {
    try {
      await act(async () => { view = create(providers(locale, http, <BillingPlanLink role="menuitem" workspaceId="space" enabled />)); });
      const link = view.root.findByType("a");
      assert.deepEqual(link.children, [locale === "ru" ? "Посмотреть тарифы" : "View plans"]);
      assert.equal(link.props.role, "menuitem"); assert.match(link.props.href, /workspaceId=space/);
      assert.equal(requests, 0);
    } finally { await act(async () => view?.unmount()); }
  }
});
test("administration uses server capabilities even while production payments are disabled", async () => {
  let reads = 0, view!: ReactTestRenderer;
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { location: new URL("https://falcon.test/work/?workspaceId=space&lang=ru"), addEventListener() {}, removeEventListener() {} } });
  let allowed = false;
  const http = { async getResource() { reads++; return { data: { workspaceId: "space", teamAdministrationAvailable: allowed }, etag: null }; } } as unknown as TmsHttpClient;
  try {
    await act(async () => { view = create(providers("en", http, <CompanyAdministrationLink workspaceId="space">Company administration</CompanyAdministrationLink>)); });
    assert.equal(view.root.findAllByType("a").length, 0); assert.equal(reads, 1);
    await act(async () => view.unmount()); allowed = true;
    await act(async () => { view = create(providers("en", http, <CompanyAdministrationLink workspaceId="space">Company administration</CompanyAdministrationLink>)); });
    assert.match(view.root.findByType("a").props.href, /account=personal&workspaceId=space/);
  } finally { await act(async () => view?.unmount()); if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow); else Reflect.deleteProperty(globalThis, "window"); }
});

test("development can exercise a server-authorized mock checkout", async () => {
  const environment = process.env.NODE_ENV; Reflect.set(process.env, "NODE_ENV", "development");
  let writes = 0, view!: ReactTestRenderer;
  const http = { async getResource(path: string) {
    if (path.startsWith("/billing/summary")) return { data: { workspaceKind: "personal", canManage: true, status: "trial", enabled: true, checkoutMode: "local_test" }, etag: null };
    return { data: { plans: [{ id: "individual", seats: 1, amount: 1100, currency: "USD" }], subscription: null, checkout: null, occupiedSeats: 1,
      checkoutQuotes: [], suggestedPlanId: "individual", allowedCheckoutPlanIds: ["individual"], allowedChangePlanIds: [], provider: "mock", testMode: true, enabled: true, checkoutMode: "local_test" }, etag: null };
  }, async get() { return { data: [], meta: { limit: 30 } }; }, async mutateResource(path: string) { assert.equal(path, "/billing/checkout"); writes++; return { data: { subscription: null, checkout: null, invoice: null, provider: "mock", testMode: true } }; } } as unknown as TmsHttpClient;
  try {
    await act(async () => { view = create(providers("en", http, <BillingFeature workspaceId="space" />)); });
    const action = view.root.findByProps({ "data-plan": "individual" }); assert.equal(action.props.disabled, false);
    await act(async () => action.props.onClick()); assert.equal(writes, 1);
  } finally { await act(async () => view?.unmount()); if (environment === undefined) Reflect.deleteProperty(process.env, "NODE_ENV"); else Reflect.set(process.env, "NODE_ENV", environment); }
});
