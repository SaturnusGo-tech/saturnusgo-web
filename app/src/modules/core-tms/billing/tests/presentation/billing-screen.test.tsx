import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
import type { BillingScreen } from "../../presentation/screen/BillingScreen";
import type { BillingCurrent } from "../../presentation/current/BillingCurrent";
import type { BillingConfirmation } from "../../presentation/confirmation/BillingConfirmation";
import { account, subscription, summary } from "../fixtures/billing-fixtures";

const noop = () => undefined;
const asyncNoop = async () => undefined;
type ScreenProps = Parameters<typeof BillingScreen>[0];
const props = (): ScreenProps => ({ summary, account, checkout: null, invoices: [], loading: false, busy: false, error: null,
  invoicesError: null, paymentsAvailable: true, canManage: true, canRetryCommand: false, hasMoreInvoices: false, loadingMoreInvoices: false, ru: false,
  reload: noop, loadMoreInvoices: asyncNoop, retryCommand: asyncNoop, startCheckout: asyncNoop,
  confirmCheckout: asyncNoop, changePlan: asyncNoop, cancel: asyncNoop, resume: asyncNoop, retryPayment: asyncNoop });

test("an unavailable billing service never invents a free or paid plan", () => {
  const h = componentHarness();
  const { BillingScreen: view } = h.load<{ BillingScreen: typeof BillingScreen }>(new URL("../../presentation/screen/BillingScreen.tsx", import.meta.url));
  let retries = 0;
  const all = nodes(h.render(() => view({ ...props(), summary: null, account: null, error: { code: "NOT_FOUND", retryable: false, requestId: null }, reload: () => retries++ })));
  assert.ok(all.some(node => node.props.children === "Billing is not available yet"));
  assert.ok(!all.some(node => node.type === "BillingCurrent" || node.type === "BillingPlans"));
  invoke(all.find(node => node.type === "button")!, "onClick"); assert.equal(retries, 1);
});

test("members only see the summary and never financial or checkout controls", () => {
  const h = componentHarness();
  const { BillingScreen: view } = h.load<{ BillingScreen: typeof BillingScreen }>(new URL("../../presentation/screen/BillingScreen.tsx", import.meta.url));
  const all = nodes(h.render(() => view({ ...props(), summary: { ...summary, canManage: false }, account: null, canManage: false })));
  assert.ok(all.some(node => node.type === "BillingCurrent" && node.props.canManage === false));
  assert.ok(!all.some(node => ["BillingPlans", "BillingInvoices", "BillingConfirmation"].includes(node.type)));
});

test("cancel renewal opens an explicit confirmation before sending any command", async () => {
  const h = componentHarness();
  const { BillingScreen: view } = h.load<{ BillingScreen: typeof BillingScreen }>(new URL("../../presentation/screen/BillingScreen.tsx", import.meta.url));
  let commands = 0; const input = { ...props(), cancel: async () => { commands++; } };
  let all = nodes(h.render(() => view(input)));
  invoke(all.find(node => node.type === "BillingCurrent")!, "onCancel");
  all = nodes(h.render(() => view(input))); assert.equal(commands, 0);
  const confirmation = all.find(node => node.type === "BillingConfirmation")!;
  assert.equal((confirmation.props.intent as { kind: string }).kind, "cancel");
  await invoke(confirmation, "onConfirm", { kind: "cancel" }); assert.equal(commands, 1);
});

test("a server-authorized Individual upgrade starts checkout before changing the active subscription", async () => {
  const h = componentHarness();
  const { BillingScreen: view } = h.load<{ BillingScreen: typeof BillingScreen }>(new URL("../../presentation/screen/BillingScreen.tsx", import.meta.url));
  let checkoutPlan = ""; let changes = 0;
  const input = { ...props(), account: { ...account, subscription: { ...subscription, planId: "individual" as const }, allowedCheckoutPlanIds: ["startup" as const], allowedChangePlanIds: [] },
    startCheckout: async (id: string) => { checkoutPlan = id; }, changePlan: async () => { changes++; } };
  const all = nodes(h.render(() => view(input)));
  await invoke(all.find(node => node.type === "BillingPlans")!, "onChoose", "startup");
  assert.equal(checkoutPlan, "startup"); assert.equal(changes, 0);
  const after = nodes(h.render(() => view(input)));
  assert.equal(after.find(node => node.type === "BillingConfirmation")!.props.intent, null);
});

