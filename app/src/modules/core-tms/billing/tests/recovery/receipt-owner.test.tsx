import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useBilling } from "../../application/useBilling";
import type { BillingPort } from "../../domain/billing-port";
import { account, fixture, result } from "../fixtures/billing-fixtures";

test("completed billing receipts are cleared when workspace, port or signed-in subject changes", async () => {
  const checkout = { id: "receipt", workspaceId: "workspace", planId: "startup" as const, provider: "mock" as const, testMode: true as const,
    status: "open" as const, createdAt: "2026-11-06T00:00:00Z", expiresAt: "2026-11-06T00:30:00Z", subtotal: 5900, currency: "USD" as const, periodEnd: null, prorated: false };
  let current!: ReturnType<typeof useBilling>;
  function Probe({ port, workspaceId = "workspace", subject = "owner" }: { port: BillingPort; workspaceId?: string; subject?: string }) {
    current = useBilling({ port, workspaceId, canManage: true, workspaceKind: "company", reauthenticationScope: subject }); return null;
  }
  for (const change of ["workspace", "port", "subject"]) {
    const port = fixture({ read: async () => ({ ...account, checkout }), execute: async () => result({ checkout: { ...checkout, status: "completed" } }) });
    let view!: ReactTestRenderer;
    try {
      await act(async () => { view = create(<Probe port={port} />); });
      await act(async () => current.confirmCheckout("success"));
      assert.equal(current.lastMutation?.checkout?.status, "completed");
      await act(async () => { view.update(<Probe port={change === "port" ? fixture() : port} workspaceId={change === "workspace" ? "other" : "workspace"} subject={change === "subject" ? "another-owner" : "owner"} />); });
      assert.equal(current.lastMutation, null, `${change} changes must clear the receipt`);
      await act(async () => { view.update(<Probe port={port} />); });
      assert.equal(current.lastMutation, null, `${change} changes must not resurrect an earlier receipt`);
    } finally { await act(async () => view?.unmount()); }
  }
});
