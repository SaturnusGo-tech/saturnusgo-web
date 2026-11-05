import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
import type { BillingOffers, BillingPlans } from "../../presentation/plans/BillingPlans";
import type { BillingPlan } from "../../domain/billing";
import { subscription } from "../fixtures/billing-fixtures";
const plans = [
  { id: "individual", amount: 1100, seats: 1, workspaceKind: "personal" },
  { id: "startup", amount: 5900, seats: 5, workspaceKind: "company" },
  { id: "enterprise", amount: 24900, seats: 25, workspaceKind: "company" },
].map(plan => ({ ...plan, version: 1, currency: "USD", interval: "month", taxInclusive: false })) as BillingPlan[];
type Props = Parameters<typeof BillingPlans>[0];
const personalOffers: BillingOffers = { suggestedPlanId: "individual", allowedCheckoutPlanIds: ["individual", "startup"], allowedChangePlanIds: [], contactSales: true };
function setup(overrides: Partial<Props> = {}) {
  let selected = "";
  const h = componentHarness();
  const { BillingPlans: render } = h.load<{ BillingPlans: typeof BillingPlans }>(new URL("../../presentation/plans/BillingPlans.tsx", import.meta.url));
  const input: Props = { plans, current: null, occupiedSeats: 1, workspaceKind: "personal", canManage: true,
    busy: false, ru: false, offers: personalOffers, onChoose(id) { selected = id; }, ...overrides };
  const draw = () => nodes(h.render(() => render(input)));
  return { all: draw(), draw, input, selected: () => selected };
}
test("a new personal account sees only its Individual offer and server price", () => {
  const h = setup();
  assert.equal(h.all.find(node => node.props["data-offer"])!.props["data-offer"], "individual");
  assert.equal(h.all.filter(node => node.props["data-plan"]).length, 1);
  assert.ok(h.all.some(node => node.props.children === "$11"));
  assert.ok(!h.all.some(node => node.props.children === "Startup" || node.props.children === "Enterprise"));
  assert.ok(h.all.some(node => node.type === "img" && String(node.props.src).startsWith("/falcon/billing/individual.webp")));
});
test("other plans opens a discreet path to a direct Startup checkout", () => {
  const h = setup();
  invoke(h.all.find(node => node.props["aria-controls"] === "billing-other-plans")!, "onClick");
  let all = h.draw();
  assert.equal(all.find(node => node.props["aria-controls"])!.props["aria-expanded"], true);
  invoke(all.find(node => node.props["data-view-plan"] === "startup")!, "onClick");
  all = h.draw();
  assert.equal(all.find(node => node.props["data-offer"])!.props["data-offer"], "startup");
  assert.equal(all.find(node => node.props["aria-controls"])!.props["aria-expanded"], false);
  const action = all.find(node => node.props["data-plan"] === "startup")!;
  assert.equal(action.props.disabled, false);
  assert.ok(all.some(node => node.props.children === "5 seats"));
  assert.ok(all.some(node => node.props.children === "Members and invitations"));
  invoke(action, "onClick"); assert.equal(h.selected(), "startup");
});
test("Startup recommends contact-only Enterprise without old catalog price or seat claims", () => {
  const h = setup({ current: subscription, workspaceKind: "company", occupiedSeats: 2,
    offers: { suggestedPlanId: "enterprise", allowedCheckoutPlanIds: [], allowedChangePlanIds: [], contactSales: true } });
  assert.equal(h.all.find(node => node.props["data-offer"])!.props["data-offer"], "enterprise");
  assert.equal(h.all.filter(node => node.props["data-plan"]).length, 0);
  assert.ok(h.all.some(node => node.type === "a" && node.props.href === "mailto:falcon@saturnusgo.com"));
  assert.ok(h.all.some(node => node.props.children === "SAML single sign-on"));
  assert.ok(h.all.some(node => node.props.children === "Discuss member permissions"));
  assert.ok(!h.all.some(node => ["$249", "25 seats", "$59"].includes(String(node.props.children))));
});
test("Individual recommends the server-authorized Startup payment despite personal workspace kind", () => {
  const h = setup({ current: { ...subscription, planId: "individual", seats: 1 },
    offers: { ...personalOffers, suggestedPlanId: "startup", allowedCheckoutPlanIds: ["startup"] } });
  const action = h.all.find(node => node.props["data-plan"] === "startup")!;
  assert.equal(action.props.disabled, false);
  assert.ok(h.all.some(node => node.props.children === "Review and confirm your subscription in the next step."));
});
test("the upgrade offer leads with the exact prorated quote and separates later monthly pricing", () => {
  const h = setup({ current: { ...subscription, planId: "individual", seats: 1 },
    offers: { ...personalOffers, suggestedPlanId: "startup", allowedCheckoutPlanIds: ["startup"] },
    quotes: [{ planId: "startup", subtotal: 2400, currency: "USD", periodEnd: subscription.periodEnd, prorated: true }] });
  assert.ok(h.all.some(node => node.props.children === "$24"));
  assert.ok(h.all.some(node => node.props.children === "due now"));
  assert.ok(h.all.some(node => node.props.children === "Then $59 / month · excluding tax"));
  assert.ok(h.all.some(node => node.props.children === "Prorated for the remaining period. Your renewal date stays the same."));
});
test("server-denied plans and pending actions cannot start a payment", () => {
  const denied = setup({ offers: { ...personalOffers, allowedCheckoutPlanIds: [] } });
  assert.equal(denied.all.find(node => node.props["data-plan"])!.props.disabled, true);
  const pending = setup({ busy: true });
  assert.equal(pending.all.find(node => node.props["data-plan"])!.props.disabled, true);
});
test("a lifecycle restriction disables changing plans with a recovery explanation instead of processing copy", () => {
  const restriction = "Resume renewal before changing plans.";
  const h = setup({ offers: { ...personalOffers, suggestedPlanId: "startup" }, restriction });
  const action = h.all.find(node => node.props["data-plan"] === "startup")!;
  assert.equal(action.props.disabled, true); assert.equal(action.props.children, "Resolve subscription first");
  assert.ok(h.all.some(node => node.props.role === "status" && node.props.children === restriction));
  assert.ok(!h.all.some(node => node.props.children === "Please wait…"));
});
test("members can view a single offer without payment or contact controls", () => {
  const h = setup({ canManage: false });
  assert.equal(h.all.filter(node => node.props["data-plan"] || node.type === "a").length, 0);
  assert.ok(h.all.some(node => node.props["aria-controls"] === "billing-other-plans"));
});
test("successful subscription changes replace a manually viewed offer with the new recommendation", () => {
  const h = setup();
  invoke(h.all.find(node => node.props["aria-controls"])!, "onClick");
  invoke(h.draw().find(node => node.props["data-view-plan"] === "startup")!, "onClick");
  assert.equal(h.draw().find(node => node.props["data-offer"])!.props["data-offer"], "startup");
  h.input.current = subscription;
  h.input.offers = { suggestedPlanId: "enterprise", allowedCheckoutPlanIds: [], allowedChangePlanIds: [], contactSales: true };
  assert.equal(h.draw().find(node => node.props["data-offer"])!.props["data-offer"], "enterprise");
});
test("the offer is localized and legacy companies stay contact-only", () => {
  const h = setup({ ru: true, workspaceKind: "company", occupiedSeats: 8,
    offers: { suggestedPlanId: "enterprise", allowedCheckoutPlanIds: [], allowedChangePlanIds: [], contactSales: true } });
  assert.equal(h.all.find(node => node.props["data-offer"])!.props["data-offer"], "enterprise");
  assert.ok(h.all.some(node => node.props.children === "Индивидуальные условия"));
  assert.equal(h.all.filter(node => node.props["data-plan"]).length, 0);
});