test("an uncertain command only retries the original command instead of sending a new payment", () => {
  const h = componentHarness();
  const { BillingScreen: view } = h.load<{ BillingScreen: typeof BillingScreen }>(new URL("../../presentation/screen/BillingScreen.tsx", import.meta.url));
  let replays = 0; let refreshes = 0;
  const all = nodes(h.render(() => view({ ...props(), canRetryCommand: true, error: { code: "SERVICE_UNAVAILABLE", retryable: true, requestId: null },
    retryCommand: async () => { replays++; }, reload: () => refreshes++ })));
  const toast = all.find(node => node.type === "ErrorToast")!;
  invoke(toast, "onRetry");
  assert.equal(replays, 1); assert.equal(refreshes, 0);
  assert.equal(all.find(node => node.type === "BillingPlans")!.props.busy, true);
});
test("a revoked checkout capability removes the retry action from the error toast", () => {
  const h = componentHarness(); let replays = 0;
  const { BillingScreen: view } = h.load<{ BillingScreen: typeof BillingScreen }>(new URL("../../presentation/screen/BillingScreen.tsx", import.meta.url));
  const all = nodes(h.render(() => view({ ...props(), paymentsAvailable: false, canRetryCommand: true,
    error: { code: "SERVICE_UNAVAILABLE", retryable: true, requestId: null }, retryCommand: async () => { replays++; } })));
  const toast = all.find(node => node.type === "ErrorToast")!;
  assert.equal(toast.props.onRetry, undefined); assert.equal(replays, 0);
});

test("an unsubscribed company sees one offer without redundant billing scaffolding", () => {
  const h = componentHarness();
  const { BillingScreen: view } = h.load<{ BillingScreen: typeof BillingScreen }>(new URL("../../presentation/screen/BillingScreen.tsx", import.meta.url));
  const all = nodes(h.render(() => view({ ...props(), summary: { ...summary, planId: null, status: "legacy" },
    account: { ...account, subscription: null, occupiedSeats: 8 } })));
  assert.equal(all.filter(node => node.type === "BillingPlans").length, 1);
  assert.ok(!all.some(node => ["BillingCurrent", "BillingInvoices"].includes(node.type)));
  assert.ok(!all.some(node => typeof node.props.children === "string" && /Plan and billing|Test mode|subscription and seats|No plan selected/.test(node.props.children)));
});

test("canceling monthly renewal keeps the paid period and offers resume", () => {
  const h = componentHarness();
  const { BillingCurrent: view } = h.load<{ BillingCurrent: typeof BillingCurrent }>(new URL("../../presentation/current/BillingCurrent.tsx", import.meta.url));
  const all = nodes(h.render(() => view({ summary, account: { ...account, subscription: { ...subscription, cancelAtPeriodEnd: true } },
    ru: false, busy: false, canManage: true, onCancel: noop, onResume: noop, onRetry: noop })));
  assert.ok(all.some(node => node.props.children === "Access until"));
  assert.ok(all.some(node => node.type === "button" && node.props.children === "Resume renewal"));
  assert.ok(!all.some(node => node.props.children === "Cancel renewal"));
});

