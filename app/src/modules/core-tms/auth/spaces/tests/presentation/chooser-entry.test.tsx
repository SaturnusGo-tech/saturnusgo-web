import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import { DESKTOP_ATTEMPT_KEY } from "../../../continuation/desktop/attempt-storage";
import { clearBrowserDesktopAttempt } from "../../../continuation/desktop/browser-desktop-attempt";
void test("the chooser flag probes only verified spaces, is removed from the URL, and selects an explicit company", async t => {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const prior = ["window", "React", "fetch"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const calls: Array<{ path: string; init?: RequestInit }> = [], destinations: string[] = [];
  const origin = "https://tms.saturnusgo.com";
  let selectedRedirect = "https://alpha-falcon.saturnusgo.com/api/v1/auth/google/launch";
  const browser = { location: Object.assign(new URL("/cloud-login/?chooseSpace=1", origin), { assign: (target: string) => destinations.push(target) }),
    history: { state: {}, replaceState: (_state: unknown, _title: string, path: string) => { browser.location = Object.assign(new URL(path, origin), { assign: (target: string) => destinations.push(target) }); } } };
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  Object.defineProperty(globalThis, "React", { configurable: true, value: React });
  globalThis.fetch = async (url, init) => {
    const path = String(url); calls.push({ path, init });
    return Response.json({ data: path.endsWith("/select") ? { redirectUrl: selectedRedirect }
      : { spaces: [{ id: "company-1", name: "Alpha", kind: "company" }, { id: "personal-1", name: "Моё пространство", kind: "personal" }] } });
  };
  t.after(() => {
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    for (const [key, descriptor] of prior) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  });
  const { SignInFeature } = await import("../../../sign-in/composition/SignInFeature");
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "" };
  let view!: ReactTestRenderer;
  await act(async () => { view = create(<TmsLocaleContext.Provider value={locale}><SignInFeature /></TmsLocaleContext.Provider>); });
  assert.equal(browser.location.search, "");
  assert.deepEqual(calls.map(call => call.path), ["/api/v1/auth/spaces"]);
  const company = view.root.findAllByType("button").find(button => button.findAllByType("strong").some(label => label.children.includes("Alpha")));
  assert.ok(company);
  await act(async () => company.props.onClick());
  assert.deepEqual(JSON.parse(String(calls[1].init?.body)), { spaceId: "company-1" });
  assert.equal(calls[1].init?.credentials, "include"); assert.equal(calls[1].init?.redirect, "error"); assert.equal(calls[1].init?.cache, "no-store");
  assert.deepEqual(destinations, ["https://alpha-falcon.saturnusgo.com/api/v1/auth/google/launch"]);
  await act(async () => view.unmount());
  selectedRedirect = `https://alpha-falcon.saturnusgo.com/cloud-login/?workspaceId=company-1&desktopAttempt=${"a".repeat(43)}`;
  browser.location.search = "?chooseSpace=1"; destinations.length = 0;
  await act(async () => { view = create(<TmsLocaleContext.Provider value={locale}><SignInFeature /></TmsLocaleContext.Provider>); });
  const passwordCompany = view.root.findAllByType("button").find(button => button.findAllByType("strong").some(label => label.children.includes("Alpha")));
  await act(async () => passwordCompany!.props.onClick());
  assert.deepEqual(destinations, [`${selectedRedirect}&method=company&lang=en`], "choosing an invited company must open its credential form with its scoped desktop return");
  await act(async () => view.unmount());
  for (const [redirect, label, expected] of [
    [`${origin}/cloud-login/?workspaceId=owned&workspaceHandoff=1`, "Alpha", `${origin}/cloud-login/?workspaceId=owned&workspaceHandoff=1&lang=en`],
    [`${origin}/cloud-login/?workspaceId=owned&workspaceHandoff=1&desktopAttempt=${"a".repeat(43)}`, "Alpha", `${origin}/cloud-login/?workspaceId=owned&workspaceHandoff=1&desktopAttempt=${"a".repeat(43)}&lang=en`],
    [`${origin}/work/?desktopAttempt=${"a".repeat(43)}`, "My workspace", `${origin}/work/?desktopAttempt=${"a".repeat(43)}`],
  ]) {
    selectedRedirect = redirect; browser.location.search = "?chooseSpace=1"; destinations.length = 0;
    await act(async () => { view = create(<TmsLocaleContext.Provider value={locale}><SignInFeature /></TmsLocaleContext.Provider>); });
    const choice = view.root.findAllByType("button").find(button => button.findAllByType("strong").some(value => value.children.includes(label)));
    assert.ok(choice);
    await act(async () => choice.props.onClick());
    assert.deepEqual(destinations, [expected], "an owned cloud company must retain its handoff gate, and a personal desktop choice must retain its scoped attempt");
    assert.equal(new URL(destinations[0]).searchParams.has("method"), false, "personal authentication must not be recast as managed password login");
    await act(async () => view.unmount());
  }
  selectedRedirect = "https://alpha-falcon.saturnusgo.com/cloud-login/?workspaceId=company-1";
  for (const [search, expected] of [
    ["&planRequest=request_1&workspaceId=company-1", "&view=config&settings=billing&planRequest=request_1"],
    ["&planRequest=request_1&workspaceId=other", ""],
    ["&requestPlan=enterprise", "&view=config&settings=billing&requestPlan=enterprise"],
  ]) {
    browser.location.search = `?chooseSpace=1${search}`; destinations.length = 0;
    await act(async () => { view = create(<TmsLocaleContext.Provider value={locale}><SignInFeature /></TmsLocaleContext.Provider>); });
    const choice = view.root.findAllByType("button").find(button => button.findAllByType("strong").some(value => value.children.includes("Alpha")));
    await act(async () => choice!.props.onClick());
    assert.deepEqual(destinations, [`${selectedRedirect}&method=company&lang=en${expected}`]);
    await act(async () => view.unmount());
  }
});
void test("space selection sends only an unexpired current-origin desktop attempt to the server", async t => {
  const prior = Object.getOwnPropertyDescriptor(globalThis, "window"), origin = "https://tms.saturnusgo.com", attempt = "a".repeat(43);
  const values = new Map<string, string>(), bodies: unknown[] = [];
  Object.defineProperty(globalThis, "window", { configurable: true, value: { location: new URL(`${origin}/cloud-login/`),
    sessionStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) } } });
  t.after(() => { clearBrowserDesktopAttempt(); if (prior) Object.defineProperty(globalThis, "window", prior); else Reflect.deleteProperty(globalThis, "window"); });
  const { createSpaceChoiceClient } = await import("../../data/space-choice-client");
  const client = createSpaceChoiceClient(async (_url, init) => { bodies.push(JSON.parse(String(init?.body))); return Response.json({ data: { redirectUrl: `${origin}/work/` } }); });
  for (const record of [
    { version: 1, origin, attempt, createdAt: Date.now() },
    { version: 1, origin: "https://other.example", attempt, createdAt: Date.now() },
    { version: 1, origin, attempt, createdAt: Date.now() - 300_001 },
  ]) { clearBrowserDesktopAttempt(); values.set(DESKTOP_ATTEMPT_KEY, JSON.stringify(record)); await client.select("workspace-1"); }
  assert.deepEqual(bodies, [{ spaceId: "workspace-1", desktopAttempt: attempt }, { spaceId: "workspace-1" }, { spaceId: "workspace-1" }]);
});
