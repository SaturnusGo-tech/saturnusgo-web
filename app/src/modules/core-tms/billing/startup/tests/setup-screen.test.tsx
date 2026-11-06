import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useStartupSetup } from "../application/useStartupSetup";
import type { StartupSetup, StartupSetupPort } from "../domain/startup-setup";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const previousCss = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { StartupSetupScreen } = require("../presentation/StartupSetupScreen") as typeof import("../presentation/StartupSetupScreen");
if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];
type Props = Parameters<typeof StartupSetupScreen>[0];
const setup = { id: "draft", version: 2, displayName: "Team", slug: "team", hostname: "team-falcon.saturnusgo.com", status: "ready", expiresAt: "2027-11-06T12:30:00Z" };
function fixture(paymentsAvailable = true) {
  let checkouts = 0, continuations = 0, refreshes = 0, view!: ReactTestRenderer;
  const input = { model: { setup: { ...setup }, loading: false, busy: false, error: null, canRetryCommand: false,
    save: async () => true, retry: async () => {}, reload() {}, retryCommand: async () => {} },
    plan: { id: "startup", seats: 5, amount: 5900, currency: "USD" },
    quote: { planId: "startup", subtotal: 1234, currency: "USD", periodEnd: "2027-12-01T00:00:00Z", prorated: false },
    canCheckout: true, paymentsAvailable, busy: false, ru: false, onBack() {}, onCheckout: async () => { checkouts++; },
    onContinue: () => { continuations++; }, onRefreshBilling: () => { refreshes++; } } as unknown as Props;
  return { input, calls: () => ({ checkouts, continuations, refreshes }),
    mount: async () => { await act(async () => { view = create(<StartupSetupScreen {...input} />); }); return view; },
    refresh: async () => { await act(async () => view.update(<StartupSetupScreen {...input} />)); } };
}
async function click(view: ReactTestRenderer, props: Record<string, unknown>) {
  await act(async () => view.root.findByProps(props).props.onClick());
}
async function consentStep(view: ReactTestRenderer) {
  await click(view, { "data-wizard-next": "name" });
  await click(view, { "data-wizard-next": "address" });
}
const checkout = (view: ReactTestRenderer) => view.root.findByProps({ "data-wizard-checkout": true });

test("saved setup requires explicit whole-workspace consent again after its version changes", async () => {
  const h = fixture(); const view = await h.mount();
  try {
    assert.equal(view.root.findByProps({ "data-company-wizard": true }).props["data-stage"], "name");
    await consentStep(view);
    const content = JSON.stringify(view.toJSON());
    assert.match(content, /whole workspace/); assert.match(content, /all existing projects/);
    assert.match(content, /5 seats/); assert.match(content, /\$59\.00/); assert.match(content, /\$12\.34/);
    assert.equal(checkout(view).props.disabled, true);
    await act(async () => checkout(view).props.onClick()); assert.equal(h.calls().checkouts, 0);
    await act(async () => view.root.findByProps({ id: "startup-consent" }).props.onChange({ target: { checked: true } }));
    assert.equal(checkout(view).props.disabled, false);
    h.input.model.setup = { ...h.input.model.setup!, version: 3 }; await h.refresh();
    assert.equal(view.root.findByProps({ id: "startup-consent" }).props.checked, false);
    assert.equal(checkout(view).props.disabled, true);
    await act(async () => checkout(view).props.onClick()); assert.equal(h.calls().checkouts, 0);
    await act(async () => view.root.findByProps({ id: "startup-consent" }).props.onChange({ target: { checked: true } }));
    await act(async () => checkout(view).props.onClick()); assert.equal(h.calls().checkouts, 1);
  } finally { await act(async () => view.unmount()); }
});

test("explicit conversion consent cannot bypass unavailable production payments", async () => {
  const h = fixture(false); const view = await h.mount();
  try {
    await consentStep(view);
    await act(async () => view.root.findByProps({ id: "startup-consent" }).props.onChange({ target: { checked: true } }));
    assert.equal(checkout(view).props.disabled, true);
    assert.match(JSON.stringify(view.toJSON()), /Payments are not available yet/);
    await act(async () => checkout(view).props.onClick()); assert.equal(h.calls().checkouts, 0);
  } finally { await act(async () => view.unmount()); }
});

test("a failed reservation keeps the address step and entered name available for correction", async () => {
  const h = fixture(); const saved: unknown[] = [];
  h.input.model.save = async input => { saved.push(input); return false; };
  const view = await h.mount();
  try {
    await act(async () => view.root.findByProps({ id: "startup-name" }).props.onChange({ target: { value: "My draft team" } }));
    await consentStep(view);
    assert.deepEqual(saved, [{ displayName: "My draft team", slug: "my-draft-team" }]);
    assert.equal(view.root.findByProps({ "data-company-wizard": true }).props["data-stage"], "address");
    assert.equal(view.root.findByProps({ id: "startup-slug" }).props.value, "my-draft-team");
    h.input.model.error = { code: "STARTUP_SLUG_UNAVAILABLE", requestId: null, retryable: false }; await h.refresh();
    assert.equal(view.root.findByProps({ id: "startup-slug" }).props["aria-invalid"], true);
    await act(async () => view.root.findAllByType("button").find(node => node.children.includes("Previous"))!.props.onClick());
    assert.equal(view.root.findByProps({ id: "startup-name" }).props.value, "My draft team");
    assert.equal(h.calls().checkouts, 0);
  } finally { await act(async () => view.unmount()); }
});

