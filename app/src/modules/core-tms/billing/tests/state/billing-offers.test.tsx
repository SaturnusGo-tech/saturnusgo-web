import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useBilling } from "../../application/useBilling";
import { createPreviewBillingPort } from "../../data/preview/preview-billing";
import { account, fixture, result } from "../fixtures/billing-fixtures";
import type { BillingPort } from "../../domain/billing-port";
let current: ReturnType<typeof useBilling>;
function Probe({ port }: { port: BillingPort }) {
  current = useBilling({ port, workspaceId: "personal-upgrade", canManage: true, workspaceKind: "personal" }); return null;
}
void test("successful Startup checkout refreshes policy and exposes team administration without remount", async () => {
  const port = createPreviewBillingPort("personal", "personal-upgrade"); let view!: ReactTestRenderer;
  await act(async () => { view = create(<Probe port={port} />); });
  await act(async () => { await current.startCheckout("individual"); });
  await act(async () => { await current.confirmCheckout("success"); });
  assert.equal(current.account?.subscription?.planId, "individual");
  await act(async () => { await current.startCheckout("startup"); });
  assert.equal(current.checkout?.planId, "startup"); assert.equal(current.summary?.teamAdministration, false);
  await act(async () => { await current.confirmCheckout("success"); });
  assert.equal(current.summary?.teamAdministration, true); assert.equal(current.account?.suggestedPlanId, "enterprise");
  assert.equal(current.invoices.length, 2);
  await act(async () => view.unmount());
});
void test("client commands respect server offer lists rather than inferred workspace kind", async () => {
  const sent: string[] = [];
  const port = fixture({ read: async () => ({ ...account, subscription: null, allowedCheckoutPlanIds: ["startup"], allowedChangePlanIds: [] }),
    execute: async (_id, intent) => { sent.push(intent.kind); return result(); } });
  let view!: ReactTestRenderer; await act(async () => { view = create(<Probe port={port} />); });
  await act(async () => { await current.startCheckout("individual"); await current.startCheckout("enterprise"); await current.changePlan("startup"); });
  assert.deepEqual(sent, []);
  await act(async () => { await current.startCheckout("startup"); }); assert.deepEqual(sent, ["checkout"]);
  await act(async () => view.unmount());
});
