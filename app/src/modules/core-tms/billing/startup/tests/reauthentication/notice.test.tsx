import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { BillingIdentityConfirmation } from "../../presentation/confirmation/BillingIdentityConfirmation";
import { rememberBrowserContinuation } from "../../../../auth/continuation/application/browser-continuation";
test("cloud checkout offers one neutral sign-out action; managed checkout preserves the identity proof form", async () => {
  for (const managed of [false, true]) {
    let signouts = 0, retries = 0;
    const h = componentHarness();
    const { BillingIdentityConfirmation: View } = h.load<{ BillingIdentityConfirmation: typeof BillingIdentityConfirmation }>(new URL("../../presentation/confirmation/BillingIdentityConfirmation.tsx", import.meta.url), name => name.endsWith("/browser-continuation") ? { rememberBrowserContinuation } : undefined);
    const props = { managed, client: {} as never, ru: false, busy: false, signOut: async () => { signouts++; }, retry: async () => { retries++; } };
    const all = nodes(h.render(() => View(props)));
    assert.equal(all.some(node => node.type === "SessionConfirmation"), managed);
    if (managed) await invoke(all.find(node => node.type === "SessionConfirmation")!, "onConfirmed");
    else {
      assert.equal(all.some(node => node.props.role === "alert"), false);
      assert.equal(all.filter(node => node.type === "button").length, 1);
      await invoke(all.find(node => node.type === "button" && node.props.children === "OK")!, "onClick");
      assert.equal(signouts, 1); assert.equal(retries, 0);
    }
    assert.equal(retries, managed ? 1 : 0);
  }
});
