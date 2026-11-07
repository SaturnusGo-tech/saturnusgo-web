import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../auth/presentation/session/TmsSessionContext";
import { TmsLocaleContext } from "../../../localization/context/TmsLocaleProvider";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const previousCss = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { BillingFeature } = require("../../composition/BillingFeature") as typeof import("../../composition/BillingFeature");
if (previousCss) require.extensions[".css"] = previousCss;
else delete require.extensions[".css"];

function button(root: ReactTestInstance, label: string) {
  return root.findAllByType("button").find(candidate => candidate.children.includes(label));
}

async function withBilling(check: (root: ReactTestInstance) => Promise<void>, failFirstRequest = false) {
  const previousEnvironment = process.env.NODE_ENV;
  Reflect.set(process.env, "NODE_ENV", "production");
  const requestPath = "/workspaces/space/plan-requests";
  const reads: string[] = [];
  const writes: string[] = [];
  const http = {
    async getResource(path: string) {
      reads.push(path);
      if (path.startsWith("/billing/summary?")) {
        return {
          data: {
            workspaceKind: "personal", canManage: false, status: "unsubscribed", planId: null,
            checkoutMode: "disabled", enabled: false, allowedCheckoutPlanIds: [], allowedChangePlanIds: [],
          },
          etag: null,
        };
      }
      assert.equal(path, requestPath);
      if (failFirstRequest && reads.filter(value => value === requestPath).length === 1) {
        throw new Error("Temporary request list failure");
      }
      return {
        data: {
          requests: [], applicant: { displayName: "QA", email: "qa@example.com" },
          workspace: { id: "space", kind: "personal", name: "My workspace" },
          access: null, eligiblePlanIds: ["individual", "startup", "enterprise"],
        },
        etag: null,
      };
    },
    async mutateResource(path: string) {
      writes.push(path);
      throw new Error("Opening the request dialog must not start checkout or submit a request.");
    },
  } as unknown as TmsHttpClient;

  let view: ReactTestRenderer | undefined;
  try {
    await act(async () => {
      view = create(
        <TmsLocaleContext.Provider value={{ locale: "en", languageTag: "en-US", setLocale() {}, t: key => key }}>
          <TmsSessionProvider value={{ kind: "cloud", subject: "cloud:owner", workspaceId: "space", workspaceKind: "personal",
            workspaceRole: "workspace_admin", label: "QA", signOut: async () => undefined }}>
            <TmsHttpClientProvider client={http}><BillingFeature workspaceId="space" /></TmsHttpClientProvider>
          </TmsSessionProvider>
        </TmsLocaleContext.Provider>,
      );
    });
    assert.ok(view);
    await check(view.root);
    assert.equal(reads.filter(path => path === requestPath).length, failFirstRequest ? 2 : 1);
    assert.equal(view.root.findAllByProps({ name: "billing-outcome" }).length, 0);
    assert.deepEqual(writes, []);
  } finally {
    await act(async () => view?.unmount());
    if (previousEnvironment === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else Reflect.set(process.env, "NODE_ENV", previousEnvironment);
  }
}

test("a production workspace admin can request Individual or Startup when checkout is disabled", async () => {
  await withBilling(async root => {
    const individualAction = button(root, "Request access");
    assert.ok(individualAction, "Production billing should show the manual request action for the Individual plan");
    assert.equal(individualAction.props.disabled, false);
    assert.ok(root.findAllByType("strong").some(node => node.children.includes("$11")));

    const otherPlans = button(root, "Other plans");
    assert.ok(otherPlans);
    await act(async () => otherPlans.props.onClick());
    const startupOption = button(root, "Startup");
    assert.ok(startupOption);
    await act(async () => startupOption.props.onClick());

    const startupAction = button(root, "Request access");
    assert.ok(startupAction);
    assert.equal(startupAction.props.disabled, false);
    assert.ok(root.findAllByType("strong").some(node => node.children.includes("$59")));
    await act(async () => startupAction.props.onClick());
    const dialog = root.findByType("dialog");
    assert.ok(dialog.findAllByType("p").some(node => node.children.includes("Access to Falcon Startup")));
  });
});

test("a production workspace admin can retry after the manual plans fail to load", async () => {
  await withBilling(async root => {
    const retry = button(root, "Retry loading plans");
    assert.ok(retry, "The failed plan request list should provide a retry action");
    assert.equal(retry.props.disabled, false);
    assert.equal(button(root, "Request access"), undefined);
    await act(async () => retry.props.onClick());

    assert.equal(button(root, "Retry loading plans"), undefined);
    const requestAccess = button(root, "Request access");
    assert.ok(requestAccess);
    assert.equal(requestAccess.props.disabled, false);
  }, true);
});
