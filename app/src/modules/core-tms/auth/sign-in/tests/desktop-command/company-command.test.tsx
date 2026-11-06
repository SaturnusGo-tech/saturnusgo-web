import assert from "node:assert/strict";
import { test } from "node:test";
import { desktopSignInCommand } from "../../domain/desktop-mode";
import { createRequire } from "node:module";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { useSignIn } from "../../application/useSignIn";
import { signInCopy } from "../../presentation/copy/sign-in-copy";

void test("company discovery uses the supported neutral desktop command, without a stale company scope", () => {
  assert.equal(desktopSignInCommand("company", "ru", "previous-company", "FalconDesktop/0.2.5"), "/desktop-sign-in/?method=company&lang=ru");
  assert.equal(desktopSignInCommand("company", "en", undefined, "FalconDesktop/0.2.4"), "/desktop-sign-in/");
  assert.equal(desktopSignInCommand("email", "en", "chosen-company", "FalconDesktop/0.2.4"), "/desktop-sign-in/?method=email&lang=en&workspaceId=chosen-company");
});

void test("choosing another company removes page scope before native or browser discovery and keeps desktop proof", async t => {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const prior = ["window", "navigator", "React"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const origin = "https://tms.saturnusgo.com", attempt = "a".repeat(43), commands: string[] = [], nativeScopes: Array<string | null> = [], selections: unknown[] = [];
  const location = (path: string) => Object.assign(new URL(path, origin), { assign: (command: string) => {
    commands.push(command);nativeScopes.push(browser.location.searchParams.get("workspaceId"));
  } });
  const browser = { location: location("/cloud-login/"), history: { state: {}, replaceState(_state: unknown, _title: string, path: string) { browser.location = location(path); } } };
  Object.assign(globalThis, { React, window: browser });
  let view: ReactTestRenderer | undefined;
  t.after(async () => {
    await act(async () => view?.unmount());
    if (css) require.extensions[".css"] = css;else delete require.extensions[".css"];
    for (const [key, descriptor] of prior) { if (descriptor) Object.defineProperty(globalThis, key, descriptor);else Reflect.deleteProperty(globalThis, key); }
  });
  const { SignInMethods } = await import("../../presentation/methods/SignInMethods");
  const signIn = { state: { methods: { google: true, email: true, saml: true, signup: true }, pending: false, loading: false },
    select(step: string) { selections.push({ step, scope: browser.location.searchParams.get("workspaceId") }); } } as unknown as ReturnType<typeof useSignIn>;
  for (const userAgent of ["FalconDesktop/0.2.5", "FalconDesktop/0.2.4", "Chrome/150"]) {
    browser.location = location(`/cloud-login/?workspaceId=previous-company&lang=ru&desktopAttempt=${attempt}`);
    commands.length = 0;nativeScopes.length = 0;selections.length = 0;
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { userAgent } });
    await act(async () => { view = create(<SignInMethods signIn={signIn} copy={signInCopy("ru")} signup={false} locale="ru" />); });
    await act(async () => view!.root.findAllByType("button").find(button => button.children.includes("Рабочее пространство компании"))!.props.onClick());
    assert.equal(browser.location.searchParams.get("workspaceId"), null);
    assert.equal(browser.location.searchParams.get("desktopAttempt"), attempt);assert.equal(browser.location.searchParams.get("lang"), "ru");
    if (userAgent === "Chrome/150") { assert.deepEqual(commands, []);assert.deepEqual(selections, [{ step: "company", scope: null }]); }
    else { assert.deepEqual(nativeScopes, [null]);assert.deepEqual(commands, [userAgent === "FalconDesktop/0.2.5" ? "/desktop-sign-in/?method=company&lang=ru" : "/desktop-sign-in/"]); }
    await act(async () => view?.unmount());view = undefined;
  }
});
