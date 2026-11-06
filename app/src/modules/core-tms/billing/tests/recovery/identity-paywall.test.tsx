import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../auth/presentation/session/TmsSessionContext";
import { TmsLocaleContext } from "../../../localization/context/TmsLocaleProvider";
import { storeIdentityCheckout } from "../../application/commands/reauthentication-checkout";
import { account, summary } from "../fixtures/billing-fixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const previousCss = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { ConnectedBillingFeature } = require("../../composition/ConnectedBillingFeature") as typeof import("../../composition/ConnectedBillingFeature");
const { StartupSetupScreen } = require("../../startup/presentation/StartupSetupScreen") as typeof import("../../startup/presentation/StartupSetupScreen");
const { BillingIdentityConfirmation } = require("../../startup/presentation/confirmation/BillingIdentityConfirmation") as typeof import("../../startup/presentation/confirmation/BillingIdentityConfirmation");
const { BillingConfirmation } = require("../../presentation/confirmation/BillingConfirmation") as typeof import("../../presentation/confirmation/BillingConfirmation");
const { BillingScreen } = require("../../presentation/screen/BillingScreen") as typeof import("../../presentation/screen/BillingScreen");
if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];

function ancestors(node: ReactTestInstance) { const parents = []; for (let parent = node.parent; parent; parent = parent.parent) parents.push(parent); return parents; }
test("personal and managed checkout recovery stays within the paywall action area, including an open checkout", async () => {
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) } });
  try {
    for (const managed of [false, true]) for (const open of [false, true]) {
      storage.clear();
      storeIdentityCheckout("owner", "workspace", { intent: { kind: "checkout", planId: "startup", startupSetupId: "saved-setup", startupSetupVersion: 4, confirmWorkspaceConversion: true }, options: { idempotencyKey: "saved-key" } });
      const checkout = open ? { id: "checkout", workspaceId: "workspace", planId: "startup", status: "open", provider: "mock", testMode: true, subtotal: 5900, currency: "USD", createdAt: "2026-11-06T00:00:00Z", expiresAt: "2027-11-06T00:00:00Z", periodEnd: null, prorated: false } : null;
      const policy = { suggestedPlanId: "startup", allowedCheckoutPlanIds: ["startup"], allowedChangePlanIds: [], teamAdministration: false, checkoutMode: "controlled_test", enabled: true };
      const http = { async getResource(path: string) { return { data: path.startsWith("/billing/summary") ? { ...summary, ...policy, workspaceKind: managed ? "company" : "personal", planId: null, status: "unsubscribed" } : { ...account, ...policy, subscription: null, checkout, plans: [{ id: "startup", seats: 5, amount: 5900, currency: "USD", workspaceKind: "company" }] }, etag: null }; }, async get() { return { data: [], meta: { limit: 30 } }; }, async mutateResource() { throw { code: "REAUTHENTICATION_REQUIRED", status: 401 }; } };
      let view!: ReactTestRenderer;
      try {
        await act(async () => { view = create(<TmsLocaleContext.Provider value={{ locale: "en", languageTag: "en-US", setLocale() {}, t: key => key }}><TmsSessionProvider value={{ kind: managed ? "managed" : "cloud", subject: "owner", workspaceId: "workspace", workspaceKind: managed ? "company" : "personal", workspaceRole: "workspace_admin", label: "QA", signOut: async () => undefined } as never}><TmsHttpClientProvider client={http as never}><ConnectedBillingFeature workspaceId="workspace" /></TmsHttpClientProvider></TmsSessionProvider></TmsLocaleContext.Provider>); });
        assert.equal(view.root.findAllByType(BillingIdentityConfirmation).length, 0, "a saved action alone must not claim the current sign-in expired");
        await act(async () => view.root.findAllByType("button").find(node => node.children.includes("Continue checkout"))!.props.onClick());
        const recovery = view.root.findByType(BillingIdentityConfirmation), parents = ancestors(recovery);
        assert.equal(parents.some(node => open ? node.props["aria-label"] === "Subscription confirmation" : node.type === "footer"), true, "identity recovery must replace the relevant checkout action, never precede the paywall");
        assert.equal(view.root.findAllByType(BillingIdentityConfirmation).length, 1);
        if (open) assert.equal(view.root.findAllByType(BillingConfirmation).length, 0, "identity confirmation owns the active confirmation stage until sign-in is refreshed");
        if (!open) assert.equal(view.root.findAllByProps({ "data-plan": "startup" }).length, 0, "do not show a competing disabled checkout action");
        assert.equal(recovery.findAllByType("form").length, managed ? 1 : 0);
      } finally { await act(async () => view?.unmount()); }
    }
  } finally { if (previousStorage) Object.defineProperty(globalThis, "sessionStorage", previousStorage); else Reflect.deleteProperty(globalThis, "sessionStorage"); }
});

