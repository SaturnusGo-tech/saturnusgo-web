import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsHttpClientProvider } from "../../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../../auth/presentation/session/TmsSessionContext";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { BillingCheckout, BillingMutation, BillingSummary } from "../../../domain/billing";
import { account, deferred, subscription, summary } from "../../../tests/fixtures/billing-fixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const previousCss = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { ConnectedBillingFeature } = require("../../../composition/ConnectedBillingFeature") as typeof import("../../../composition/ConnectedBillingFeature");
const { StartupSetupScreen } = require("../../presentation/StartupSetupScreen") as typeof import("../../presentation/StartupSetupScreen");
if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];

function fixture(enabled = true, failActivationSummaryOnce = false) {
  let completed = false, checkout: BillingCheckout | null = null, targetReads = 0;
  const refreshedSummary = deferred<BillingSummary>();
  const writes: { path: string; input: unknown }[] = [];
  const personalSummary: BillingSummary = { ...summary, workspaceKind: "personal", status: "unsubscribed", planId: null,
    teamAdministration: false, suggestedPlanId: "startup", allowedCheckoutPlanIds: ["startup"], checkoutMode: "local_test", enabled };
  const companySummary: BillingSummary = { ...summary, checkoutMode: "local_test", enabled };
  const plan = { id: "startup", seats: 5, amount: 5900, currency: "USD", workspaceKind: "company" };
  const quote = { planId: "startup", subtotal: 5900, currency: "USD", periodEnd: "2027-12-06T00:00:00Z", prorated: false };
  const http = {
    async getResource(path: string) {
      if (path.startsWith("/billing/summary")) {
        if (completed && failActivationSummaryOnce) { failActivationSummaryOnce = false; throw new TypeError("Summary refresh interrupted"); }
        return { data: completed ? await refreshedSummary.promise : personalSummary, etag: null };
      }
      if (path.startsWith("/billing/startup-setup")) return { data: { setup: { id: "saved-setup", version: 4, displayName: "Team", slug: "team",
        hostname: "team-falcon.saturnusgo.com", status: "ready", expiresAt: "2027-11-06T12:30:00Z" } }, etag: null };
      if (path.startsWith("/auth/workspace-target")) { targetReads++; return { data: { workspaceId: "workspace", generation: 1, destinationOrigin: "https://tms.saturnusgo.com" }, etag: null }; }
      return { data: { ...account, plans: [plan], subscription: completed ? subscription : null, checkout: completed ? null : checkout,
        checkoutQuotes: [quote], suggestedPlanId: "startup", allowedCheckoutPlanIds: completed ? [] : ["startup"],
        teamAdministration: completed, checkoutMode: "local_test", enabled }, etag: null };
    },
    async get() { return { data: [], meta: { limit: 30 } }; },
    async mutateResource(path: string, _method: string, input: unknown) {
      writes.push({ path, input });
      checkout = { id: "test-checkout", workspaceId: "workspace", ...quote, planId: "startup", currency: "USD", provider: "mock", testMode: true,
        status: path === "/billing/confirm" ? "completed" : "open", createdAt: "2026-11-06T12:00:00Z", expiresAt: "2027-11-06T12:30:00Z" };
      completed = checkout.status === "completed";
      return { data: { subscription: completed ? subscription : null, checkout, invoice: null, provider: "mock", testMode: true,
        checkoutMode: "local_test" } satisfies BillingMutation };
    },
  } as unknown as TmsHttpClient;
  const tree = <TmsLocaleContext.Provider value={{ locale: "en", languageTag: "en-US", setLocale() {}, t: key => key }}>
    <TmsSessionProvider value={{ kind: "cloud", subject: "cloud:owner", workspaceId: "workspace", workspaceKind: "personal", workspaceRole: "workspace_admin", label: "QA", signOut: async () => undefined }}>
      <TmsHttpClientProvider client={http}><ConnectedBillingFeature workspaceId="workspace" /></TmsHttpClientProvider>
    </TmsSessionProvider>
  </TmsLocaleContext.Provider>;
  return { tree, writes, targetReads: () => targetReads, activate: () => refreshedSummary.resolve(companySummary) };
}

