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
if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];
const ready = { id: "ready-setup", version: 4, displayName: "Team", slug: "team", hostname: "team-falcon.saturnusgo.com", status: "ready", expiresAt: "2027-11-06T12:30:00Z" };
const plan = { id: "startup", seats: 5, amount: 5900, currency: "USD", workspaceKind: "company" };
const quote = { planId: "startup", subtotal: 5900, currency: "USD", periodEnd: "2027-12-06T00:00:00Z", prorated: false };
function fixture(locale: "ru" | "en", mode = "controlled_test", accountMode = mode, enabled = true) {
  const writes: { path: string; input: unknown }[] = [];
  const http = { async getResource(path: string) {
    if (path.startsWith("/billing/summary")) return { data: { workspaceKind: "personal", canManage: true, status: "trial", planId: null, checkoutMode: mode, enabled }, etag: null };
    if (path.startsWith("/billing/startup-setup")) return { data: { setup: ready }, etag: null };
    return { data: { plans: [plan], subscription: null, checkout: null, occupiedSeats: 1, checkoutQuotes: [quote], suggestedPlanId: "startup",
      allowedCheckoutPlanIds: ["startup"], allowedChangePlanIds: [], provider: "mock", testMode: true, checkoutMode: accountMode, enabled }, etag: null };
  }, async get() { return { data: [], meta: { limit: 30 } }; }, async mutateResource(path: string, _method: string, input: unknown) {
    writes.push({ path, input });
    return { data: { subscription: null, checkout: { id: "test-checkout", workspaceId: "space", ...quote, provider: "mock", testMode: true,
      status: "open", createdAt: "2026-11-06T12:00:00Z", expiresAt: "2027-11-06T12:30:00Z" }, invoice: null, provider: "mock", testMode: true, checkoutMode: accountMode } };
  } } as unknown as TmsHttpClient;
  const tree = <TmsLocaleContext.Provider value={{ locale, languageTag: locale === "ru" ? "ru-RU" : "en-US", setLocale() {}, t: key => key }}>
    <TmsSessionProvider value={{ kind: "cloud", subject: "cloud:owner", workspaceId: "space", workspaceKind: "personal", workspaceRole: "workspace_admin", label: "QA", signOut: async () => undefined }}>
      <TmsHttpClientProvider client={http}><BillingFeature workspaceId="space" /></TmsHttpClientProvider>
    </TmsSessionProvider>
  </TmsLocaleContext.Provider>;
  return { tree, writes };
}
async function setup(view: ReactTestRenderer, locale: "ru" | "en") {
  await act(async () => view.root.findByProps({ "data-plan": "startup" }).props.onClick());
  await act(async () => view.root.findByProps({ "data-wizard-next": "name" }).props.onClick());
  await act(async () => view.root.findByProps({ "data-wizard-next": "address" }).props.onClick());
  assert.equal(view.root.findByProps({ "data-wizard-checkout": true }).props.disabled, true);
  await act(async () => view.root.findByProps({ id: "startup-consent" }).props.onChange({ target: { checked: true } }));
  const checkout = view.root.findByProps({ "data-wizard-checkout": true });
  assert.ok(checkout.children.includes(locale === "ru" ? "Перейти к оплате" : "Continue to checkout"));
  return checkout;
}
for (const locale of ["en", "ru"] as const) test(`production ${locale} controlled checkout uses the saved Startup setup and discloses no charge`, async () => {
  const environment = process.env.NODE_ENV; Reflect.set(process.env, "NODE_ENV", "production");
  const h = fixture(locale); let view!: ReactTestRenderer;
  try {
    await act(async () => { view = create(h.tree); });
    assert.equal(view.root.findAllByProps({ "data-view-plan": "individual" }).length, 0);
    assert.equal(view.root.findAllByType("button").some(node => node.children.includes(locale === "ru" ? "Другие тарифы" : "Other plans")), false);
    const checkout = await setup(view, locale);
    const label = locale === "ru" ? "Тестовый режим · без списаний" : "Test mode · no charge";
    assert.ok(view.root.findAllByType("p").some(node => node.children.includes(label)));
    assert.equal(checkout.props.disabled, false);
    await act(async () => checkout.props.onClick());
    assert.equal(h.writes.length, 1); assert.equal(h.writes[0].path, "/billing/checkout");
    assert.deepEqual(h.writes[0].input, { workspaceId: "space", planId: "startup", startupSetupId: "ready-setup", startupSetupVersion: 4, confirmWorkspaceConversion: true });
    assert.ok(view.root.findAllByType("p").some(node => node.children.includes(label)));
    assert.equal(view.root.findAllByProps({ name: "billing-outcome" }).length, 2);
    assert.equal(view.root.findAllByType("button").find(node => node.children.includes(locale === "ru" ? "Подтвердить" : "Confirm"))!.props.disabled, false);
  } finally { await act(async () => view?.unmount()); if (environment === undefined) Reflect.deleteProperty(process.env, "NODE_ENV"); else Reflect.set(process.env, "NODE_ENV", environment); }
});
for (const [mode, accountMode, enabled] of [["disabled", "disabled", false], ["local_test", "local_test", true], ["disabled", "controlled_test", false], ["controlled_test", "controlled_test", false], ["controlled_test", "disabled", true]] as const) {
  test(`production cannot activate checkout from ${mode}/${accountMode}, enabled=${enabled}`, async () => {
    const environment = process.env.NODE_ENV; Reflect.set(process.env, "NODE_ENV", "production");
    const h = fixture("en", mode, accountMode, enabled); let view!: ReactTestRenderer;
    try {
      await act(async () => { view = create(h.tree); });
      const checkout = await setup(view, "en"); assert.equal(checkout.props.disabled, true);
      await act(async () => checkout.props.onClick()); assert.equal(h.writes.length, 0);
    } finally { await act(async () => view?.unmount()); if (environment === undefined) Reflect.deleteProperty(process.env, "NODE_ENV"); else Reflect.set(process.env, "NODE_ENV", environment); }
  });
}
test("development mock rows without a server capability cannot enable checkout", async () => {
  const environment = process.env.NODE_ENV; Reflect.set(process.env, "NODE_ENV", "development");
  const h = fixture("en", "", "", true); let view!: ReactTestRenderer;
  try {
    await act(async () => { view = create(h.tree); });
    const checkout = await setup(view, "en"); assert.equal(checkout.props.disabled, true);
    await act(async () => checkout.props.onClick()); assert.equal(h.writes.length, 0);
  } finally { await act(async () => view?.unmount()); if (environment === undefined) Reflect.deleteProperty(process.env, "NODE_ENV"); else Reflect.set(process.env, "NODE_ENV", environment); }
});
