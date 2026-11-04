import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useTmsHttpClient } from "../../../http/TmsHttpClientContext";
import { useTmsSession } from "../../../presentation/session/TmsSessionContext";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";

void test("central workspace accepts a verified personal cookie and anonymous visitors receive method selection", async t => {
  const require = createRequire(import.meta.url);
  const css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const globals = ["window", "document", "React"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const previousFetch = globalThis.fetch;
  const previousBase = process.env.NEXT_PUBLIC_TMS_API_BASE;
  process.env.NEXT_PUBLIC_TMS_API_BASE = "https://api.example.test/api/v1";
  const location = { href: "https://tms.example.test/testcases/umbrella-home/work/", origin: "https://tms.example.test", pathname: "/testcases/umbrella-home/work/", search: "", hash: "" };
  const events = new EventTarget();
  Object.assign(globalThis, { React, document: { title: "Falcon" }, window: { location, history: { replaceState() {} },
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) } });
  t.after(() => {
    globalThis.fetch = previousFetch;
    if (previousBase !== undefined) process.env.NEXT_PUBLIC_TMS_API_BASE = previousBase; else delete process.env.NEXT_PUBLIC_TMS_API_BASE;
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    for (const [key, descriptor] of globals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  });
  const { LegacyTmsAuthBoundary } = await import("../../../presentation/boundary/LegacyTmsAuthBoundary");
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "" };
  let authenticated = false;
  let resolveTrial!: (response: Response) => void;
  const requests: string[] = [];
  globalThis.fetch = async url => {
    requests.push(String(url));
    if (String(url).endsWith("/auth/trial")) return new Promise<Response>(resolve => { resolveTrial = resolve; });
    if (String(url).endsWith("/me/profile")) return Response.json({ data: {
      id: "personal", name: "Pat QA", hasAvatar: true, version: 2, accountKind: "personal",
      avatar: { url: "https://media.example.test/avatar", expiresAt: "2099-01-01T00:00:00Z" },
    } });
    const data = String(url).endsWith("/auth/methods") ? { google: false, email: true, saml: false, signup: true }
      : authenticated ? { authenticated: true, identity: { id: "personal", givenName: "Pat", familyName: "", email: "pat@example.test", phone: "", emailVerificationStatus: "verified", phoneVerificationStatus: "unverified" },
        workspace: { id: "personal-space", name: "Pat", slug: "pat" }, membership: { role: "workspace_admin" },
        defaultProject: { id: "project", name: "First", slug: "first" }, defaultEnvironment: { id: "environment", name: "Default" } }
        : { authenticated: false };
    return Response.json({ data });
  };
  function WorkspaceProbe() {
    const http = useTmsHttpClient();
    const session = useTmsSession();
    React.useEffect(() => { void http.get("/workspaces/personal-space"); }, [http]);
    return <div data-testid="personal-workspace" data-workspace-kind={session.workspaceKind} data-role={session.workspaceRole}
      data-name={session.label} data-avatar={session.hasAvatar} />;
  }
  const view = () => <TmsLocaleContext.Provider value={locale}><LegacyTmsAuthBoundary><WorkspaceProbe /></LegacyTmsAuthBoundary></TmsLocaleContext.Provider>;
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(view()); });
  assert.ok(renderer.root.findAllByType("button").some(button => button.children.includes("Continue with email")));
  assert.equal(renderer.root.findAllByProps({ "data-testid": "personal-workspace" }).length, 0);
  await act(async () => renderer.unmount());
  authenticated = true;
  await act(async () => { renderer = create(view()); });
  assert.equal(renderer.root.findAllByProps({ "data-testid": "personal-workspace" }).length, 1);
  assert.equal(renderer.root.findByProps({ "data-testid": "personal-workspace" }).props["data-name"], "Pat QA");
  assert.equal(renderer.root.findByProps({ "data-testid": "personal-workspace" }).props["data-avatar"], true);
  assert.equal(renderer.root.findByProps({ "data-testid": "personal-workspace" }).props["data-workspace-kind"], undefined);
  await act(async () => resolveTrial(Response.json({ data: { kind: "personal", startsAt: "2026-11-04T00:00:00Z", expiresAt: "2026-11-11T00:00:00Z", readOnly: false } })));
  assert.equal(renderer.root.findByProps({ "data-testid": "personal-workspace" }).props["data-workspace-kind"], "personal");
  assert.equal(renderer.root.findByProps({ "data-testid": "personal-workspace" }).props["data-role"], "workspace_admin");
  assert.equal(requests.filter(url => url.endsWith("/auth/trial")).length, 1, "account copy reuses the existing trial request");
  assert.equal(renderer.root.findAllByType("aside").length, 1, "personal trial is visible after session restoration");
  assert.ok(requests.every(url => url.startsWith("/api/v1/") || url.startsWith(`${location.origin}/api/v1/`)));
  assert.ok(requests.includes(`${location.origin}/api/v1/workspaces/personal-space`));
  await act(async () => renderer.unmount());
});
