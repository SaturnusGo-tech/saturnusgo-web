import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
import type { StartupSetupScreen } from "../presentation/StartupSetupScreen";
const setup = { id: "draft", version: 2, displayName: "Team", slug: "team", hostname: "team-falcon.saturnusgo.com", status: "ready", expiresAt: "2026-11-06T12:30:00Z" };
function fixture(paymentsAvailable = true) {
  const h = componentHarness(); let checkouts = 0;
  const input = { model: { setup, loading: false, busy: false, error: null, canRetryCommand: false, save: async () => {}, retry: async () => {}, reload() {}, retryCommand: async () => {} },
    plan: { id: "startup", seats: 5, amount: 5900, currency: "USD" }, quote: { subtotal: 1234, currency: "USD", periodEnd: "2026-12-01T00:00:00Z" },
    canCheckout: true, paymentsAvailable, busy: false, ru: false, onBack() {}, onCheckout: async () => { checkouts++; } } as unknown as Parameters<typeof StartupSetupScreen>[0];
  const { StartupSetupScreen: View } = h.load<{ StartupSetupScreen: typeof StartupSetupScreen }>(new URL("../presentation/StartupSetupScreen.tsx", import.meta.url));
  return { draw: () => nodes(h.render(() => View(input))), calls: () => checkouts, input };
}
test("ready setup shows server price, seats, renewal and requires whole-workspace conversion confirmation", async () => {
  const h = fixture(); let all = h.draw();
  const next = () => all.find(node => node.type === "button" && node.props.children === "Continue to checkout")!;
  assert.equal(next().props.disabled, true); assert.ok(all.some(node => node.props.children === "team-falcon.saturnusgo.com"));
  assert.ok(all.some(node => String(node.props.children).includes("All projects in this workspace")));
  invoke(all.find(node => node.type === "input" && node.props.type === "checkbox")!, "onChange", { target: { checked: true } });
  all = h.draw(); assert.equal(next().props.disabled, false); await invoke(next(), "onClick"); assert.equal(h.calls(), 1);
});
test("production payment availability cannot be bypassed by explicit conversion confirmation", () => {
  const h = fixture(false); let all = h.draw();
  invoke(all.find(node => node.type === "input" && node.props.type === "checkbox")!, "onChange", { target: { checked: true } });
  all = h.draw(); assert.equal(all.find(node => node.type === "button" && node.props.children === "Continue to checkout")!.props.disabled, true);
  assert.ok(all.some(node => node.props.children === "Payments are not available yet."));
});

test("a failed save preserves the entered company name for correction", async () => {
  const h = fixture(); h.input.model.save = async () => false;
  let all = h.draw();
  invoke(all.find(node => node.props.id === "startup-name")!, "onChange", { target: { value: "My draft team" } });
  all = h.draw(); await invoke(all.find(node => node.type === "form")!, "onSubmit", { preventDefault() {} });
  assert.equal(h.draw().find(node => node.props.id === "startup-name")!.props.value, "My draft team");
});
test("Startup setup keeps checkout identity-confirmation actions visible beside the saved draft", () => {
  const h = fixture();
  h.input.checkoutNotice = "Confirm your identity before checkout";
  h.input.busy = true;
  const all = h.draw();
  assert.ok(all.some(node => node.props.children === h.input.checkoutNotice));
  assert.equal(all.find(node => node.props.id === "startup-name")!.props.value, "Team");
  assert.equal(all.find(node => node.type === "button" && node.props.children === "Continue to checkout")!.props.disabled, true);
});