test("overdue and renewal-off subscriptions expose recovery without a permanent processing state", () => {
  for (const recovery of ["retry", "resume"] as const) {
    const h = componentHarness();
    const { BillingScreen: view } = h.load<{ BillingScreen: typeof BillingScreen }>(new URL("../../presentation/screen/BillingScreen.tsx", import.meta.url));
    const sub = { ...subscription, status: recovery === "retry" ? "past_due" as const : "active" as const, cancelAtPeriodEnd: recovery === "resume" };
    const input = { ...props(), account: { ...account, subscription: sub } };
    let all = nodes(h.render(() => view(input)));
    const offer = all.find(node => node.type === "BillingPlans")!;
    assert.equal(offer.props.busy, false); assert.match(String(offer.props.restriction), /before changing plans/);
    const button = all.find(node => node.type === "button" && node.props.children === (recovery === "retry" ? "Retry payment" : "Resume renewal"))!;
    assert.ok(button); assert.equal(button.props.disabled, false);
    assert.ok(!nodes(all.find(node => node.type === "details")!).includes(button), "recovery is visible without opening management");
    invoke(button, "onClick");
    all = nodes(h.render(() => view(input)));
    assert.equal((all.find(node => node.type === "BillingConfirmation")!.props.intent as { kind: string }).kind, recovery);
  }
});

test("an ended subscription can start a new checkout even when its old renewal-off flag remains", () => {
  const h = componentHarness();
  const { BillingScreen: view } = h.load<{ BillingScreen: typeof BillingScreen }>(new URL("../../presentation/screen/BillingScreen.tsx", import.meta.url));
  const all = nodes(h.render(() => view({ ...props(), summary: { ...summary, status: "canceled" },
    account: { ...account, subscription: { ...subscription, status: "canceled", cancelAtPeriodEnd: true } } })));
  assert.equal(all.find(node => node.type === "BillingPlans")!.props.busy, false);
});

test("invoice history does not appear on the focused offer screen", () => {
  const h = componentHarness();
  const { BillingScreen: view } = h.load<{ BillingScreen: typeof BillingScreen }>(new URL("../../presentation/screen/BillingScreen.tsx", import.meta.url));
  const all = nodes(h.render(() => view({ ...props(), invoices: [{} as ScreenProps["invoices"][number]],
    invoicesError: { code: "SERVICE_UNAVAILABLE", requestId: null, retryable: true }, hasMoreInvoices: false })));
  assert.ok(!all.some(node => node.type === "BillingInvoices"));
});

test("closing the offer returns to the workspace through its supplied navigation", () => {
  const h = componentHarness(); let closed = 0;
  const { BillingScreen: view } = h.load<{ BillingScreen: typeof BillingScreen }>(new URL("../../presentation/screen/BillingScreen.tsx", import.meta.url));
  const all = nodes(h.render(() => view({ ...props(), onClose: () => { closed++; } })));
  invoke(all.find(node => node.type === "BillingPlans")!, "onClose");
  assert.equal(closed, 1);
});

test("mock checkout discloses no real charge and requires explicit successful or declined confirmation", () => {
  const h = componentHarness();
  const { BillingConfirmation: view } = h.load<{ BillingConfirmation: typeof BillingConfirmation }>(new URL("../../presentation/confirmation/BillingConfirmation.tsx", import.meta.url));
  let outcome = "";
  const input = { intent: null, checkout: { id: "checkout", workspaceId: "workspace", planId: "startup" as const, status: "open" as const, provider: "mock" as const, testMode: true as const,
    subtotal: 5900, currency: "USD" as const, periodEnd: "2026-12-05T00:00:00Z", prorated: false,
    createdAt: "2026-11-05T00:00:00Z", expiresAt: "2026-11-05T00:30:00Z" }, plans: [], current: null, testMode: true, busy: false, ru: false,
    onConfirm: noop, onCheckout: (value: string) => { outcome = value; }, onDismiss: noop };
  let all = nodes(h.render(() => view(input)));
  assert.equal(outcome, "");
  assert.ok(all.some(node => String(node.props.children).includes("No money is charged")));
  invoke(all.find(node => node.type === "input" && node.props.value === "declined")!, "onChange");
  all = nodes(h.render(() => view(input)));
  invoke(all.find(node => node.type === "button" && node.props.children === "Confirm")!, "onClick"); assert.equal(outcome, "declined");
});
