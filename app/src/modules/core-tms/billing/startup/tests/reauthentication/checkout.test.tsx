import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { useBillingCommands } from "../../../application/commands/useBillingCommands";
import { account, result } from "../../../tests/fixtures/billing-fixtures";
import type { BillingIntent } from "../../../domain/billing";
import type { BillingCommandOptions, BillingPort } from "../../../domain/billing-port";
import { restoreIdentityCheckout, storeIdentityCheckout } from "../../../application/commands/reauthentication-checkout";
test("recent-confirmation rejection preserves the exact Startup draft and key across same-owner sign-in, without automatic checkout", async () => {
  const items = new Map<string, string>();
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => items.set(key, value), removeItem: (key: string) => items.delete(key) } });
  const calls: { intent: BillingIntent; options: BillingCommandOptions }[] = [];
  const port = { execute: async (_id, intent, options) => { calls.push({ intent, options }); if (calls.length === 1) throw { status: 403, code: "REAUTHENTICATION_REQUIRED" }; return result(); } } as BillingPort;
  let current!: ReturnType<typeof useBillingCommands>;
  function Probe({ subject = "cloud:owner", workspaceId = "workspace" }: { subject?: string; workspaceId?: string }) { current = useBillingCommands({ port, workspaceId, enabled: true, account, reauthenticationScope: subject, onResult() {}, onConflict() {} }); return null; }
  let view!: ReturnType<typeof create>;
  try {
    await act(async () => { view = create(<Probe />); });
    const intent = { kind: "checkout", planId: "startup", startupSetupId: "draft", startupSetupVersion: 4, confirmWorkspaceConversion: true } as const;
    await act(async () => { await current.execute(intent); });
    assert.equal(current.error?.code, "REAUTHENTICATION_REQUIRED"); assert.equal(current.canRetryCommand, true);
    await act(async () => { view.unmount(); view = create(<Probe subject="cloud:other" />); });
    assert.equal(current.canRetryCommand, false);
    await act(async () => { view.unmount(); view = create(<Probe workspaceId="other" />); });
    assert.equal(current.canRetryCommand, false);
    await act(async () => { view.unmount(); view = create(<Probe />); });
    assert.equal(current.canRetryCommand, true); assert.equal(calls.length, 1);
    await act(async () => { await current.retryCommand(); });
    assert.deepEqual(calls[1].intent, intent); assert.equal(calls[1].options.idempotencyKey, calls[0].options.idempotencyKey); assert.equal(calls[1].options.version, calls[0].options.version);
    assert.equal(current.canRetryCommand, false); assert.equal(items.size, 0);
  } finally { await act(async () => view?.unmount()); Reflect.deleteProperty(globalThis, "sessionStorage"); }
});
test("a paused Startup collection preserves its exact checkout identity and outcome, and malformed or expired retries are ignored", () => {
  const items = new Map<string, string>();
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => items.set(key, value), removeItem: (key: string) => items.delete(key) } });
  try {
    const command = { intent: { kind: "confirm", checkoutId: "open-startup-checkout", outcome: "success" }, options: { idempotencyKey: "same-collection-key" } } as const;
    storeIdentityCheckout("cloud:owner", "workspace", command);
    assert.deepEqual(restoreIdentityCheckout("cloud:owner", "workspace")?.intent, command.intent);
    const key = [...items.keys()][0]; const value = JSON.parse(items.get(key)!);
    items.set(key, JSON.stringify({ ...value, expiresAt: Date.now() - 1 }));
    assert.equal(restoreIdentityCheckout("cloud:owner", "workspace"), null); assert.equal(items.size, 0);
    items.set(key, JSON.stringify({ ...value, expiresAt: undefined }));
    assert.equal(restoreIdentityCheckout("cloud:owner", "workspace"), null);
  } finally { Reflect.deleteProperty(globalThis, "sessionStorage"); }
});