test("appearing identity recovery receives stage focus without refocusing on ordinary rerenders", async () => {
  for (const open of [false, true]) {
    const focused: string[] = [];
    const noop = async () => undefined;
    const props: React.ComponentProps<typeof BillingScreen> = {
      summary, account, checkout: open ? { id: "checkout", workspaceId: "workspace", planId: "startup", status: "open", provider: "mock", testMode: true, subtotal: 5900, currency: "USD", createdAt: "2026-11-06T00:00:00Z", expiresAt: "2027-11-06T00:00:00Z", periodEnd: null, prorated: false } : null,
      invoices: [], loading: false, busy: false, error: null, invoicesError: null, canManage: true, canRetryCommand: false, hasMoreInvoices: false, loadingMoreInvoices: false, ru: false,
      reload() {}, loadMoreInvoices: noop, retryCommand: noop, startCheckout: noop, confirmCheckout: noop, changePlan: noop, cancel: noop, resume: noop, retryPayment: noop,
    };
    let view!: ReactTestRenderer;
    try {
      await act(async () => { view = create(<BillingScreen {...props} />, { createNodeMock: element => element.props.role === "group" ? { focus: () => focused.push(element.props["aria-label"]) } : null }); });
      focused.length = 0;
      await act(async () => { view.update(<BillingScreen {...props} identityConfirmation={<section>Sign in again</section>} />); });
      assert.deepEqual(focused, [open ? "Subscription confirmation" : "Falcon plans"], "the removed checkout button must hand keyboard focus to its visible recovery stage");
      await act(async () => { view.update(<BillingScreen {...props} identityConfirmation={<section>Sign in again</section>} />); });
      assert.equal(focused.length, 1, "a new recovery element must not steal focus on subsequent renders");
    } finally { await act(async () => view?.unmount()); }
  }
});

