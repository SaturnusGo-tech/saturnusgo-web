import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test, type TestContext } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";

async function discovery(t: TestContext, shell: boolean) {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const reactDom = require("react-dom"), portal = Object.getOwnPropertyDescriptor(reactDom, "createPortal")!;
  Object.defineProperty(reactDom, "createPortal", { configurable: true, value: (content: React.ReactNode) => content });
  const previous = ["window", "document", "React", "fetch"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const origin = "https://jev-falcon.saturnusgo.com", destinations: string[] = [], forms: string[] = [];
  let respond!: (response: Response) => void, mounted = 0, reads = 0, view!: ReactTestRenderer;
  const location = Object.assign(new URL("/testcases/umbrella-home/work/?workspaceId=space", origin), { replace: (path: string) => destinations.push(path) });
  Object.assign(globalThis, { React, window: { location, sessionStorage: { getItem: () => null, removeItem() {} } },
    document: { body: { style: { overflow: "" }, append() {} }, createElement(tag: string) {
      if (tag === "input") return { type: "", name: "", value: "" };
      return { action: "", method: "", hidden: false, append() {}, remove() {}, submit() { forms.push(this.action); } };
    } } });
  globalThis.fetch = async input => {
    assert.match(String(input), /\/api\/v1\/auth\/workspace-target\?workspaceId=space$/);
    reads++;
    return new Promise<Response>(resolve => { respond = resolve; });
  };
  const { AuthenticatedWorkspaceHandoff } = await import("../../composition/AuthenticatedWorkspaceHandoff");
  function Business() { React.useEffect(() => { mounted++; }, []); return <div data-business />; }
  t.after(async () => {
    await act(async () => view?.unmount());
    Object.defineProperty(reactDom, "createPortal", portal);
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    for (const [key, descriptor] of previous) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  });
  await act(async () => { view = create(<TmsLocaleContext.Provider value={{ locale: "en", languageTag: "en-US", setLocale() {}, t: key => key }}>
    <AuthenticatedWorkspaceHandoff workspaceId="space">{shell ? <Business /> : undefined}</AuthenticatedWorkspaceHandoff>
  </TmsLocaleContext.Provider>); });
  return { view, destinations, forms, mounted: () => mounted, reads: () => reads,
    ready: async (destinationOrigin = origin) => { await act(async () => respond(Response.json({ data: { workspaceId: "space", generation: 1, destinationOrigin } }))); },
    preparing: async () => { await act(async () => respond(Response.json({ error: { code: "HANDOFF_TARGET_PREPARING" } }, { status: 409 }))); } };
}

for (const shell of [false, true]) test(`unverified same-host discovery stays neutral before ${shell ? "mounting the workspace" : "returning from sign-in"}`, async t => {
  const h = await discovery(t, shell);
  assert.equal(h.reads(), 1);
  assert.equal(h.mounted(), 0);
  assert.equal(h.view.root.findAllByProps({ "data-company-wizard": true }).length, 0, "target discovery must not announce company creation or opening");
  assert.equal(h.view.root.findAllByProps({ "data-testid": "auth-session-loading" }).length, 1);
  await h.ready();
  assert.equal(h.mounted(), shell ? 1 : 0);
  assert.deepEqual(h.forms, []);
  assert.equal(h.view.root.findAllByProps({ "data-company-wizard": true }).length, 0);
  assert.deepEqual(h.destinations, shell ? [] : ["/work/?workspaceId=space&lang=en"]);
});

test("an authoritative preparing target keeps the company preparation gate ahead of the workspace", async t => {
  const h = await discovery(t, true);
  await h.preparing();
  assert.equal(h.mounted(), 0);
  assert.equal(h.view.root.findByProps({ "data-company-wizard": true }).props["data-stage"], "preparing");
  assert.match(JSON.stringify(h.view.toJSON()), /email/);
  assert.deepEqual(h.forms, []);
});

test("an authoritative different-host target keeps the opening gate ahead of the workspace", async t => {
  const h = await discovery(t, true);
  await h.ready("https://other-falcon.saturnusgo.com");
  assert.equal(h.mounted(), 0);
  assert.equal(h.view.root.findByProps({ "data-company-wizard": true }).props["data-stage"], "opening");
  assert.deepEqual(h.forms, ["https://jev-falcon.saturnusgo.com/api/v1/auth/workspace-handoffs"]);
  assert.deepEqual(h.destinations, []);
});
