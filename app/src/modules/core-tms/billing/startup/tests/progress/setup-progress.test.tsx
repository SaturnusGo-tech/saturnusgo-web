import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const previousCss = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { StartupSetupScreen } = require("../../presentation/StartupSetupScreen") as typeof import("../../presentation/StartupSetupScreen");
if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];
type Props = Parameters<typeof StartupSetupScreen>[0];
function fixture() {
  let view!: ReactTestRenderer;
  const input: Props = { model: { setup: { id: "draft", version: 2, displayName: "Team", slug: "team", hostname: "team-falcon.saturnusgo.com", status: "ready", expiresAt: "2027-11-06T12:30:00Z" }, loading: false, busy: false, error: null, canRetryCommand: false,
    save: async () => true, retry: async () => false, reload() {}, retryCommand: async () => false },
    plan: { id: "startup", seats: 5, amount: 5900, currency: "USD" } as Props["plan"],
    quote: { planId: "startup", subtotal: 1234, currency: "USD", periodEnd: null, prorated: false },
    canCheckout: true, paymentsAvailable: true, busy: false, ru: false, onBack() {}, onCheckout: async () => {} };
  return { input, mount: async () => { await act(async () => { view = create(<StartupSetupScreen {...input} />); }); return view; },
    refresh: async () => { await act(async () => view.update(<StartupSetupScreen {...input} />)); } };
}
async function click(view: ReactTestRenderer, props: Record<string, unknown>) { await act(async () => view.root.findByProps(props).props.onClick()); }
async function consentStep(view: ReactTestRenderer) { await click(view, { "data-wizard-next": "name" }); await click(view, { "data-wizard-next": "address" }); }

test("identity refresh owns its wizard stage without the previous form or duplicate notices", async () => {
  const h = fixture(); h.input.busy = true;
  h.input.identityConfirmation = <section role="status"><p>Sign in to continue</p><button>OK</button></section>;
  h.input.checkoutNotice = "duplicate checkout error";
  h.input.controlledTest = true;
  const view = await h.mount();
  try {
    assert.equal(view.root.findByProps({ "data-company-wizard": true }).props["data-stage"], "identity");
    assert.equal(view.root.findAllByType("input").length, 0);
    assert.doesNotMatch(JSON.stringify(view.toJSON()), /duplicate checkout error|Test mode/);
    assert.equal(view.root.findAllByType("button").filter(node => !node.props.disabled).length, 1);
  } finally { await act(async () => view.unmount()); }
});

test("preparation never offers address editing between polls, and terminal failure still permits correction", async () => {
  const h = fixture(); h.input.model.setup = { ...h.input.model.setup!, status: "reserved" };
  const view = await h.mount();
  const editButtons = () => view.root.findAllByType("button").filter(node => node.children.includes("Edit address"));
  try {
    await consentStep(view);
    await act(async () => view.root.findByProps({ id: "startup-consent" }).props.onChange({ target: { checked: true } }));
    await click(view, { "data-wizard-checkout": true });
    for (const status of ["reserved", "provisioning"] as const) for (const loading of [false, true, false]) {
      h.input.model.setup = { ...h.input.model.setup!, status }; h.input.model.loading = loading; await h.refresh();
      assert.equal(editButtons().length, 0, `${status}, loading=${loading} must keep preparation uninterrupted`);
    }
    for (const status of ["failed", "expired"] as const) {
      h.input.model.setup = { ...h.input.model.setup!, status }; await h.refresh();
      assert.equal(editButtons().length, 1, `${status} must retain address recovery`);
    }
  } finally { await act(async () => view.unmount()); }
});
test("controlled Startup keeps its preparation screen while the server finishes checkout, without a mock confirmation",async()=>{
 const h=fixture();h.input.controlledTest=true;
 h.input.checkout={id:"checkout",workspaceId:"workspace",planId:"startup",status:"open",provider:"mock",testMode:true,subtotal:5900,currency:"USD",createdAt:"2026-11-06T12:00:00Z",expiresAt:"2027-11-06T12:30:00Z",periodEnd:null,prorated:false};
 const view=await h.mount();
 try {assert.equal(view.root.findByProps({"data-company-wizard":true}).props["data-stage"],"finishing");assert.equal(view.root.findAllByProps({name:"billing-outcome"}).length,0);
  assert.equal(view.root.findAllByType("button").some(node=>node.children.includes("Confirm")),false);
 } finally {await act(async()=>view.unmount());}
});