test("a completed checkout waits for authoritative activation before exposing success Continue", async () => {
  const h = fixture();
  h.input.checkout = { id: "checkout", workspaceId: "workspace", planId: "startup", provider: "mock", testMode: true, status: "completed",
    createdAt: "2026-11-06T12:00:00Z", expiresAt: "2027-11-06T12:30:00Z", subtotal: 1234, currency: "USD", periodEnd: "2027-12-01T00:00:00Z", prorated: false };
  const view = await h.mount();
  try {
    assert.equal(view.root.findByProps({ "data-company-wizard": true }).props["data-stage"], "name");
    h.input.activationPending = true; await h.refresh();
    assert.equal(view.root.findByProps({ "data-company-wizard": true }).props["data-stage"], "finishing");
    assert.equal(view.root.findAllByType("button").some(node => node.children.includes("Continue")), false);
    await act(async () => view.root.findAllByType("button").find(node => node.children.includes("Check status"))!.props.onClick());
    assert.deepEqual(h.calls(), { checkouts: 0, continuations: 0, refreshes: 1 });
    h.input.activationPending = false; h.input.activated = true; await h.refresh();
    assert.equal(view.root.findByProps({ "data-company-wizard": true }).props["data-stage"], "success");
    assert.match(JSON.stringify(view.toJSON()), /Your company is ready/);
    await act(async () => view.root.findAllByType("button").find(node => node.children.includes("Continue"))!.props.onClick());
    assert.equal(h.calls().continuations, 1);
  } finally { await act(async () => view.unmount()); }
});

test("checkout identity recovery remains visible while the saved name is locked", async () => {
  const h = fixture(); h.input.busy = true; h.input.checkoutNotice = "Confirm your identity before checkout";
  const view = await h.mount();
  try {
    assert.match(JSON.stringify(view.toJSON()), /Confirm your identity before checkout/);
    assert.equal(view.root.findByProps({ id: "startup-name" }).props.value, "Team");
    assert.equal(view.root.findByProps({ "data-wizard-next": "name" }).props.disabled, true);
  } finally { await act(async () => view.unmount()); }
});

for (const uncertain of [false, true]) test(`preparation retry${uncertain ? " after a lost response" : ""} requires consent for its new version before checkout`, async () => {
  let serverSetup = { ...setup, status: "reserved" } as StartupSetup;
  let model!: ReturnType<typeof useStartupSetup>, checkouts = 0;
  const retries: { version: number; key: string }[] = [];
  const api: StartupSetupPort = { read: async () => serverSetup, save: async () => serverSetup,
    retry: async (_id, version, key) => {
      retries.push({ version, key });
      if (uncertain && retries.length === 1) throw new TypeError("lost retry response");
      serverSetup = { ...serverSetup, status: "reserved", version: 3 }; return serverSetup;
    } };
  const input = fixture().input;
  function Probe() {
    model = useStartupSetup(api, "workspace", true);
    return <StartupSetupScreen {...input} model={model} onCheckout={async () => { checkouts++; }} />;
  }
  let view!: ReactTestRenderer;
  try {
    await act(async () => { view = create(<Probe />); });
    await consentStep(view);
    await act(async () => view.root.findByProps({ id: "startup-consent" }).props.onChange({ target: { checked: true } }));
    await act(async () => checkout(view).props.onClick());
    assert.equal(view.root.findByProps({ "data-company-wizard": true }).props["data-stage"], "preparing");
    serverSetup = { ...serverSetup, status: "failed" };
    await act(async () => model.reload());
    await act(async () => view.root.findAllByType("button").find(node => node.children.includes("Retry preparation"))!.props.onClick());
    if (uncertain) {
      assert.equal(model.canRetryCommand, true);
      await act(async () => view.root.findAllByType("button").find(node => node.children.includes("Retry the same action"))!.props.onClick());
      assert.equal(retries.length, 2); assert.deepEqual(retries[1], retries[0]);
    } else assert.equal(retries.length, 1);
    assert.equal(retries[0].version, 2);
    assert.equal(model.setup?.version, 3);
    assert.equal(view.root.findByProps({ "data-company-wizard": true }).props["data-stage"], "consent");
    serverSetup = { ...serverSetup, status: "ready" };
    await act(async () => model.reload());
    assert.equal(view.root.findByProps({ id: "startup-consent" }).props.checked, false);
    assert.equal(checkout(view).props.disabled, true);
    await act(async () => checkout(view).props.onClick()); assert.equal(checkouts, 0);
    await act(async () => view.root.findByProps({ id: "startup-consent" }).props.onChange({ target: { checked: true } }));
    await act(async () => checkout(view).props.onClick()); assert.equal(checkouts, 1);
  } finally { await act(async () => view?.unmount()); }
});
