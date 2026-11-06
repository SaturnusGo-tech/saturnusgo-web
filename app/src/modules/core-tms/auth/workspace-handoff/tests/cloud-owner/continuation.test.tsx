import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import { CONTINUATION_KEY } from "../../../continuation/application/continuation-storage";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const previousCss = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { WorkspaceMfaHandoff } = require("../../composition/WorkspaceMfaHandoff") as typeof import("../../composition/WorkspaceMfaHandoff");
if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];

for (const mode of ["owner", "foreign", "unavailable", "anonymous", "preparing"] as const) test(`company handoff marker verifies the cloud owner before transfer: ${mode}`, async () => {
  const previousFetch = globalThis.fetch, previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const calls: string[] = [], destinations: string[] = [];
  const values = new Map([[CONTINUATION_KEY, JSON.stringify({ version: 1, origin: "https://tms.saturnusgo.com", createdAt: Date.now(),
    path: "/testcases/umbrella-home/work/?workspaceId=space&view=config&settings=billing" })]]);
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    location: { href: "https://tms.saturnusgo.com/cloud-login/?workspaceId=space&workspaceHandoff=1", origin: "https://tms.saturnusgo.com", pathname: "/cloud-login/", search: "?workspaceId=space&workspaceHandoff=1", hash: "", replace: (url: string) => destinations.push(url) },
    sessionStorage: { getItem: (key: string) => values.get(key) ?? null, removeItem: (key: string) => values.delete(key) },
  } });
  globalThis.fetch = async input => {
    const path = String(input); calls.push(path);
    if (path.endsWith("/cloud-auth/session")) return mode === "unavailable" ? Response.json({ error: {} }, { status: 503 }) : Response.json({ data: mode === "anonymous" ? { authenticated: false } : { authenticated: true, workspace: { id: mode === "foreign" ? "other" : "space" } } });
    if (path.includes("/auth/workspace-target?")) return mode === "preparing" ? Response.json({error:{code:"HANDOFF_TARGET_PREPARING"}},{status:409}) : Response.json({ data: { workspaceId: "space", generation: 1, destinationOrigin: "https://tms.saturnusgo.com" } });
    return Response.json({ data: { available: false } });
  };
  let view!: ReactTestRenderer;
  try {
    await act(async () => { view = create(<TmsLocaleContext.Provider value={{ locale: "en", languageTag: "en-US", setLocale() {}, t: key => key }}><WorkspaceMfaHandoff workspaceId="space" /></TmsLocaleContext.Provider>); });
    assert.equal(calls[0], "/api/v1/cloud-auth/session");
    assert.equal(calls.some(path => new URL(path,"https://tms.saturnusgo.com").pathname.endsWith("/auth/entrypoint")), mode === "anonymous", "only anonymous cloud proof may fall back to managed access");
    assert.equal(calls.filter(path => path.includes("/auth/workspace-target?")).length, mode === "owner" || mode === "preparing" ? 1 : 0);
    assert.deepEqual(destinations, mode === "owner" ? ["/work/?workspaceId=space&lang=en"] : []);
    assert.equal(values.has(CONTINUATION_KEY), mode !== "owner" && mode !== "preparing", "only verified handoff discards the stale billing continuation");
    if (mode === "preparing") {
      assert.equal(view.root.findByProps({"data-company-wizard":true}).props["data-stage"],"preparing");
      assert.match(JSON.stringify(view.toJSON()),/Preparing your company|email/);
      assert.equal(view.root.findAllByProps({role:"alert"}).length,0);
    } else if (mode !== "owner") assert.equal(view.root.findAllByProps({ role: "alert" }).length > 0, true);
  } finally {
    await act(async () => view?.unmount()); globalThis.fetch = previousFetch;
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow); else Reflect.deleteProperty(globalThis, "window");
  }
});
