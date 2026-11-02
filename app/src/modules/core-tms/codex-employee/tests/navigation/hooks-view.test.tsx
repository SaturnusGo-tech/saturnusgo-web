import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { status } from "../support/employee-fixture";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
const previous = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { HooksView } = require("../../../presentation/hooks/HooksView") as typeof import("../../../presentation/hooks/HooksView");
const { TmsHttpClientProvider } = require("../../../auth/http/TmsHttpClientContext") as typeof import("../../../auth/http/TmsHttpClientContext");
const { TmsSessionProvider } = require("../../../auth/presentation/session/TmsSessionContext") as typeof import("../../../auth/presentation/session/TmsSessionContext");
const { TmsLocaleContext } = require("../../../localization/context/TmsLocaleProvider") as typeof import("../../../localization/context/TmsLocaleProvider");
if (previous) require.extensions[".css"] = previous; else delete require.extensions[".css"];

test("catalog, detail, browser back and refresh share one resource owner", async () => {
  let current = new URL("https://company.test/?view=hooks");
  const stack = [current.href]; let index = 0; const listeners = new Set<() => void>();
  const location = { get href() { return current.href; }, get search() { return current.search; } };
  const browser = { location, history: { state: null, pushState: (_state: unknown, _unused: string, url: URL) => { current = new URL(url); stack.splice(++index); stack.push(current.href); } },
    addEventListener: (event: string, cb: () => void) => { if (event === "popstate") listeners.add(cb); },
    removeEventListener: (_event: string, cb: () => void) => listeners.delete(cb) };
  Object.defineProperty(globalThis, "window", { value: browser, configurable: true });
  let statusCalls = 0; let grantCalls = 0;
  const client = createTmsHttpClient({ apiBase: "https://company.test/api/v1", credentials: "include", fetch: async input => {
    const path = new URL(String(input)).pathname;
    if (path.endsWith("/company/agents/codex")) { statusCalls++; return Response.json({ data: status }, { headers: { etag: '"3"' } }); }
    if (path.endsWith("/profile/mcp-connections")) { grantCalls++; return Response.json({ data: [] }); }
    return new Response("{}", { status: 404 });
  } });
  const session = { kind: "managed" as const, label: "User", subject: "user", signOut: async () => {} };
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale: () => {}, t: () => "" };
  const tree = <TmsHttpClientProvider client={client}><TmsSessionProvider value={session}><TmsLocaleContext.Provider value={locale}><HooksView workspaceId="w" projectId="p" canManage capabilities={[]} connected /></TmsLocaleContext.Provider></TmsSessionProvider></TmsHttpClientProvider>;
  let view!: ReactTestRenderer;
  await act(async () => { view = create(tree); });
  assert.equal(statusCalls, 1); assert.equal(grantCalls, 1);
  const tile = view.root.findAllByType("button").find(node => node.findAllByType("strong").some(strong => strong.children.includes("Codex")))!;
  assert.ok(tile.findAllByType("span").some(span => span.children.includes("Company active")));
  act(() => tile.props.onClick());
  assert.equal(current.searchParams.get("integration"), "codex");
  assert.match(JSON.stringify(view.toJSON()), /Set up the connection/);
  assert.equal(statusCalls, 1); assert.equal(grantCalls, 1);
  await act(async () => { current = new URL(stack[--index]); listeners.forEach(listener => listener()); });
  assert.match(JSON.stringify(view.toJSON()), /All services/);
  assert.equal(statusCalls, 1); assert.equal(grantCalls, 1);
  const refresh = view.root.findByProps({ "aria-label": "Refresh" });
  await act(async () => refresh.props.onClick());
  assert.equal(statusCalls, 2); assert.equal(grantCalls, 2);
  const tileAgain = view.root.findAllByType("button").find(node => node.findAllByType("strong").some(strong => strong.children.includes("Codex")))!;
  act(() => tileAgain.props.onClick());
  await act(async () => view.unmount());
  await act(async () => { view = create(tree); });
  assert.match(JSON.stringify(view.toJSON()), /Set up the connection/);
  assert.equal(statusCalls, 3); assert.equal(grantCalls, 3);
  await act(async () => view.unmount());
});

test("tester restored connector links cannot start connector requests or expose controls", async () => {
  for (const integration of ["youtrack", "swagger", "jira", "codex"]) {
    const current = new URL(`https://company.test/?view=hooks&integration=${integration}`);
    Object.defineProperty(globalThis, "window", { value: { location: current, addEventListener() {}, removeEventListener() {} }, configurable: true });
    const calls: string[] = [];
    const client = createTmsHttpClient({ apiBase: "https://company.test/api/v1", credentials: "include", fetch: async input => {
      const path = new URL(String(input)).pathname; calls.push(path);
      if (path.endsWith("/company/agents/codex")) return Response.json({ data: status }, { headers: { etag: '"3"' } });
      if (path.endsWith("/profile/mcp-connections")) return Response.json({ data: [] });
      return new Response("{}", { status: 403 });
    } });
    const session = { kind: "managed" as const, companyCapabilities: ["core", "integrations"], label: "Tester", subject: "user", signOut: async () => {} };
    const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale: () => {}, t: () => "" };
    let view!: ReactTestRenderer;
    await act(async () => { view = create(<TmsHttpClientProvider client={client}><TmsSessionProvider value={session}><TmsLocaleContext.Provider value={locale}><HooksView workspaceId="w" projectId="p" canManage={false} capabilities={["integration:read"]} connected /></TmsLocaleContext.Provider></TmsSessionProvider></TmsHttpClientProvider>); });
    assert.ok(calls.every(path => path.endsWith("/company/agents/codex") || path.endsWith("/profile/mcp-connections")), calls.join(", "));
    assert.equal(JSON.stringify(view.toJSON()).includes("Set up the connection"), integration === "codex");
    await act(async () => view.unmount());
  }
});

test("profile connect URL reaches setup and a core-only denial stays actionable", async () => {
  for (const entitled of [true, false]) {
    Object.defineProperty(globalThis, "window", { value: { location: new URL(status.connectUrl), addEventListener() {}, removeEventListener() {} }, configurable: true });
    const calls: string[] = [];
    const client = createTmsHttpClient({ apiBase: "https://company.test/api/v1", credentials: "include", fetch: async input => {
      const path = new URL(String(input)).pathname; calls.push(path);
      if (path.endsWith("/company/agents/codex")) return entitled ? Response.json({ data: status }, { headers: { etag: '"3"' } }) : Response.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
      if (path.endsWith("/profile/mcp-connections")) return Response.json({ data: [] });
      return new Response("{}", { status: 403 });
    } });
    const session = { kind: "managed" as const, companyCapabilities: entitled ? ["core", "integrations"] : ["core"], label: "Tester", subject: "user", signOut: async () => {} };
    const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale: () => {}, t: () => "" };
    let view!: ReactTestRenderer;
    await act(async () => { view = create(<TmsHttpClientProvider client={client}><TmsSessionProvider value={session}><TmsLocaleContext.Provider value={locale}><HooksView workspaceId="w" projectId="p" canManage={false} capabilities={["integration:read"]} connected /></TmsLocaleContext.Provider></TmsSessionProvider></TmsHttpClientProvider>); });
    const rendered = JSON.stringify(view.toJSON());
    if (entitled) assert.match(rendered, /Set up the connection/);
    else { assert.match(rendered, /Refresh|Retry/); assert.doesNotMatch(rendered, /Set up the connection/); }
    assert.ok(calls.every(path => path.endsWith("/company/agents/codex") || path.endsWith("/profile/mcp-connections")));
    await act(async () => view.unmount());
  }
});
