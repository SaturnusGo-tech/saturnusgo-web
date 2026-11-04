import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useTmsSession } from "../../../presentation/session/TmsSessionContext";
void test("personal logout returns native Falcon to sign-in while ordinary browser logout keeps its destination", async t => {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const prior = ["window", "navigator", "React", "fetch"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const destinations: string[] = [], requests: string[] = [];
  let signOut!: () => Promise<void>, view: ReactTestRenderer | null = null;
  Object.assign(globalThis, { React, window: { location: { origin: "https://tms.example.test", search: "", replace: (path: string) => destinations.push(path) } } });
  globalThis.fetch = async input => { requests.push(String(input)); return new Response(null, { status: 204 }); };
  t.after(async () => {
    await act(async () => view?.unmount());
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    for (const [key, descriptor] of prior) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  });
  const { CloudTmsGate } = await import("../../../presentation/gate/CloudTmsGate");
  type Session = React.ComponentProps<typeof CloudTmsGate>["session"];
  const session = { authenticated: true, identity: { id: "person", givenName: "Pat", familyName: "", email: "pat@example.test" },
    workspace: { id: "personal-space" }, membership: { role: "workspace_admin" } } as Session;
  function Probe() { signOut = useTmsSession().signOut; return <div />; }
  for (const [userAgent, destination] of [["Electron/45 FalconDesktop/0.2.1", "/cloud-login/"], ["Chrome/150", "/"]]) {
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { userAgent } });
    await act(async () => { view = create(<CloudTmsGate apiBase="/api/v1" session={session}><Probe /></CloudTmsGate>); });
    await act(async () => { await signOut(); });
    assert.equal(destinations[destinations.length - 1], destination);
    assert.equal(requests[requests.length - 1], "/api/v1/cloud-auth/logout");
    await act(async () => view?.unmount()); view = null;
  }
});
