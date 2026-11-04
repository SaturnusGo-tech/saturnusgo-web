import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { signInCopy } from "../../presentation/copy/sign-in-copy";
import type { useSignIn } from "../../application/useSignIn";

void test("desktop method selection delegates to the same-origin main-process broker instead of embedded providers", async t => {
  const require = createRequire(import.meta.url);
  const css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const prior = ["React", "navigator"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { userAgent: "Electron/45 FalconDesktop/0.1.7" } });
  Object.assign(globalThis, { React });
  t.after(() => {
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    for (const [key, descriptor] of prior) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  });
  const { SignInMethods } = await import("../../presentation/methods/SignInMethods");
  const signIn = { state: { methods: { google: true, email: true, saml: true, signup: true }, pending: false, loading: false } } as unknown as ReturnType<typeof useSignIn>;
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(<SignInMethods signIn={signIn} copy={signInCopy("en")} signup={false} />); });
  const action = renderer.root.findByType("a");
  assert.equal(action.props.href, "/desktop-sign-in/");
  assert.equal(renderer.root.findAllByType("button").length, 0);
  assert.deepEqual(action.children, ["Continue in browser"]);
  await act(async () => renderer.unmount());
});
