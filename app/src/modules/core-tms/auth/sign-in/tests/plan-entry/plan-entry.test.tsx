import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";

test("plan entry opens billing for a verified matching workspace and retains sign-in otherwise", async t => {
  const require = createRequire(import.meta.url);
  const css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const previous = ["window", "document", "React", "fetch"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const { SignInFeature } = await import("../../composition/SignInFeature");
  const origin = "https://tms.saturnusgo.com";
  const destinations: string[] = [], requests: string[] = [];
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "" };
  let view: ReactTestRenderer | undefined;
  t.after(async () => {
    await act(async () => view?.unmount());
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });

  async function open(path: string, activeWorkspace: string | null) {
    await act(async () => view?.unmount());
    destinations.length = 0;
    requests.length = 0;
    const location = Object.assign(new URL(path, origin), { replace: (target: string) => destinations.push(target) });
    Object.assign(globalThis, { React, document: { title: "Falcon" }, window: Object.assign(new EventTarget(), { location }) });
    globalThis.fetch = async input => {
      const request = String(input);
      requests.push(request);
      if (request === "/api/v1/cloud-auth/session") {
        return Response.json({ data: activeWorkspace
          ? { authenticated: true, workspace: { id: activeWorkspace } }
          : { authenticated: false } });
      }
      if (request === "/api/v1/auth/methods") return Response.json({ data: { google: true, email: true, saml: true, signup: true } });
      throw new Error(`Unexpected request: ${request}`);
    };
    await act(async () => { view = create(<TmsLocaleContext.Provider value={locale}><SignInFeature signup={path.startsWith("/signup/")} /></TmsLocaleContext.Provider>); });
  }

  await open("/cloud-login/?planRequest=request_1&workspaceId=space_1&lang=ru", "space_1");
  assert.deepEqual(requests, ["/api/v1/cloud-auth/session"]);
  assert.deepEqual(destinations, ["/work/?workspaceId=space_1&view=config&settings=billing&planRequest=request_1&lang=ru"]);

  await open("/signup/?requestPlan=startup", "space_2");
  assert.deepEqual(requests, ["/api/v1/cloud-auth/session"]);
  assert.deepEqual(destinations, ["/work/?workspaceId=space_2&view=config&settings=billing&requestPlan=startup&lang=en"]);

  await open("/cloud-login/?planRequest=request_1&workspaceId=space_1", "other");
  assert.deepEqual(destinations, []);
  assert.ok(requests.includes("/api/v1/auth/methods"));

  await open("/cloud-login/?requestPlan=individual", null);
  assert.deepEqual(destinations, []);
  const signUp = view?.root.findAllByType("a").find(link => String(link.props.href).startsWith("/signup/"));
  assert.match(signUp?.props.href ?? "", /requestPlan=individual/);

  await open("/cloud-login/?planRequest=request_1", "space_1");
  assert.deepEqual(requests, ["/api/v1/auth/methods"]);
  assert.deepEqual(destinations, []);
});
