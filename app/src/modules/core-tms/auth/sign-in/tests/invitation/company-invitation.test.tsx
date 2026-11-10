import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";

test("company invitation fills the central workspace form and resolves it on Continue", async t => {
  const require = createRequire(import.meta.url);
  const css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const previous = ["window", "document", "React", "fetch", "navigator"].map(key => [
    key, Object.getOwnPropertyDescriptor(globalThis, key),
  ] as const);
  const origin = "https://tms.saturnusgo.com";
  const company = "umbrella-falcon.saturnusgo.com";
  const requests: Array<{ path: string; body?: unknown }> = [];
  const destinations: string[] = [];
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "" };
  let finishMethods!: (response: Response) => void;
  let view!: ReactTestRenderer;
  t.after(async () => {
    await act(async () => view?.unmount());
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  const { SignInFeature } = await import("../../composition/SignInFeature");

  async function open(url: string, userAgent = "Browser") {
    await act(async () => view?.unmount());
    requests.length = 0;
    destinations.length = 0;
    const location = Object.assign(new URL(url, origin), { assign: (target: string) => destinations.push(target) });
    Object.assign(globalThis, { React, document: { title: "Falcon" }, window: { location } });
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { userAgent } });
    globalThis.fetch = async (input, init) => {
      const path = String(input);
      requests.push({ path, ...(init?.body ? { body: JSON.parse(String(init.body)) } : {}) });
      if (path === "/api/v1/auth/methods") return new Promise<Response>(resolve => { finishMethods = resolve; });
      if (path === "/api/v1/auth/company/resolve") {
        return Response.json({ data: { redirectUrl: `https://${company}/cloud-login/?workspaceId=workspace_umbrella_home` } });
      }
      throw new Error(`Unexpected request: ${path}`);
    };
    await act(async () => {
      view = create(<TmsLocaleContext.Provider value={locale}><SignInFeature signup={location.pathname === "/signup/"} /></TmsLocaleContext.Provider>);
    });
  }

  async function loadMethods() {
    await act(async () => finishMethods(Response.json({ data: { google: true, email: true, saml: true, signup: true } })));
  }

  await open(`/cloud-login/?company=${company}&lang=en`);
  assert.deepEqual(view.root.findAllByType("input"), []);
  await loadMethods();
  const input = view.root.findAllByType("input")[0];
  assert.equal(input?.props.autoComplete, "organization");
  assert.equal(input?.props.value, company);
  assert.deepEqual(requests, [{ path: "/api/v1/auth/methods" }]);
  assert.deepEqual(destinations, []);

  await act(async () => view.root.findByType("form").props.onSubmit({ preventDefault() {} }));
  assert.deepEqual(requests[1], { path: "/api/v1/auth/company/resolve", body: { organization: company } });
  assert.deepEqual(destinations, [`https://${company}/cloud-login/?workspaceId=workspace_umbrella_home&method=company&lang=en`]);

  for (const url of [
    "/cloud-login/",
    `/cloud-login/?company=${company}&company=${company}`,
    "/cloud-login/?company=umbrella",
    "/cloud-login/?company=UmbrellaFalcon.saturnsgo.com",
    `/cloud-login/?company=https://${company}/`,
    `/cloud-login/?company=${company}.example.com`,
    `/signup/?company=${company}`,
    `https://${company}/cloud-login/?company=${company}`,
  ]) {
    await open(url);
    await loadMethods();
    const inputs = view.root.findAllByType("input");
    assert.deepEqual(inputs.map(input => input.props.type), url.startsWith("/signup/") ? ["checkbox"] : [], url);
    assert.deepEqual(requests, [{ path: "/api/v1/auth/methods" }], url);
    assert.deepEqual(destinations, [], url);
  }

  await open(`/cloud-login/?company=${company}`, "Electron/45 FalconDesktop/0.2.5");
  await loadMethods();
  assert.deepEqual(view.root.findAllByType("input"), []);
});
