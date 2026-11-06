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
      const http = { async getResource(path: string) { return { data: path.startsWith("/billing/summary") ? { ...summary, ...policy, workspaceKind: managed ? "company" : "personal", planId: null, status: "unsubscribed" } : { ...account, ...policy, subscription: null, checkout, plans: [{ id: "startup", seats: 5, amount: 5900, currency: "USD", workspaceKind: "company" }] }, etag: null }; }, async get() { return { data: [], meta: { limit: 30 } }; } };
      let view!: ReactTestRenderer;
      try {
        await act(async () => { view = create(<TmsLocaleContext.Provider value={{ locale: "en", languageTag: "en-US", setLocale() {}, t: key => key }}><TmsSessionProvider value={{ kind: managed ? "managed" : "cloud", subject: "owner", workspaceId: "workspace", workspaceKind: managed ? "company" : "personal", workspaceRole: "workspace_admin", label: "QA", signOut: async () => undefined } as never}><TmsHttpClientProvider client={http as never}><ConnectedBillingFeature workspaceId="workspace" /></TmsHttpClientProvider></TmsSessionProvider></TmsLocaleContext.Provider>); });
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
