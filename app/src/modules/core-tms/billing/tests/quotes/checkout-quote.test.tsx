import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
import type { BillingConfirmation } from "../../presentation/confirmation/BillingConfirmation";
import type { BillingCheckout, BillingPlan } from "../../domain/billing";
import { subscription } from "../fixtures/billing-fixtures";

const checkout: BillingCheckout = { id: "upgrade", workspaceId: "workspace", planId: "startup", status: "open", provider: "mock", testMode: true,
  createdAt: "2026-11-15T00:00:00Z", expiresAt: "2026-11-15T00:30:00Z", subtotal: 2400, currency: "USD", periodEnd: "2026-12-01T00:00:00Z", prorated: true };
const plans: BillingPlan[] = [{ id: "startup", version: 1, currency: "USD", interval: "month", amount: 5900, seats: 5, workspaceKind: "company", taxInclusive: false }];
type Props = Parameters<typeof BillingConfirmation>[0];
function setup(overrides: Partial<Props> = {}) {
  let selected = "";
  const h = componentHarness();
  const { BillingConfirmation: view } = h.load<{ BillingConfirmation: typeof BillingConfirmation }>(new URL("../../presentation/confirmation/BillingConfirmation.tsx", import.meta.url));
  const props: Props = { intent: null, checkout, plans, current: { ...subscription, planId: "individual", amount: 1100 }, testMode: true, busy: false, ru: false,
    onConfirm() {}, onDismiss() {}, onCheckout(outcome) { selected = outcome; }, ...overrides };
  const draw = () => nodes(h.render(() => view(props)));
  return { draw, all: draw(), selected: () => selected };
}

test("a prorated upgrade distinguishes the immutable amount due from later monthly renewal", () => {
  const h = setup();
  assert.ok(h.all.some(node => node.props.children === "Due now, before tax"));
  assert.ok(h.all.some(node => node.type === "dd" && node.props.children === "$24.00"));
  assert.ok(h.all.some(node => node.props.children === "Then monthly"));
  assert.ok(h.all.some(node => node.type === "dd" && node.props.children === "$59.00"));
  assert.ok(h.all.some(node => node.type === "dd" && node.props.children === "Dec 1, 2026"));
  assert.ok(h.all.some(node => String(node.props.children).includes("keeps your existing renewal date")));
  assert.ok(h.all.some(node => String(node.props.children).includes("No money is charged")));
  assert.equal(h.selected(), "");
});

test("the amount and period come from the checkout snapshot instead of the current subscription", () => {
  const h = setup({ checkout: { ...checkout, subtotal: 1825 }, current: { ...subscription, planId: "individual", periodEnd: "2027-02-01T00:00:00Z" } });
  assert.ok(h.all.some(node => node.type === "dd" && node.props.children === "$18.25"));
  assert.ok(h.all.some(node => node.type === "dd" && node.props.children === "Dec 1, 2026"));
  assert.ok(!h.all.some(node => node.props.children === "Feb 1, 2027"));
});

test("ordinary new checkout shows the full quoted period without claiming proration", () => {
  const h = setup({ checkout: { ...checkout, subtotal: 5900, periodEnd: null, prorated: false }, current: null });
  assert.equal(h.all.filter(node => node.type === "dd" && node.props.children === "$59.00").length, 2);
  assert.ok(!h.all.some(node => node.props.children === "Renewal date"));
  assert.ok(!h.all.some(node => String(node.props.children).includes("remaining paid period")));
});

test("an unavailable quote blocks confirmation without inventing an amount", () => {
  const h = setup({ checkout: { ...checkout, subtotal: Number.NaN } });
  const confirm = h.all.find(node => node.type === "button" && node.props.children === "Confirm")!;
  assert.equal(confirm.props.disabled, true);
  assert.ok(h.all.some(node => node.props.role === "alert"));
  assert.equal(h.all.filter(node => node.type === "dd").length, 0);
});

test("localized quote still requires an explicit simulated payment outcome", () => {
  const h = setup({ ru: true });
  assert.ok(h.all.some(node => node.props.children === "Сейчас, без налогов"));
  assert.ok(h.all.some(node => node.props.children === "Дата продления"));
  invoke(h.all.find(node => node.type === "input" && node.props.value === "declined")!, "onChange");
  invoke(h.draw().find(node => node.type === "button" && node.props.children === "Подтвердить")!, "onClick");
  assert.equal(h.selected(), "declined");
});
