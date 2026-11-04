import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
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
