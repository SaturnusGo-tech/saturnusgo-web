import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import type { CloudSession } from "../../../cloud/cloud-auth-client";
import { rememberBrowserContinuation } from "../../application/browser-continuation";
import { CONTINUATION_KEY } from "../../application/continuation-storage";
void test("an explicit current MCP interaction wins over a previous pending continuation", async t => {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const prior = ["window", "React"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const origin = "https://alpha-falcon.example.test", destinations: string[] = [];
  const values = new Map([[CONTINUATION_KEY, JSON.stringify({ version: 1, origin, createdAt: Date.now(), path: "/testcases/umbrella-home/work/?caseId=old-case" })]]);
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    location: Object.assign(new URL("/testcases/umbrella-home/work/?falconMcpInteraction=currentConsent", origin), { replace: (target: string) => destinations.push(target) }),
    sessionStorage: { getItem: (key: string) => values.get(key) ?? null, removeItem: (key: string) => values.delete(key) },
  } });
  Object.defineProperty(globalThis, "React", { configurable: true, value: React });
  t.after(() => {
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    for (const [key, descriptor] of prior) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  });
  const { AuthContinuation } = await import("../../composition/AuthContinuation");
  const { ManagedOAuthResume } = await import("../../../managed/oauth/ManagedOAuthResume");
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "Loading" };
  let view!: ReturnType<typeof create>;
  await act(async () => { view = create(<TmsLocaleContext.Provider value={locale}><AuthContinuation workspaceId="alpha"><ManagedOAuthResume><div /></ManagedOAuthResume></AuthContinuation></TmsLocaleContext.Provider>); });
  assert.deepEqual(destinations, ["/api/v1/falcon-oauth/interaction/currentConsent"]);
  assert.equal(values.has(CONTINUATION_KEY), false);
  await act(async () => view.unmount());
});

void test("ordinary sign-in still restores the same-workspace checkout continuation", async t => {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const prior = ["window", "React"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const origin = "https://tms.saturnusgo.com", destinations: string[] = [];
  const path = "/testcases/umbrella-home/work/?workspaceId=space&view=config&settings=billing";
  const values = new Map([[CONTINUATION_KEY, JSON.stringify({ version: 1, origin, createdAt: Date.now(), path })]]);
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    location: Object.assign(new URL("/cloud-login/", origin), { replace: (target: string) => destinations.push(target) }),
    sessionStorage: { getItem: (key: string) => values.get(key) ?? null, removeItem: (key: string) => values.delete(key) },
  } });
  Object.defineProperty(globalThis, "React", { configurable: true, value: React });
  t.after(() => {
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    for (const [key, descriptor] of prior) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  });
  const { AuthContinuation } = await import("../../composition/AuthContinuation");
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "Loading" };
  let view!: ReturnType<typeof create>;
  await act(async () => { view = create(<TmsLocaleContext.Provider value={locale}><AuthContinuation workspaceId="space"><div data-company-content /></AuthContinuation></TmsLocaleContext.Provider>); });
  assert.deepEqual(destinations, ["/work/?workspaceId=space&view=config&settings=billing"]);
  assert.equal(values.has(CONTINUATION_KEY), false);
  assert.equal(view.root.findAllByProps({ "data-company-content": true }).length, 0);
  await act(async () => view.unmount());
});

void test("resumes the company MCP consent after a Google return with a cloud session", async t => {
  const require = createRequire(import.meta.url);
  const css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const globals = ["window", "document", "React", "fetch"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const origin = "https://alpha-falcon.saturnusgo.com";
  const interactionPath = "/work/?falconMcpInteraction=codex_consent";
  const destinations: string[] = [];
  const values = new Map<string, string>();
  const location = (path: string) => Object.assign(new URL(path, origin), { replace: (target: string) => destinations.push(target) });
  const browser = Object.assign(new EventTarget(), {
    location: location(interactionPath),
    history: { replaceState(_state: unknown, _title: string, path: string) { browser.location = location(path); } },
    sessionStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
  Object.assign(globalThis, { React, window: browser, document: {
    title: "Falcon", querySelector: () => ({ getAttribute: () => "managed" }),
  } });
  let view: ReactTestRenderer | undefined;
  t.after(async () => {
    await act(async () => view?.unmount());
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    for (const [key, descriptor] of globals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
    }
  });

  const session: CloudSession = {
    authenticated: true, workspaceHandoff: true,
    identity: { id: "qa", givenName: "QA", familyName: "", email: "qa@example.test", phone: "", emailVerificationStatus: "verified", phoneVerificationStatus: "unverified" },
    workspace: { id: "alpha", name: "Alpha", slug: "alpha" },
    membership: { role: "workspace_admin" },
    defaultProject: { id: "project", name: "Alpha", slug: "alpha" },
    defaultEnvironment: { id: "environment", name: "Default" },
  };
  const writes: string[] = [];
  globalThis.fetch = async (input, init) => {
    const { pathname } = new URL(String(input), origin);
    if (init?.method && init.method !== "GET") writes.push(pathname);
    if (pathname === "/api/v1/auth/session") return Response.json({ data: { authenticated: false, stage: "anonymous" } });
    if (pathname === "/api/v1/cloud-auth/session") return Response.json({ data: session });
    if (pathname === "/api/v1/auth/workspace-target") {
      return Response.json({ data: { workspaceId: "alpha", destinationOrigin: origin, generation: 1 } });
    }
    return Response.json({ error: {} }, { status: 404 });
  };
  const { TmsAuthBoundary } = await import("../../../presentation/boundary/TmsAuthBoundary");
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "" };
  const workspace = () => <TmsLocaleContext.Provider value={locale}>
    <TmsAuthBoundary><div data-testid="workspace" /></TmsAuthBoundary>
  </TmsLocaleContext.Provider>;

  rememberBrowserContinuation();
  browser.location = location("/work/");
  await act(async () => { view = create(workspace()); });
  assert.deepEqual(destinations, [interactionPath]);
  await act(async () => view?.unmount());

  browser.location = location(interactionPath);
  await act(async () => { view = create(workspace()); });
  assert.deepEqual(destinations, [interactionPath, "/api/v1/falcon-oauth/interaction/codex_consent"]);
  assert.equal(view!.root.findAllByProps({ "data-testid": "workspace" }).length, 0);
  assert.deepEqual(writes, []);
});
