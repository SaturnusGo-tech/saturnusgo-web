import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider, type TmsSessionIdentity } from "../../../auth/presentation/session/TmsSessionContext";
import { TmsLocaleContext } from "../../../localization/context/TmsLocaleProvider";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { summary } from "../../../billing/tests/fixtures/billing-fixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const previousCss = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { PersonalAdministrationFeature } = require("../../composition/personal/PersonalAdministrationFeature") as typeof import("../../composition/personal/PersonalAdministrationFeature");
const { ConnectedCompanyAdministrationLink: CompanyAdministrationLink } = require("../../composition/menu/CompanyAdministrationLink") as typeof import("../../composition/menu/CompanyAdministrationLink");
if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];
const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: (key: string) => key };
const identity: TmsSessionIdentity = { kind: "cloud", subject: "cloud:personal-owner", workspaceId: "space", workspaceKind: "personal", workspaceRole: "workspace_admin", label: "Pat QA", signOut: async () => undefined };
function environment() {
  const keys = ["window", "requestAnimationFrame", "cancelAnimationFrame"];
  const originals = keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const events = new EventTarget();
  let location = new URL("https://falcon.test/admin/?account=personal&workspaceId=space&projectId=project");
  Object.assign(globalThis, { window: { get location() { return location; }, history: { pushState(_a: unknown, _b: unknown, value: string) { location = new URL(value, location); } },
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), scrollTo() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {} });
  return { events, setLocation(value: string) { location = new URL(value); }, restore() { for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); } } };
}
function providers(http: TmsHttpClient, children: React.ReactNode) {
  return <TmsLocaleContext.Provider value={locale}><TmsSessionProvider value={identity}><TmsHttpClientProvider client={http}>{children}</TmsHttpClientProvider></TmsSessionProvider></TmsLocaleContext.Provider>;
}

test("personal administration requires matching session scope and live paid-owner entitlement", async () => {
  const env = environment(), requests: string[] = [];
  let entitled = false, canManage = true, view!: ReactTestRenderer;
  const http = { async getResource(path: string) { requests.push(path); return { data: path.startsWith("/billing/summary") ? { ...summary, workspaceKind: "personal", teamAdministration: entitled, canManage } : { workspaceId: "space", name: "Pat’s team" }, etag: null }; },
    async get(path: string) { requests.push(path); return { data: [], meta: { nextCursor: null } }; } } as unknown as TmsHttpClient;
  const draw = () => providers(http, <PersonalAdministrationFeature />);
  try {
    env.setLocation("https://falcon.test/admin/?account=personal&workspaceId=foreign");
    await act(async () => { view = create(draw()); });
    assert.equal(requests.length, 0); assert.equal(view.root.findAllByProps({ role: "alert" }).length, 1);
    await act(async () => view.unmount());
    env.setLocation("https://falcon.test/admin/?account=personal&workspaceId=space");
    await act(async () => { view = create(draw()); });
    assert.ok(requests.some(path => path === "/billing/summary?workspaceId=space"));
    assert.equal(requests.some(path => path.startsWith("/company")), false);
    entitled = true; canManage = false;
    await act(async () => { env.events.dispatchEvent(new CustomEvent("falcon:billing-changed", { detail: { workspaceId: "space" } })); });
    assert.equal(requests.some(path => path.startsWith("/company")), false);
    canManage = true;
    await act(async () => { env.events.dispatchEvent(new CustomEvent("falcon:billing-changed", { detail: { workspaceId: "space" } })); });
    assert.ok(requests.includes("/company"), "the actual cookie is reauthorized by the company endpoint");
    assert.ok(view.root.findAllByType("h1").some(node => node.children.includes("People")));
    assert.ok(requests.filter(path => path.startsWith("/company")).every(path => !path.includes("workspaceId")));
    assert.equal(requests.some(path => path.includes("/avatar")), false);
  } finally { await act(async () => view?.unmount()); env.restore(); }
});

test("the future connected personal company menu refreshes only after its own paid billing event", async () => {
  const env = environment();
  let entitled = false, reads = 0, view!: ReactTestRenderer;
  const http = { async getResource() { reads++; return { data: { ...summary, teamAdministration: entitled }, etag: null }; } } as unknown as TmsHttpClient;
  try {
    await act(async () => { view = create(providers(http, <CompanyAdministrationLink workspaceId="space" role="menuitem">Company administration</CompanyAdministrationLink>)); });
    assert.equal(view.root.findAllByType("a").length, 0); assert.equal(reads, 1);
    entitled = true;
    await act(async () => { env.events.dispatchEvent(new CustomEvent("falcon:billing-changed", { detail: { workspaceId: "foreign" } })); });
    assert.equal(reads, 1); assert.equal(view.root.findAllByType("a").length, 0);
    await act(async () => { env.events.dispatchEvent(new CustomEvent("falcon:billing-changed", { detail: { workspaceId: "space" } })); });
    assert.equal(reads, 2);
    const link = view.root.findByType("a");
    assert.match(link.props.href, /^\/admin\/\?account=personal&workspaceId=space/);
    assert.equal(link.props.role, "menuitem");
    entitled = false;
    await act(async () => { env.events.dispatchEvent(new CustomEvent("falcon:billing-changed", { detail: { workspaceId: "space" } })); });
    assert.equal(view.root.findAllByType("a").length, 0);
  } finally { await act(async () => view?.unmount()); env.restore(); }
});