test("terminal company preparation recovers from saved start, saved confirmation, or an already-open wizard", async () => {
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key),
  } });
  try {
    for (const mode of ["saved-start", "saved-confirm", "open-wizard"]) {
      storage.clear();
      const saved = mode !== "open-wizard", confirming = mode === "saved-confirm";
      const writes: { path: string; body: Record<string, unknown>; key: string }[] = [];
      let reads = 0, expired = saved;
      const setup = { id: "saved-setup", version: 4, displayName: "Umbrella Host", slug: "umbrella-host", hostname: "umbrella-host-falcon.saturnusgo.com", status: "ready", expiresAt: "2027-11-06T12:30:00Z" };
      const policy = { suggestedPlanId: "startup", allowedCheckoutPlanIds: ["startup"], allowedChangePlanIds: [], teamAdministration: false, checkoutMode: "controlled_test", enabled: true };
      const checkout = confirming ? { id: "stale-checkout", workspaceId: "workspace", planId: "startup", status: "open", provider: "mock", testMode: true, subtotal: 5900, currency: "USD", createdAt: "2026-11-06T00:00:00Z", expiresAt: "2027-11-06T00:00:00Z", periodEnd: null, prorated: false } : null;
      if (saved) storeIdentityCheckout("owner", "workspace", { intent: confirming ? { kind: "confirm", checkoutId: "stale-checkout", outcome: "success" } : { kind: "checkout", planId: "startup", startupSetupId: setup.id, startupSetupVersion: 4, confirmWorkspaceConversion: true }, options: { idempotencyKey: "saved-key" } });
      const http = {
        async getResource(path: string) {
          if (path.startsWith("/billing/summary")) return { data: { ...summary, ...policy, workspaceKind: "personal", planId: null, status: "unsubscribed" }, etag: null };
          if (path.startsWith("/billing/startup-setup")) { reads++; return { data: { setup: { ...setup, status: expired ? "expired" : "ready" } }, etag: null }; }
          return { data: { ...account, ...policy, subscription: null, checkout, plans: [{ id: "startup", seats: 5, amount: 5900, currency: "USD", workspaceKind: "company" }], checkoutQuotes: [{ planId: "startup", subtotal: 5900, currency: "USD", periodEnd: "2027-12-06T00:00:00Z", prorated: false }] }, etag: null };
        },
        async get() { return { data: [], meta: { limit: 30 } }; },
        async mutateResource(path: string, _method: string, body: Record<string, unknown>, options: { idempotencyKey: string }) {
          writes.push({ path, body, key: options.idempotencyKey });
          if (path === "/billing/checkout" || path === "/billing/confirm") { expired = true; throw { code: "BILLING_STARTUP_SETUP_REQUIRED", status: 409 }; }
          assert.equal(path, "/billing/startup-setup"); expired = false;
          return { data: { setup: { ...setup, version: 5 } } };
        },
      };
      let view!: ReactTestRenderer;
      try {
        await act(async () => { view = create(<TmsLocaleContext.Provider value={{ locale: "en", languageTag: "en-US", setLocale() {}, t: key => key }}><TmsSessionProvider value={{ kind: "cloud", subject: "owner", workspaceId: "workspace", workspaceKind: "personal", workspaceRole: "workspace_admin", label: "QA", signOut: async () => undefined }}><TmsHttpClientProvider client={http as never}><ConnectedBillingFeature workspaceId="workspace" /></TmsHttpClientProvider></TmsSessionProvider></TmsLocaleContext.Provider>); });
        assert.equal(writes.length, 0, "restoring an action must never automatically charge");
        if (saved) {
          await act(async () => view.root.findAllByType("button").find(node => node.children.includes("Continue checkout"))!.props.onClick());
          assert.equal(writes[0].key, "saved-key", "the explicit retry must keep its original idempotency key");
        } else {
          await act(async () => view.root.findByProps({ "data-plan": "startup" }).props.onClick());
          await act(async () => view.root.findByProps({ "data-wizard-next": "name" }).props.onClick());
          await act(async () => view.root.findByProps({ "data-wizard-next": "address" }).props.onClick());
          await act(async () => view.root.findByProps({ id: "startup-consent" }).props.onChange({ target: { checked: true } }));
          await act(async () => view.root.findByProps({ "data-wizard-checkout": true }).props.onClick());
        }
        const oldWizard = view.root.findAllByType(StartupSetupScreen)[0];
        const readsBefore = reads;
        await act(async () => view.root.findAllByType("button").find(node => node.children.includes("Prepare company again"))!.props.onClick());
        const wizard = view.root.findByType(StartupSetupScreen);
        if (oldWizard) assert.notEqual(wizard, oldWizard, "restart must discard stale step and consent state");
        assert.ok(reads > readsBefore, "restart reads current server preparation");
        assert.equal(view.root.findByProps({ id: "startup-name" }).props.disabled, false);
        assert.equal(view.root.findAllByType("button").some(node => node.children.includes("Prepare company again")), false);
        assert.equal(writes.length, 1, "opening preparation must not retry checkout or start a new payment");
        await act(async () => view.root.findByProps({ "data-wizard-next": "name" }).props.onClick());
        await act(async () => view.root.findByProps({ "data-wizard-next": "address" }).props.onClick());
        assert.equal(writes[1].path, "/billing/startup-setup");
        assert.equal(writes[1].body.expectedVersion, 4);
        assert.equal(view.root.findByProps({ id: "startup-consent" }).props.checked, false, "new preparation requires new explicit consent");
        assert.equal(view.root.findByProps({ "data-wizard-checkout": true }).props.disabled, true);
        assert.equal(writes.filter(write => write.path === "/billing/checkout" || write.path === "/billing/confirm").length, 1);
      } finally { await act(async () => view?.unmount()); }
    }
  } finally { if (previousStorage) Object.defineProperty(globalThis, "sessionStorage", previousStorage); else Reflect.deleteProperty(globalThis, "sessionStorage"); }
});
