import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { legalBrowser } from "../support/browser";

const origin = "https://umbrella-falcon.saturnusgo.com";
const context = "/work/?workspaceId=space&projectId=project&view=hooks&plugin=codex&lang=ru";
const desktop = "Mozilla/5.0 Electron/43 FalconDesktop/0.2.12";
const versions = { en: "# Privacy policy", ru: "# Политика конфиденциальности" };

for (const document of ["privacy", "terms", "billing"] as const) {
  test(`${document} has a visible Back and desktop brand returns to the originating Hooks context`, async t => {
    const { render } = legalBrowser(t, `${origin}/${document}/?lang=ru`, desktop, origin + context);
    const { FalconLegalPage } = await import("../../../legal/FalconLegalPage");
    const view = await render(<FalconLegalPage document={document} versions={versions} />);
    const header = view.root.findByType("header");
    const back = header.findAllByType("a").find(link => link.children.includes("Назад"));
    assert.ok(back, "the legal header must have a visible Back link");
    assert.equal(back.props.href, context);
    assert.equal(header.findAllByType("a")[0].props.href, context);
  });
}

test("desktop legal entry without trusted workspace history returns safely to /work/", async t => {
  const { render } = legalBrowser(t, `${origin}/privacy/?returnTo=https://evil.test/work/`, desktop, "https://evil.test/work/?workspaceId=other");
  const { FalconLegalPage } = await import("../../../legal/FalconLegalPage");
  const view = await render(<FalconLegalPage document="privacy" versions={versions} />);
  assert.equal(view.root.findByType("header").findAllByType("a")[0].props.href, "/work/");
});

test("browser legal brand retains the normal localized marketing destination", async t => {
  const { render } = legalBrowser(t, `${origin}/privacy/?lang=ru`, "Chrome/150", origin + context);
  const { FalconLegalPage } = await import("../../../legal/FalconLegalPage");
  const view = await render(<FalconLegalPage document="privacy" versions={versions} />);
  const header = view.root.findByType("header");
  assert.equal(header.findAllByType("a")[0].props.href, "/ru/");
  const back = header.findAllByType("a").find(link => link.children.includes("Назад"));
  assert.ok(back);
  assert.equal(back.props.href, context);
});

test("desktop trial terms expose Back and return both brand and footer to the workspace", async t => {
  const { render } = legalBrowser(t, `${origin}/trial-terms/?lang=en`, desktop, origin + context);
  const { FalconTrialTermsPage } = await import("../../../trial-terms/FalconTrialTermsPage");
  const view = await render(<FalconTrialTermsPage />);
  const header = view.root.findByType("header");
  assert.ok(header.findAllByType("a").some(link => link.children.includes("Back")));
  assert.equal(header.findAllByType("a")[0].props.href, context);
  assert.equal(view.root.findByType("footer").findAllByType("a")[1].props.href, context);
});

test("legal-to-legal and language navigation retain the workspace instead of using the previous policy as Back", async t => {
  const { browser, render } = legalBrowser(t, `${origin}/privacy/?lang=en`, desktop, origin + context);
  const { FalconLegalPage } = await import("../../../legal/FalconLegalPage");
  await render(<FalconLegalPage key="entry" document="privacy" versions={versions} />);
  for (const [index, document] of (["terms", "billing", "privacy"] as const).entries()) {
    Object.defineProperty(globalThis.document, "referrer", { configurable: true, value: `${origin}/privacy/?lang=en` });
    browser.location.href = `${origin}/${document}/?lang=${index % 2 ? "ru" : "en"}`;
    const view = await render(<FalconLegalPage key={index} document={document} versions={versions} />);
    const links = view.root.findByType("header").findAllByType("a");
    assert.equal(links[0].props.href, context);
    assert.equal(links[1].props.href, context);
  }
});
