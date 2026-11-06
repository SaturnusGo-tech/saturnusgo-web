import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsHttpClientProvider } from "../../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../../auth/presentation/session/TmsSessionContext";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import { restoreIdentityCheckout, storeIdentityCheckout } from "../../../application/commands/reauthentication-checkout";
import { account, deferred, summary, subscription } from "../../../tests/fixtures/billing-fixtures";
import { takeContinuation } from "../../../../auth/continuation/application/continuation-storage";
import type { BillingCheckout, BillingIntent } from "../../../domain/billing";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const previousCss = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { ConnectedBillingFeature } = require("../../../composition/ConnectedBillingFeature") as typeof import("../../../composition/ConnectedBillingFeature");
const { BillingIdentityConfirmation } = require("../../presentation/confirmation/BillingIdentityConfirmation") as typeof import("../../presentation/confirmation/BillingIdentityConfirmation");
if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];

const setup = { id: "saved-setup", version: 4, displayName: "Mercury AI", slug: "mercury-ai", hostname: "mercury-ai-falcon.saturnusgo.com", status: "ready", expiresAt: "2027-11-06T12:30:00Z" };
const checkout: BillingCheckout = { id: "saved-checkout", workspaceId: "workspace", planId: "startup", status: "open", provider: "mock", testMode: true,
  subtotal: 5900, currency: "USD", createdAt: "2026-11-06T00:00:00Z", expiresAt: "2027-11-06T00:00:00Z", periodEnd: null, prorated: false };