test("local-test Startup retains explicit mock confirmation and Continue before company administration", async () => {
  const environment = process.env.NODE_ENV;
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const destinations: string[] = [];
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    location: { href: "https://tms.saturnusgo.com/testcases/umbrella-home/work/?workspaceId=workspace&projectId=project&lang=en", assign: (href: string) => destinations.push(href) },
    addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
  } });
  Reflect.set(process.env, "NODE_ENV", "development");
  const h = fixture(); let view!: ReactTestRenderer;
  try {
    await act(async () => { view = create(h.tree); });
    await act(async () => view.root.findByProps({ "data-plan": "startup" }).props.onClick());
    const wizard = view.root.findByType(StartupSetupScreen);
    await act(async () => wizard.props.onContinue?.());
    assert.deepEqual(destinations, []);
    await act(async () => view.root.findByProps({ "data-wizard-next": "name" }).props.onClick());
    await act(async () => view.root.findByProps({ "data-wizard-next": "address" }).props.onClick());
    assert.equal(view.root.findByProps({ "data-wizard-checkout": true }).props.disabled, true);
    await act(async () => view.root.findByProps({ id: "startup-consent" }).props.onChange({ target: { checked: true } }));
    await act(async () => view.root.findByProps({ "data-wizard-checkout": true }).props.onClick());
    assert.equal(view.root.findAllByType(StartupSetupScreen).length, 1, "opening checkout must retain the wizard");
    assert.equal(view.root.findByType(StartupSetupScreen), wizard, "step state must survive the checkout response");
    assert.equal(wizard.props.checkout?.status, "open");
    assert.deepEqual(h.writes[0], { path: "/billing/checkout", input: { workspaceId: "workspace", planId: "startup", startupSetupId: "saved-setup", startupSetupVersion: 4, confirmWorkspaceConversion: true } });
    assert.equal(view.root.findAllByProps({ name: "billing-outcome" }).length, 2);
    await act(async () => view.root.findAllByType("button").find(node => node.children.includes("Confirm"))!.props.onClick());
    assert.equal(wizard.props.activationPending, true);
    assert.equal(wizard.props.activated, false);
    await act(async () => wizard.props.onContinue());
    assert.deepEqual(destinations, []);
    await act(async () => h.activate());
    assert.equal(view.root.findByType(StartupSetupScreen), wizard, "company summary must retain the success step");
    assert.equal(wizard.props.activated, true);
    assert.equal(wizard.props.activationPending, false);
    assert.equal(h.targetReads(), 0, "activation must not trigger an automatic domain handoff inside the wizard");
    assert.deepEqual(destinations, []);
    await act(async () => wizard.props.onContinue());
    assert.equal(h.targetReads(), 1, "success Continue must discover the server target before company administration");
    assert.deepEqual(destinations, ["/admin/?account=personal&workspaceId=workspace&lang=en&projectId=project&page=company"]);
  } finally {
    await act(async () => view?.unmount());
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow); else Reflect.deleteProperty(globalThis, "window");
    if (environment === undefined) Reflect.deleteProperty(process.env, "NODE_ENV"); else Reflect.set(process.env, "NODE_ENV", environment);
  }
});

test("Startup wizard callbacks cannot bypass a disabled production capability", async () => {
  const environment = process.env.NODE_ENV; Reflect.set(process.env, "NODE_ENV", "production");
  const h = fixture(false); let view!: ReactTestRenderer;
  try {
    await act(async () => { view = create(h.tree); });
    await act(async () => view.root.findByProps({ "data-plan": "startup" }).props.onClick());
    const wizard = view.root.findByType(StartupSetupScreen);
    await act(async () => { await wizard.props.onCheckout(); await wizard.props.onConfirmCheckout?.("success"); });
    assert.deepEqual(h.writes, []);
  } finally {
    await act(async () => view?.unmount());
    if (environment === undefined) Reflect.deleteProperty(process.env, "NODE_ENV"); else Reflect.set(process.env, "NODE_ENV", environment);
  }
});

test("Startup success recovers after a temporary summary failure without authorizing navigation during the failure", async () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const destinations: string[] = [];
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    location: { href: "https://tms.saturnusgo.com/testcases/umbrella-home/work/?workspaceId=workspace&projectId=project&lang=en", assign: (href: string) => destinations.push(href) },
    addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
  } });
  const h = fixture(true, true); let view!: ReactTestRenderer;
  try {
    await act(async () => { view = create(h.tree); });
    await act(async () => view.root.findByProps({ "data-plan": "startup" }).props.onClick());
    const wizard = view.root.findByType(StartupSetupScreen);
    await act(async () => view.root.findByProps({ "data-wizard-next": "name" }).props.onClick());
    await act(async () => view.root.findByProps({ "data-wizard-next": "address" }).props.onClick());
    await act(async () => view.root.findByProps({ id: "startup-consent" }).props.onChange({ target: { checked: true } }));
    await act(async () => view.root.findByProps({ "data-wizard-checkout": true }).props.onClick());
    await act(async () => wizard.props.onConfirmCheckout("success"));
    assert.equal(wizard.props.activated, false);
    assert.equal(wizard.props.activationPending, true, "receipt metadata must keep the wizard in activation recovery");
    const writesBeforeRetry = h.writes.length;
    await act(async () => { await wizard.props.onContinue(); await wizard.props.onCheckout(); await wizard.props.onConfirmCheckout("success"); });
    assert.deepEqual(destinations, []);
    assert.equal(h.writes.length, writesBeforeRetry, "missing current authorization must block further commands");
    await act(async () => { h.activate(); wizard.props.onRefreshBilling(); });
    assert.equal(wizard.props.activated, true, "the completed receipt must survive temporary capability unavailability");
    assert.equal(wizard.props.checkout?.status, "completed");
    await act(async () => wizard.props.onContinue());
    assert.deepEqual(destinations, ["/admin/?account=personal&workspaceId=workspace&lang=en&projectId=project&page=company"]);
  } finally {
    await act(async () => view?.unmount());
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow); else Reflect.deleteProperty(globalThis, "window");
  }
});
