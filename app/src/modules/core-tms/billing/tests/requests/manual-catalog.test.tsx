import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../auth/presentation/session/TmsSessionContext";
import type { PlanRequest } from "../../requests/domain/plan-request";
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

async function withBilling(check: (root: ReactTestInstance) => Promise<void>, {
  workspaceKind = "personal", failFirstRequest = false, denyRequests = false, request,
}: { workspaceKind?: "company" | "personal"; failFirstRequest?: boolean; denyRequests?: boolean; request?: PlanRequest } = {}) {
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
      if (denyRequests) {
        throw new TmsApiError("The plan request could not be completed.", 403, null, "PLAN_REQUEST_FORBIDDEN" as TmsApiError["code"]);
      }
      if (failFirstRequest && reads.filter(value => value === requestPath).length === 1) {
        throw new Error("Temporary request list failure");
      }
      return {
        data: {
          requests: request ? [request] : [], applicant: { displayName: "QA", email: "qa@example.com" },
          workspace: { id: "space", kind: workspaceKind, name: "Моё пространство" },
          access: null, eligiblePlanIds: workspaceKind === "company" ? ["enterprise"] : ["individual", "startup", "enterprise"],
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
          <TmsSessionProvider value={{ kind: workspaceKind === "company" ? "managed" : "cloud", subject: "owner", workspaceId: "space", workspaceKind,
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
    assert.ok(dialog.findAllByType("span").some(node => node.children.includes("Startup")));
    assert.ok(dialog.findAllByType("dd").some(node => node.children.includes("My workspace")));
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
  }, { failFirstRequest: true });
});

test("a company admin denied plan requests can contact Falcon about Enterprise without retrying the request", async () => {
  await withBilling(async root => {
    assert.equal(button(root, "Retry loading plans"), undefined);
    const contact = button(root, "Contact us");
    assert.ok(contact);
    await act(async () => contact.props.onClick());
    const dialog = root.findByType("dialog");
    assert.equal(dialog.findAllByProps({ "aria-label": "Copy email address" }).length, 1);
    assert.ok(dialog.findAllByType("a").some(link => new URL(link.props.href).hostname === "mail.google.com"));
    assert.equal(button(dialog, "Send request"), undefined);
  }, { workspaceKind: "company", denyRequests: true });
});

test("an eligible company admin can still open the Enterprise request form", async () => {
  await withBilling(async root => {
    const contact = button(root, "Contact us");
    assert.ok(contact);
    await act(async () => contact.props.onClick());
    const dialog = root.findByType("dialog");
    const send = button(dialog, "Send request");
    assert.ok(send);
    assert.equal(send.props.disabled, false);
    assert.ok(dialog.findAllByType("dd").some(node => node.children.includes("Моё пространство")));
  }, { workspaceKind: "company" });
});

test("the request status keeps withdrawal behind explicit management and confirmation", async () => {
  const request: PlanRequest = {
    id: "request_internal_id", reference: "FR-private", planId: "individual", status: "requested",
    locale: "en", workspaceId: "space", workspaceName: "Моё пространство", workspaceKind: "personal",
    applicantName: "QA", applicantEmail: "qa@example.com", note: null,
    createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z", version: 1,
    activationExpiresAt: null, accessEndsAt: null, setupId: null, companyHostname: null, preparationError: null,
    actions: ["withdraw"],
  };
  await withBilling(async root => {
    const open = button(root, "View Individual request");
    assert.ok(open);
    await act(async () => open.props.onClick());
    const dialog = root.findByType("dialog");
    assert.ok(button(dialog, "Done"));
    assert.ok(!dialog.findAll(node => node.children.some(child => typeof child === "string" && /FR-private|request_internal_id/.test(child))).length);
    assert.equal(button(dialog, "Withdraw request"), undefined);
    const manage = button(dialog, "Manage request");
    assert.ok(manage);
    await act(async () => manage.props.onClick());
    assert.ok(button(dialog, "Withdraw request"));
    const keep = button(dialog, "Keep request");
    assert.ok(keep);
    await act(async () => keep.props.onClick());
    assert.equal(button(dialog, "Withdraw request"), undefined);
  }, { request });
});
