import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import { useSignIn } from "../../application/useSignIn";
import { createSignInClient } from "../../data/sign-in-client";
import type { EmailChallenge } from "../../domain/sign-in";

void test("verified login without a profile offers explicit localized signup and starts a fresh proof", async t => {
  let renderer: ReactTestRenderer | null = null;
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const prior = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  t.after(async () => {
    if (renderer) await act(async () => renderer?.unmount());
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    if (prior) Object.defineProperty(globalThis, "React", prior); else Reflect.deleteProperty(globalThis, "React");
  });
  const { SignInScreen } = await import("../../presentation/screen/SignInScreen");
  for (const locale of ["en", "ru"] as const) {
    const calls: { url: string; body: unknown }[] = [];
    const challenge: EmailChallenge = { challengeId: "login-proof", expiresAt: "2030-01-01T00:00:00Z", retryAfterSeconds: 60 };
    const proof = { email: "private@example.test", challenge };
    const client = createSignInClient(async (input, init = {}) => {
      const url = String(input), body = init.body ? JSON.parse(String(init.body)) : null;
      calls.push({ url, body });
      if (url.endsWith("/methods")) return Response.json({ data: { email: true, google: true, saml: false, signup: true } });
      if (url.endsWith("/email/start")) return Response.json({ data: { ...challenge, challengeId: "fresh-signup-proof" } });
      if (url.endsWith("/email/verify") && body.challengeId === "login-proof") {
        return Response.json({ error: { code: "SIGNUP_REQUIRED", message: "Signup required", requestId: "request-1" } }, { status: 403 });
      }
      return Response.json({ data: { redirectUrl: "https://tms.example.test/testcases/umbrella-home/work/" } });
    });
    let current!: ReturnType<typeof useSignIn>;
    function Screen({ signup = false }: { signup?: boolean }) {
      current = useSignIn(client, signup ? "signup" : "login", signup ? null : proof);
      return <SignInScreen signIn={current} signup={signup} />;
    }
    const context = { locale, languageTag: locale === "ru" ? "ru-RU" as const : "en-US" as const, setLocale() {}, t: () => "" };
    const view = (signup = false) => <TmsLocaleContext.Provider value={context}><Screen signup={signup} /></TmsLocaleContext.Provider>;
    await act(async () => { renderer = create(view()); });
    await act(async () => { await current.verify("123456"); });
    assert.equal(current.state.error, "SIGNUP_REQUIRED");
    assert.equal(current.state.destination, null);
    assert.equal(renderer!.root.findByProps({ role: "alert" }).children.join(""), locale === "ru"
      ? "Аккаунт ещё не создан. Создайте личное пространство, чтобы начать 7 дней."
      : "Your account has not been created yet. Create a personal workspace to start your 7 days.");
    assert.equal(renderer!.root.findAllByType("form").length, 0, "the consumed login proof cannot be retried or resent");
    const signupLink = renderer!.root.findAllByType("a").find(link => link.props.href === `/signup/?lang=${locale}`);
    assert.ok(signupLink, "signup retains the active language without email or proof parameters");
    assert.deepEqual(calls.map(call => call.url), ["/api/v1/auth/methods", "/api/v1/auth/email/verify"]);
    await act(async () => renderer?.unmount()); renderer = null;
    await act(async () => { renderer = create(view(true)); });
    assert.equal(current.state.step, "methods"); assert.equal(Boolean(current.state.challenge), false);
    await act(async () => { current.select("email"); });
    await act(async () => { await current.startEmail("private@example.test"); });
    assert.equal(current.state.challenge?.challengeId, "fresh-signup-proof");
    assert.deepEqual(calls[calls.length - 1]?.body, { email: "private@example.test", intent: "signup" });
    await act(async () => { await current.verify("654321"); });
    assert.deepEqual(calls[calls.length - 1]?.body, { challengeId: "fresh-signup-proof", code: "654321" });
    assert.equal(current.state.error, null);
    assert.equal(current.state.destination, "https://tms.example.test/testcases/umbrella-home/work/");
    await act(async () => renderer?.unmount()); renderer = null;
  }
});
