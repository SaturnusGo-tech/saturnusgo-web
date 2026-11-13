import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act } from "react-test-renderer";
import { legalBrowser } from "../support/browser";
import { PUBLIC_WORKSPACE_RETURN_KEY } from "../../model/workspace-return";

const origin = "https://umbrella-falcon.saturnusgo.com";
const context = "/work/?workspaceId=space&projectId=project&view=product-docs&docId=document&docVersion=2&docSection=procedure";

test("leaving the workspace stores the latest selectors and legal navigation retains them", async t => {
  const { browser, values, render } = legalBrowser(t, origin + "/work/?workspaceId=space", "FalconDesktop/0.2.12");
  const { PublicNavigationTracker } = await import("../../browser/PublicNavigationTracker");
  await render(<PublicNavigationTracker />);
  browser.location.href = origin + context;
  browser.dispatchEvent(new Event("click"));
  assert.equal(values.get(PUBLIC_WORKSPACE_RETURN_KEY), context);
  browser.location.href = origin + "/privacy/?lang=en";
  browser.dispatchEvent(new Event("pagehide"));
  assert.equal(values.get(PUBLIC_WORKSPACE_RETURN_KEY), context, "related documents must not replace the workspace return");
  const { FalconLegalPage } = await import("../../../legal/FalconLegalPage");
  const view = await render(<FalconLegalPage document="privacy" versions={{ en: "# Privacy", ru: "# Конфиденциальность" }} />);
  assert.equal(view.root.findByType("header").findAllByType("a")[0].props.href, context);
  await act(async () => { browser.location.search = "?lang=ru"; browser.dispatchEvent(new Event("popstate")); });
  const back = view.root.findByType("header").findAllByType("a").find(link => link.children.includes("Назад"));
  assert.equal(back?.props.href, context, "language changes must retain the selected document");
});

test("storage denial leaves a usable workspace fallback", async t => {
  const { browser, render } = legalBrowser(t, origin + "/terms/?returnTo=//evil.test", "FalconDesktop/0.2.12-beta.1");
  browser.sessionStorage.getItem = () => { throw new Error("Storage denied"); };
  browser.sessionStorage.setItem = () => { throw new Error("Storage denied"); };
  const { FalconLegalPage } = await import("../../../legal/FalconLegalPage");
  const view = await render(<FalconLegalPage document="terms" versions={{ en: "# Terms", ru: "# Условия" }} />);
  const header = view.root.findByType("header");
  assert.equal(header.findAllByType("a")[0].props.href, "/work/");
  assert.equal(header.findAllByType("a").find(link => link.children.includes("Back"))?.props.href, "/work/");
});

test("forged stored navigation never becomes a legal page return target", async t => {
  const { values, render } = legalBrowser(t, origin + "/privacy/", "FalconDesktop/0.2.12");
  values.set(PUBLIC_WORKSPACE_RETURN_KEY, "https://evil.test/work/?workspaceId=stolen");
  const { FalconLegalPage } = await import("../../../legal/FalconLegalPage");
  const view = await render(<FalconLegalPage document="privacy" versions={{ en: "# Privacy", ru: "# Конфиденциальность" }} />);
  assert.equal(view.root.findByType("header").findAllByType("a")[0].props.href, "/work/");
});
