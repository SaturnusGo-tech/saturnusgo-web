import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
import type { BillingScreen } from "../../presentation/screen/BillingScreen";
import { account, summary } from "../fixtures/billing-fixtures";

class Control {
  isConnected = true; disabled = false; focused = 0; summary: Control | null = null;
  focus() { this.focused++; }
  closest(selector: string) { return selector === "details" && this.summary ? { querySelector: () => this.summary } : null; }
}
function setup() {
  const origin = new Control(), confirmation = new Control(), offer = new Control();
  const document = { activeElement: origin };
  const h = componentHarness(undefined, { document, HTMLElement: Control });
  const { BillingScreen: view } = h.load<{ BillingScreen: typeof BillingScreen }>(new URL("../../presentation/screen/BillingScreen.tsx", import.meta.url));
  const noop = async () => undefined;
  const input: Parameters<typeof BillingScreen>[0] = { summary, account, checkout: null, invoices: [], loading: false, busy: false, error: null,
    invoicesError: null, canManage: true, canRetryCommand: false, hasMoreInvoices: false, loadingMoreInvoices: false, ru: false,
    reload() {}, loadMoreInvoices: noop, retryCommand: noop, startCheckout: noop, confirmCheckout: noop, changePlan: noop, cancel: noop, resume: noop, retryPayment: noop };
  const draw = () => nodes(h.render(() => view(input)));
  const all = draw();
  (all.find(node => node.props.className === "confirmationStage")!.props.ref as { current: unknown }).current = confirmation;
  (all.find(node => node.props.className === "offerStage")!.props.ref as { current: unknown }).current = offer;
  return { origin, confirmation, offer, draw, input, all };
}
test("management confirmation receives focus and cancellation restores its initiating control", () => {
  const h = setup();
  invoke(h.all.find(node => node.type === "BillingCurrent")!, "onCancel");
  let all = h.draw();
  assert.equal(h.confirmation.focused, 1);
  assert.equal(all.find(node => node.props.className === "offerStage")!.props.hidden, true);
  assert.equal(all.find(node => node.props.className === "confirmationStage")!.props.tabIndex, -1);
  invoke(all.find(node => node.type === "BillingConfirmation")!, "onDismiss");
  all = h.draw();
  assert.equal(h.origin.focused, 1); assert.equal(all.find(node => node.props.className === "offerStage")!.props.hidden, false);
});
test("a disabled initiating control returns focus to the available management summary", () => {
  const h = setup(), summary = new Control(); h.origin.summary = summary;
  invoke(h.all.find(node => node.type === "BillingCurrent")!, "onResume");
  const all = h.draw(); h.origin.disabled = true;
  invoke(all.find(node => node.type === "BillingConfirmation")!, "onDismiss"); h.draw();
  assert.equal(summary.focused, 1); assert.equal(h.origin.focused, 0);
});
test("a removed initiating control falls back to the accessible offer region", () => {
  const h = setup();
  invoke(h.all.find(node => node.type === "BillingCurrent")!, "onRetry");
  const all = h.draw(); h.origin.isConnected = false;
  invoke(all.find(node => node.type === "BillingConfirmation")!, "onDismiss");
  const after = h.draw();
  assert.equal(h.offer.focused, 1); assert.equal(after.find(node => node.props.className === "offerStage")!.props["aria-label"], "Falcon plans");
});
