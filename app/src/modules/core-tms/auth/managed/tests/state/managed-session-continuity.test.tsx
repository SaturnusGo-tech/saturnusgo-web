import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useManagedAccess } from "../../application/useManagedAccess";
import type { ManagedAccessPort } from "../../application/managed-access-port";
import { CompanyAccessError, type CompanySession } from "../../domain/managed-access";

let current: ReturnType<typeof useManagedAccess>;
function Probe({ client }: { client: ManagedAccessPort }) { current = useManagedAccess(client); return null; }

void test("long sessions renew quietly, recover after offline and sleep, and still honor revocation", async (t) => {
  const windowTarget = new EventTarget();
  const documentTarget = new EventTarget();
  const delays: number[] = [];
  let heartbeat: () => void = () => {};
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "window", { configurable: true, value: Object.assign(windowTarget, {
    setTimeout: (_fn: () => void, delay: number) => { delays.push(delay); return 1; }, clearTimeout: () => {},
    setInterval: (fn: () => void) => { heartbeat = fn; return 2; }, clearInterval: () => {},
  }) });
  const doc = Object.assign(documentTarget, { visibilityState: "visible" });
  Object.defineProperty(globalThis, "document", { configurable: true, value: doc });
  t.after(() => {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow); else Reflect.deleteProperty(globalThis, "window");
    if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument); else Reflect.deleteProperty(globalThis, "document");
  });
  const session: CompanySession = { authenticated: true, stage: "authenticated", audience: "tenant",
    workspaceId: "alpha", capabilities: [], expiresAt: new Date(Date.now() + 2592000000).toISOString(),
    identity: { id: "qa", name: "QA", login: "qa", email: "qa@example.test", emailVerified: true,
      phone: "", role: "tester", owner: false, hasAvatar: false, version: 1 } };
  let response: CompanySession = session;
  let offline = false; let calls = 0;
  const client: ManagedAccessPort = {
    entrypoint: async () => ({ name: "Alpha", hostname: "alpha.example.test", audience: "tenant", available: true, accessContact: "" }),
    session: async () => { calls++; if (offline) throw new CompanyAccessError("SERVICE_UNAVAILABLE"); return response; },
    login: async () => {}, firstPassword: async () => {}, logout: async () => {},
    prepareMfa: async () => ({ secret: "", uri: "", issuer: "", account: "" }),
    verifyMfa: async () => ({ stage: "authenticated", expiresAt: session.expiresAt, recoveryCodes: [] }),
  };
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(<Probe client={client} />); });
  assert.equal(calls, 1);
  assert.ok(delays.every(delay => delay > 0 && delay <= 2147483647));
  offline = true;
  await act(async () => heartbeat());
  assert.equal(current.state.session?.authenticated, true);
  assert.equal(current.state.loading, false);
  offline = false;
  response = { ...session, expiresAt: new Date(Date.now() + 2592000000 + 300000).toISOString() };
  await act(async () => { windowTarget.dispatchEvent(new Event("online")); });
  assert.equal(current.state.session, response);
  assert.equal(current.state.loading, false);
  doc.visibilityState = "hidden";
  const previousCalls = calls;
  await act(async () => heartbeat());
  assert.equal(calls, previousCalls);
  doc.visibilityState = "visible";
  await act(async () => { documentTarget.dispatchEvent(new Event("visibilitychange")); });
  assert.equal(calls, previousCalls + 1);
  response = { authenticated: false, stage: "anonymous" };
  await act(async () => heartbeat());
  assert.equal(current.state.session?.authenticated, false);
  await act(async () => renderer.unmount());
});