const start = { kind: "checkout", planId: "startup", startupSetupId: setup.id, startupSetupVersion: 4, confirmWorkspaceConversion: true } as const;
function fixture({ active = false, pending = null, open = false, ready = true, wrongWorkspace = false, checkoutAllowed = true }: { active?: boolean; pending?: BillingIntent | null; open?: boolean; ready?: boolean; wrongWorkspace?: boolean; checkoutAllowed?: boolean } = {}) {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window"), previousStorage = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  const storage = new Map<string, string>();
  const browserStorage = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) };
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: browserStorage });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { sessionStorage: browserStorage,
    location: { href: "https://tms.saturnusgo.com/testcases/umbrella-home/work/?workspaceId=workspace&view=config&settings=billing&lang=ru", origin: "https://tms.saturnusgo.com", pathname: "/testcases/umbrella-home/work/", search: "?workspaceId=workspace&view=config&settings=billing&lang=ru", hash: "" },
    addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
  } });
  if (pending) storeIdentityCheckout("cloud:owner", "workspace", { intent: pending, options: { idempotencyKey: "original-key" } });
  const writes: { path: string; body: unknown; key: string }[] = []; let targets = 0, setupReads = 0;
  const policy = { suggestedPlanId: "startup", allowedCheckoutPlanIds: checkoutAllowed ? ["startup"] : [], allowedChangePlanIds: [], teamAdministration: false, checkoutMode: "controlled_test", enabled: true };
  const http = {
    async getResource(path: string) {
      if (path.startsWith("/billing/summary")) return { data: active ? { ...summary, checkoutMode: "controlled_test" } : { ...summary, ...policy, workspaceKind: "personal", planId: null, status: "unsubscribed" } };
      if (path.startsWith("/billing/startup-setup")) { setupReads++; return { data: { setup: { ...setup, status: ready ? "ready" : "expired" } } }; }
      if (path.startsWith("/auth/workspace-target")) { targets++; return { data: { workspaceId: "workspace", generation: 1, destinationOrigin: "https://tms.saturnusgo.com" } }; }
      return { data: { ...account, ...(active ? {} : policy), checkoutMode: "controlled_test", enabled: true,
        subscription: active ? { ...subscription, workspaceId: wrongWorkspace ? "other" : "workspace" } : null, checkout: open ? checkout : null } };
    },
    async get() { return { data: [], meta: { limit: 30 } }; },
    async mutateResource(path: string, _method: string, body: unknown, options: { idempotencyKey: string }) {
      writes.push({ path, body, key: options.idempotencyKey });
      return { data: { subscription: null, checkout, invoice: null, provider: "mock", testMode: true, checkoutMode: "controlled_test" } };
    },
  };
  const tree = <TmsLocaleContext.Provider value={{ locale: "en", languageTag: "en-US", setLocale() {}, t: key => key }}><TmsSessionProvider value={{ kind: "cloud", subject: "cloud:owner", workspaceId: "workspace", workspaceKind: "personal", workspaceRole: "workspace_admin", label: "Owner", signOut: async () => undefined }}><TmsHttpClientProvider client={http as never}><ConnectedBillingFeature workspaceId="workspace" /></TmsHttpClientProvider></TmsSessionProvider></TmsLocaleContext.Provider>;
  return { tree, storage, writes, targets: () => targets, setupReads: () => setupReads, restore() {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow); else Reflect.deleteProperty(globalThis, "window");
    if (previousStorage) Object.defineProperty(globalThis, "sessionStorage", previousStorage); else Reflect.deleteProperty(globalThis, "sessionStorage");
  } };
}
for (const pending of [null, start]) test(`settled Startup reentry discovers the verified company target${pending ? " and discards stale checkout recovery" : " without a mutation receipt"}`, async () => {
  const h = fixture({ active: true, pending }); let view!: ReactTestRenderer;
  try {
    await act(async () => { view = create(h.tree); });
    assert.equal(h.targets(), 1);
    assert.equal(h.storage.size, 0);
    assert.equal(h.writes.length, 0, "settled access must never replay a checkout");
    assert.doesNotMatch(JSON.stringify(view.toJSON()), /Continue checkout/);
  } finally { await act(async () => view?.unmount()); h.restore(); }
});
test("same-owner recovery resumes the saved checkout only after server preparation is ready, preserving consent and its key", async () => {
  const h = fixture({ pending: start }); let view!: ReactTestRenderer;
  try {
    await act(async () => { view = create(h.tree); });
    assert.equal(h.setupReads(), 1);
    assert.deepEqual(h.writes, [{ path: "/billing/checkout", body: { workspaceId: "workspace", planId: "startup", startupSetupId: "saved-setup", startupSetupVersion: 4, confirmWorkspaceConversion: true }, key: "original-key" }]);
    assert.equal(h.storage.size, 0);
    assert.equal(h.targets(), 0, "opening a checkout is not company activation");
  } finally { await act(async () => view?.unmount()); h.restore(); }
});
test("a saved confirmation resumes only its exact open Startup checkout using the same collection key", async () => {
  const h = fixture({ pending: { kind: "confirm", checkoutId: "saved-checkout", outcome: "success" }, open: true }); let view!: ReactTestRenderer;
  try {
    await act(async () => { view = create(h.tree); });
    assert.deepEqual(h.writes, [{ path: "/billing/confirm", body: { workspaceId: "workspace", checkoutId: "saved-checkout", outcome: "success" }, key: "original-key" }]);
    assert.equal(h.targets(), 0, "an open confirmation response cannot prove activation");
  } finally { await act(async () => view?.unmount()); h.restore(); }
});
test("identity OK saves the billing return before sign-out, retains the command, and blocks duplicate logout", async () => {
  const h = fixture({ pending: start }), logout = deferred<void>(); let view!: ReactTestRenderer, signouts = 0, retries = 0;
  try {
    await act(async () => { view = create(<BillingIdentityConfirmation managed={false} client={null} fullscreen ru busy={false} signOut={async () => { signouts++; await logout.promise; }} retry={async () => { retries++; }} />); });
    const ok = view.root.findByType("button"); let leaving!: Promise<void>;
    await act(async () => { leaving = ok.props.onClick(); void ok.props.onClick(); });
    assert.equal(signouts, 1);
    assert.equal(view.root.findByType("button").props.disabled, true);
    assert.equal(restoreIdentityCheckout("cloud:owner", "workspace")?.options.idempotencyKey, "original-key");
    assert.equal(takeContinuation(window.sessionStorage, window.location.origin, "workspace"), "/testcases/umbrella-home/work/?workspaceId=workspace&view=config&settings=billing&lang=ru");
    await act(async () => { logout.resolve(); await leaving; });
    assert.equal(retries, 0);
  } finally { await act(async () => view?.unmount()); h.restore(); }
});
for (const input of [{}, { pending: start, ready: false }, { pending: start, checkoutAllowed: false }, { active: true, pending: start, wrongWorkspace: true }]) test(`ready reservations and incomplete recovery evidence never create a new purchase: ${JSON.stringify(input)}`, async () => {
  const h = fixture(input); let view!: ReactTestRenderer;
  try { await act(async () => { view = create(h.tree); }); assert.equal(h.writes.length, 0); assert.equal(h.targets(), 0); }
  finally { await act(async () => view?.unmount()); h.restore(); }
});
