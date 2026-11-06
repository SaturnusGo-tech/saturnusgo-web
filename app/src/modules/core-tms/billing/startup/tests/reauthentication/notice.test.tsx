import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { BillingIdentityConfirmation } from "../../presentation/confirmation/BillingIdentityConfirmation";
test("cloud checkout offers actual sign-out and explicit retry; managed checkout uses the existing identity proof form", async () => {
  for (const managed of [false, true]) {
    let signouts = 0, retries = 0;
    const h = componentHarness();
    const { BillingIdentityConfirmation: View } = h.load<{ BillingIdentityConfirmation: typeof BillingIdentityConfirmation }>(new URL("../../presentation/confirmation/BillingIdentityConfirmation.tsx", import.meta.url));
    const props = { managed, client: {} as never, ru: false, busy: false, signOut: async () => { signouts++; }, retry: async () => { retries++; } };
    const all = nodes(h.render(() => View(props)));
    if (!managed) assert.ok(all.some(node => String(node.props.children).includes("saved company setup")));
    assert.equal(all.some(node => node.type === "SessionConfirmation"), managed);
    if (managed) await invoke(all.find(node => node.type === "SessionConfirmation")!, "onConfirmed");
    else {
      await invoke(all.find(node => node.type === "button" && node.props.children === "Sign in again")!, "onClick");
      assert.equal(signouts, 1); assert.equal(retries, 0);
      await invoke(all.find(node => node.type === "button" && node.props.children === "Already signed in? Retry checkout")!, "onClick");
    }
    assert.equal(retries, 1);
  }
});
