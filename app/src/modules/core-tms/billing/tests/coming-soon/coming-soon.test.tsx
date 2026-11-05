import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../auth/presentation/session/TmsSessionContext";
import { TmsLocaleContext } from "../../../localization/context/TmsLocaleProvider";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const previousCss = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { BillingFeature } = require("../../composition/BillingFeature") as typeof import("../../composition/BillingFeature");
const { BillingPlanLink } = require("../../composition/menu/BillingPlanLink") as typeof import("../../composition/menu/BillingPlanLink");
const { CompanyAdministrationLink } = require("../../../company-administration/composition/menu/CompanyAdministrationLink") as typeof import("../../../company-administration/composition/menu/CompanyAdministrationLink");
if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];

function providers(locale: "ru" | "en", http: TmsHttpClient, child: React.ReactNode, administrationPath?: string) {
  return <TmsLocaleContext.Provider value={{ locale, languageTag: locale === "ru" ? "ru-RU" : "en-US", setLocale() {}, t: key => key }}>
    <TmsSessionProvider value={{ kind: "cloud", subject: "cloud:owner", workspaceId: "space", workspaceKind: "personal", workspaceRole: "workspace_admin", label: "QA owner", administrationPath, signOut: async () => undefined }}>
      <TmsHttpClientProvider client={http}>{child}</TmsHttpClientProvider>
    </TmsSessionProvider>
  </TmsLocaleContext.Provider>;
}
for (const locale of ["en", "ru"] as const) test(`coming-soon ${locale} catalog never mounts billing services or enables any conversion action`, async () => {
  let requests = 0, closed = 0, view!: ReactTestRenderer;
  const fail = async () => { requests++; throw new Error("Disabled billing must not make requests"); };
  const http = { get: fail, getResource: fail, mutate: fail, mutateResource: fail, binary: fail, stream: fail } as TmsHttpClient;
  const previousFetch = globalThis.fetch;
  globalThis.fetch = fail;
  try {
    await act(async () => { view = create(providers(locale, http, <BillingFeature workspaceId="space" preview onClose={() => closed++} />)); });
    const text = () => JSON.stringify(view.toJSON());
    const subtitle = locale === "ru" ? "Оплата скоро станет доступна" : "Payments are coming soon";
    for (const id of ["individual", "startup", "enterprise"]) {
      if (id !== "individual") {
        await act(async () => { view.root.findByProps({ "aria-controls": "billing-other-plans" }).props.onClick(); });
        await act(async () => { view.root.findByProps({ "data-view-plan": id }).props.onClick(); });
      }
      const action = view.root.findByProps({ "data-plan": id });
      assert.equal(action.type, "button"); assert.equal(action.props.disabled, true);
      assert.equal(action.props.href, undefined); assert.equal(action.props.onClick, undefined);
      assert.ok(text().includes(subtitle));
      assert.equal(view.root.findAllByType("a").length, 0);
      assert.equal(view.root.findAllByType("input").length, 0);
      assert.equal(view.root.findAll(node => typeof node.type === "function" && ["ConnectedBillingFeature", "BillingScreen", "BillingConfirmation", "BillingCurrent"].includes(node.type.name)).length, 0);
      if (id === "individual") assert.ok(text().includes("11"));
      if (id === "startup") { assert.ok(text().includes("59")); assert.ok(text().includes(locale === "ru" ? "5 мест" : "5 seats")); }
      if (id === "enterprise") { assert.ok(!text().includes("249")); assert.ok(!text().includes("25 seats")); }
      assert.ok(!text().includes("Review and confirm your subscription"));
      assert.equal(requests, 0);
    }
    await act(async () => { view.root.findByProps({ "aria-label": locale === "ru" ? "Закрыть тарифы" : "Close plans" }).props.onClick(); });
    assert.equal(closed, 1);
  } finally { await act(async () => view?.unmount()); globalThis.fetch = previousFetch; }
});
test("the disabled release account link stays neutral and makes no summary request", async () => {
  let requests = 0, view!: ReactTestRenderer;
  const fail = async () => { requests++; throw new Error("No summary requests before launch"); };
  const http = { get: fail, getResource: fail, mutate: fail, mutateResource: fail } as TmsHttpClient;
  for (const locale of ["en", "ru"] as const) {
    try {
      await act(async () => { view = create(providers(locale, http, <BillingPlanLink role="menuitem" workspaceId="space" enabled />)); });
      const link = view.root.findByType("a");
      assert.deepEqual(link.children, [locale === "ru" ? "Посмотреть тарифы" : "View plans"]);
      assert.equal(link.props.role, "menuitem"); assert.match(link.props.href, /workspaceId=space/);
      assert.equal(requests, 0);
    } finally { await act(async () => view?.unmount()); }
  }
});
test("profile menu links make no billing reads and preserve the existing company administration destination", async () => {
  let requests = 0, view!: ReactTestRenderer;
  const fail = async () => { requests++; throw new Error("No billing reads from the disabled profile menu"); };
  const http = { get: fail, getResource: fail, mutate: fail, mutateResource: fail } as TmsHttpClient;
  for (const administrationPath of [undefined, "/admin/"]) {
    try {
      await act(async () => { view = create(providers("en", http, <><BillingPlanLink workspaceId="space" enabled /><CompanyAdministrationLink workspaceId="space" enabled>Company administration</CompanyAdministrationLink></>, administrationPath)); });
      const admin = view.root.findAllByType("a").find(node => node.children.includes("Company administration"));
      assert.equal(admin?.props.href, administrationPath);
      assert.equal(requests, 0);
    } finally { await act(async () => view?.unmount()); }
  }
});
