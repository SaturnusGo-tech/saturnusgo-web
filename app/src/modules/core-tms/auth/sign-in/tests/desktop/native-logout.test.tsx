import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useTmsSession } from "../../../presentation/session/TmsSessionContext";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
void test("personal logout returns native Falcon and ordinary browsers directly to sign-in", async t => {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const prior = ["window", "navigator", "React", "fetch"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const destinations: string[] = [], requests: string[] = [];
  const pendingLogouts: Array<(response: Response) => void> = [];
  let signOut!: () => Promise<void>, view: ReactTestRenderer | null = null;
  Object.assign(globalThis, { React, window: { location: Object.assign(new URL("https://tms.saturnusgo.com/work/"), { replace: (path: string) => destinations.push(path) }) } });
  let failLogout = false;
  globalThis.fetch = async input => {
    const path = String(input);requests.push(path);
    if (path === "/api/v1/cloud-auth/logout") return failLogout ? new Response(null, { status: 503 })
      : new Promise<Response>(resolve => pendingLogouts.push(resolve));
    return new Response(null, { status: 204 });
  };
  t.after(async () => {
    await act(async () => view?.unmount());
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    for (const [key, descriptor] of prior) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  });
  const { CloudTmsGate } = await import("../../../presentation/gate/CloudTmsGate");
  type Session = React.ComponentProps<typeof CloudTmsGate>["session"];
  const session: Session = { authenticated: true, identity: { id: "person", givenName: "Pat", familyName: "", email: "pat@example.test",
    phone: "", emailVerificationStatus: "verified", phoneVerificationStatus: "unverified" },
    workspace: { id: "personal-space", name: "Personal", slug: "personal" }, membership: { role: "workspace_admin" },
    defaultProject: { id: "project", name: "Project", slug: "project" }, defaultEnvironment: { id: "environment", name: "Environment" } };
  function Probe() { signOut = useTmsSession().signOut; return <div />; }
  async function mount(locale: "en" | "ru") {
    const context = { locale, languageTag: locale === "ru" ? "ru-RU" as const : "en-US" as const, setLocale() {}, t: () => "Loading" };
    await act(async () => { view = create(<TmsLocaleContext.Provider value={context}><CloudTmsGate apiBase="/api/v1" session={session}><Probe /></CloudTmsGate></TmsLocaleContext.Provider>); });
  }
  for (const [userAgent, origin, locale, destination] of [
    ["Electron/45 FalconDesktop/0.2.5", "https://umbrella-falcon.saturnusgo.com", "ru", "https://tms.saturnusgo.com/cloud-login/?lang=ru"],
    ["Chrome/150", "https://tms.saturnusgo.com", "en", "https://tms.saturnusgo.com/cloud-login/?lang=en"],
    ["Chrome/150", "http://localhost:3000", "ru", "http://localhost:3000/cloud-login/?lang=ru"],
  ] as const) {
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { userAgent } });
    Object.assign(window, { location: Object.assign(new URL(origin + "/work/"), { replace: (path: string) => destinations.push(path) }) });
    await mount(locale);
    const requestCount = requests.filter(path => path === "/api/v1/cloud-auth/logout").length, destinationCount = destinations.length;
    let completion!: Promise<void>;
    await act(async () => { completion = signOut();void signOut(); });
    assert.equal(requests.filter(path => path === "/api/v1/cloud-auth/logout").length, requestCount + 1);
    assert.equal(destinations.length, destinationCount, "pending logout must not navigate");
    await act(async () => { pendingLogouts.splice(0).forEach(resolve => resolve(new Response(null, { status: 204 })));await completion; });
    assert.equal(destinations[destinations.length - 1], destination);
    assert.equal(requests[requests.length - 1], "/api/v1/cloud-auth/logout");
    await act(async () => view?.unmount()); view = null;
  }
  failLogout = true;await mount("ru");
  const destinationCount = destinations.length;
  await act(async () => { await assert.rejects(signOut()); });
  assert.equal(destinations.length, destinationCount, "failed logout must not navigate");
  failLogout = false;let retry!: Promise<void>;
  await act(async () => { retry = signOut(); });
  await act(async () => { pendingLogouts.splice(0).forEach(resolve => resolve(new Response(null, { status: 204 })));await retry; });
  assert.equal(destinations.length, destinationCount + 1, "a failed logout must permit retry");
});
