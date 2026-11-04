import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
void test("the chooser flag probes only verified spaces, is removed from the URL, and selects an explicit company", async t => {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const prior = ["window", "React", "fetch"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const calls: Array<{ path: string; init?: RequestInit }> = [], destinations: string[] = [];
  const origin = "https://tms.saturnusgo.com";
  const browser = { location: Object.assign(new URL("/cloud-login/?chooseSpace=1", origin), { assign: (target: string) => destinations.push(target) }),
    history: { state: {}, replaceState: (_state: unknown, _title: string, path: string) => { browser.location = Object.assign(new URL(path, origin), { assign: (target: string) => destinations.push(target) }); } } };
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  Object.defineProperty(globalThis, "React", { configurable: true, value: React });
  globalThis.fetch = async (url, init) => {
    const path = String(url); calls.push({ path, init });
    return Response.json({ data: path.endsWith("/select") ? { redirectUrl: "https://alpha-falcon.saturnusgo.com/api/v1/auth/google/launch" }
      : { spaces: [{ id: "company-1", name: "Alpha", kind: "company" }, { id: "personal-1", name: "My workspace", kind: "personal" }] } });
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
});
