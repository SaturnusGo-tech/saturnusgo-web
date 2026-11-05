import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import { CONTINUATION_KEY } from "../../application/continuation-storage";
import { DESKTOP_ATTEMPT_KEY } from "../../desktop/attempt-storage";
import { clearBrowserDesktopAttempt } from "../../desktop/browser-desktop-attempt";

void test("desktop login/signup survives Google and email, including explicit signup-required CTA", async t => {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const prior = ["window", "document", "React", "fetch"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const { SignInFeature } = await import("../../../sign-in/composition/SignInFeature");
  const { LegacyTmsAuthBoundary } = await import("../../../presentation/boundary/LegacyTmsAuthBoundary");
  const { DesktopRestartScreen } = await import("../../composition/DesktopAuthEntry");
  const origin = "https://tms.example.test", attempt = "a".repeat(43), values = new Map<string, string>(), destinations: string[] = [];
  let renderer: ReactTestRenderer | null = null, authenticated = false, rejectLogin = false;
  const location = (path: string) => Object.assign(new URL(path, origin), { assign: (target: string) => destinations.push(target), replace: (target: string) => destinations.push(target), reload() {} });
  const browser = { location: location("/login/"), history: { state: {}, replaceState(_state: unknown, _title: string, path: string) { browser.location = location(path); } },
    sessionStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } } };
  Object.assign(globalThis, { React, window: browser, document: { title: "Falcon" } });
  t.after(async () => {
    await act(async () => renderer?.unmount()); clearBrowserDesktopAttempt();
    for (const [key, descriptor] of prior) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
  });
  const context = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "Loading" };
  const wrap = (content: React.ReactNode) => <TmsLocaleContext.Provider value={context}>{content}</TmsLocaleContext.Provider>;
  const mount = async (path: string, signup = false) => {
    await act(async () => renderer?.unmount()); browser.location = location(path);
    await act(async () => { renderer = create(wrap(<SignInFeature signup={signup} />)); });
  };
  const click = async (label: string) => { await act(async () => renderer!.root.findAllByType("button").find(button => button.children.includes(label))!.props.onClick()); };
  const submit = async (value: string) => {
    await act(async () => renderer!.root.findByType("input").props.onChange({ target: { value } }));
    await act(async () => { renderer!.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
  };
  globalThis.fetch = async (input, init = {}) => {
    const path = String(input), body = init.body ? JSON.parse(String(init.body)) : null;
    if (path.endsWith("/methods")) return Response.json({ data: { google: true, email: true, saml: false, signup: true } });
    if (path.endsWith("/google/start")) return Response.json({ data: { authorizationUrl: "https://accounts.google.com/authorize" } });
    if (path.endsWith("/email/start")) return Response.json({ data: { challengeId: "fresh-proof", expiresAt: "2030-01-01T00:00:00Z", retryAfterSeconds: 60 } });
    if (path.endsWith("/email/verify")) {
      if (rejectLogin && body.challengeId === "google-proof") return Response.json({ error: { code: "SIGNUP_REQUIRED" } }, { status: 403 });
      authenticated = true; return Response.json({ data: { redirectUrl: `${origin}/testcases/umbrella-home/work/` } });
    }
    return Response.json({ data: { authenticated, identity: { id: "personal", givenName: "Pat", familyName: "", email: "private@example.test" },
      workspace: { id: "personal-space", name: "Pat", slug: "pat" }, membership: { role: "workspace_admin" }, defaultProject: { id: "project" } } });
  };
  for (const signup of [false, true]) for (const provider of ["google", "email"]) {
    clearBrowserDesktopAttempt(); values.clear(); destinations.length = 0; authenticated = false; rejectLogin = !signup && provider === "google";
    const mcp = JSON.stringify({ version: 1, origin, createdAt: Date.now(), path: "/testcases/umbrella-home/work/?falconMcpInteraction=savedConsent" });
    values.set(CONTINUATION_KEY, mcp);
    await mount(`${signup ? "/signup/" : "/cloud-login/"}?desktopAttempt=${attempt}`, signup);
    assert.equal(browser.location.search, ""); assert.ok(values.has(DESKTOP_ATTEMPT_KEY));
    assert.ok(!renderer!.root.findAllByType("button").some(button => button.children.includes("Company workspace")), "desktop return must remain on its original company or personal origin");
    if (provider === "google") {
      await click("Continue with Google"); assert.equal(destinations[0], "https://accounts.google.com/authorize");
      await mount(`/signup/?challengeId=google-proof&email=private%40example.test&expiresAt=2030-01-01T00%3A00%3A00Z&retryAfterSeconds=60&intent=${signup ? "signup" : "login"}`, true);
      await submit("123456");
      if (rejectLogin) {
        assert.ok(renderer!.root.findAllByType("a").some(link => link.props.href === "/signup/?lang=en"));
        assert.ok(values.has(DESKTOP_ATTEMPT_KEY));
        await mount("/signup/", true); await click("Continue with email"); await submit("private@example.test"); await submit("654321");
      }
    } else {
      await click("Continue with email"); await submit("private@example.test"); await submit("123456");
    }
    assert.equal(destinations[destinations.length - 1], `${origin}/testcases/umbrella-home/work/`);
    await act(async () => renderer?.unmount()); browser.location = location("/testcases/umbrella-home/work/?caseId=explicitCase");
    let workspaceMounted = 0;
    function Workspace() { React.useEffect(() => { workspaceMounted++; }, []); return <div />; }
    await act(async () => { renderer = create(wrap(<LegacyTmsAuthBoundary><Workspace /></LegacyTmsAuthBoundary>)); });
    assert.equal(destinations[destinations.length - 1], `/api/v1/auth/desktop/authorize?attempt=${attempt}`);
    assert.equal(workspaceMounted, 0); assert.equal(values.has(DESKTOP_ATTEMPT_KEY), false); assert.equal(values.get(CONTINUATION_KEY), mcp);
  }
  await act(async () => renderer?.unmount()); clearBrowserDesktopAttempt(); values.clear(); destinations.length = 0;
  const normalFetch = globalThis.fetch; let finishProvider!: (response: Response) => void;
  globalThis.fetch = async (input, init) => String(input).endsWith("/google/start")
    ? new Promise<Response>(resolve => { finishProvider = resolve; }) : normalFetch(input, init);
  await mount(`/cloud-login/?desktopAttempt=${attempt}`);
  await click("Continue with Google"); await click("Cancel sign-in");
  assert.equal(values.has(DESKTOP_ATTEMPT_KEY), false);
  await act(async () => finishProvider(Response.json({ data: { authorizationUrl: "https://accounts.google.com/late" } })));
  assert.deepEqual(destinations, [], "cancelled external attempts cannot return or navigate late");
  globalThis.fetch = normalFetch;
  await act(async () => renderer?.unmount()); clearBrowserDesktopAttempt(); values.clear(); destinations.length = 0;
  Object.defineProperty(browser, "sessionStorage", { configurable: true, get() { throw new Error("storage blocked"); } });
  await mount(`/signup/?desktopAttempt=${attempt}`, true);
  assert.equal(renderer!.root.findAllByType(DesktopRestartScreen).length, 1);
  assert.equal(renderer!.root.findAllByType("form").length, 0); assert.deepEqual(destinations, []);
});
