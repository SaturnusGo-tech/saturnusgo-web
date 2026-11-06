import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test, type TestContext } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import { DESKTOP_ATTEMPT_KEY } from "../../../continuation/desktop/attempt-storage";
import { clearBrowserDesktopAttempt } from "../../../continuation/desktop/browser-desktop-attempt";

async function page(t: TestContext, managed: boolean) {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const reactDom = require("react-dom"), portal = Object.getOwnPropertyDescriptor(reactDom, "createPortal")!;
  Object.defineProperty(reactDom, "createPortal", { configurable: true, value: (content: React.ReactNode) => content });
  const previous = ["window", "document", "React", "fetch"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  clearBrowserDesktopAttempt();
  const origin = "https://tms.saturnusgo.com", attempt = "a".repeat(43), destinations: string[] = [], forms: { action: string; fields: Record<string,string> }[] = [];
  const values = new Map([[DESKTOP_ATTEMPT_KEY, JSON.stringify({ version: 1, origin, createdAt: Date.now(), attempt })]]);
  const location = (path: string) => Object.assign(new URL(path, origin), { replace: (path: string) => destinations.push(path) });
  const browser = Object.assign(new EventTarget(), { location: location("/cloud-login/?workspaceId=space&workspaceHandoff=1"),
    setTimeout, clearTimeout, setInterval, clearInterval, history: { state: {}, replaceState(_state: unknown, _title: string, path: string) { browser.location = location(path); } },
    sessionStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) } });
  const document = Object.assign(new EventTarget(), { visibilityState: "visible", body: { style: { overflow: "" }, append() {} }, createElement(tag: string) {
    if(tag==="input")return {type:"",name:"",value:""};
    const fields: Record<string,string>={};return {action:"",method:"",hidden:false,append(input:{name:string;value:string}){fields[input.name]=input.value;},remove(){},submit(){forms.push({action:this.action,fields});}};
  } });
  Object.assign(globalThis, { React, window: browser, document });
  let respond!: (response: Response) => void, reads = 0, view!: ReactTestRenderer;
  globalThis.fetch = async input => {
    const path = new URL(String(input), origin).pathname;
    if (path.endsWith("/cloud-auth/session")) return Response.json({ data: managed ? { authenticated: false } : {
      authenticated: true, identity: { id: "owner", givenName: "Owner", familyName: "", email: "owner@example.test", phone: "", emailVerificationStatus: "verified", phoneVerificationStatus: "unverified" },
      workspace: { id: "space", name: "Team", slug: "team" }, membership: { role: "workspace_admin" },
      defaultProject: { id: "project", name: "Project", slug: "project" }, defaultEnvironment: { id: "env", name: "Default" } } });
    if (path.endsWith("/auth/entrypoint")) return Response.json({ data: { name: "Team", hostname: "tms.saturnusgo.com", audience: "tenant", available: true, accessContact: "" } });
    if (path.endsWith("/auth/session")) return Response.json({ data: { authenticated: true, stage: "authenticated", audience: "tenant", workspaceId: "space", capabilities: [], expiresAt: new Date(Date.now() + 3600000).toISOString(),
      identity: { id: "tester", name: "Tester", login: "tester", email: "tester@example.test", emailVerified: true, phone: "", role: "tester", owner: false, hasAvatar: false, version: 1 } } });
    assert.match(path, /\/auth\/workspace-target$/); reads++;
    return new Promise<Response>(resolve => { respond = resolve; });
  };
  const { WorkspaceMfaHandoff } = await import("../../composition/WorkspaceMfaHandoff");
  t.after(async () => {
    await act(async () => view?.unmount()); clearBrowserDesktopAttempt(); Object.defineProperty(reactDom, "createPortal", portal);
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    for (const [key, descriptor] of previous) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  });
  await act(async () => { view = create(<TmsLocaleContext.Provider value={{ locale: "en", languageTag: "en-US", setLocale() {}, t: key => key }}>
    <WorkspaceMfaHandoff workspaceId="space" /></TmsLocaleContext.Provider>); });
  return { view, values, destinations, forms, reads: () => reads, attempt,
    resolve: async (response: Response) => { await act(async () => respond(response)); } };
}
for (const managed of [false, true]) for (const preparing of [false, true]) test(`${managed ? "managed" : "cloud"} desktop handoff waits for authoritative ${preparing ? "preparation" : "readiness"}`, async t => {
  const h = await page(t, managed);
  assert.equal(h.reads(), 1, "workspace discovery must precede consuming the desktop attempt");
  assert.deepEqual(h.destinations, []); assert.equal(h.values.has(DESKTOP_ATTEMPT_KEY), true);
  await h.resolve(preparing ? Response.json({ error: { code: "HANDOFF_TARGET_PREPARING" } }, { status: 409 })
    : Response.json({ data: { workspaceId: "space", generation: 1, destinationOrigin: "https://tms.saturnusgo.com" } }));
  assert.deepEqual(h.destinations, preparing ? [] : [`/api/v1/auth/desktop/authorize?attempt=${h.attempt}${managed ? "&workspaceId=space" : ""}`]);
  assert.equal(h.values.has(DESKTOP_ATTEMPT_KEY), preparing);
  if (preparing) assert.equal(h.view.root.findByProps({ "data-company-wizard": true }).props["data-stage"], "preparing");
});
test("a central desktop attempt survives a verified company handoff without relying on target-host storage", async t => {
  const h=await page(t,false);
  assert.equal(h.reads(),1);assert.deepEqual(h.forms,[]);assert.deepEqual(h.destinations,[]);
  await h.resolve(Response.json({data:{workspaceId:"space",generation:1,destinationOrigin:"https://jev-falcon.saturnusgo.com"}}));
  assert.deepEqual(h.forms,[{action:"https://tms.saturnusgo.com/api/v1/auth/workspace-handoffs",fields:{
    workspaceId:"space",destinationOrigin:"https://jev-falcon.saturnusgo.com",locale:"en",
    route:`/api/v1/auth/desktop/authorize?attempt=${h.attempt}&workspaceId=space`}}]);
  assert.deepEqual(h.destinations,[]);assert.equal(h.values.has(DESKTOP_ATTEMPT_KEY),true);
});
