import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useSignIn } from "../../application/useSignIn";
import type { SignInPort } from "../../application/sign-in-port";

let current: ReturnType<typeof useSignIn>;
function Probe({ client, intent = "login" }: { client: SignInPort; intent?: "login" | "signup" }) {
  current = useSignIn(client, intent); return null;
}
const fixture = (): SignInPort => ({
  methods: async () => ({ google: true, email: true, saml: true, signup: true }),
  startEmail: async () => ({ challengeId: "proof-1", expiresAt: "2030-01-01T00:00:00Z", retryAfterSeconds: 60 }),
  verifyEmail: async () => ({ redirectUrl: "https://tms.example.test/welcome/" }),
  startGoogle: async () => ({ authorizationUrl: "https://accounts.google.com/authorize" }),
  startSaml: async () => ({ authorizationUrl: "https://idp.example.test/authorize" }),
  cancelFederation: async () => {},
  trial: async () => ({ kind: "company", startsAt: null, expiresAt: null, readOnly: false }),
});
async function mount(client = fixture(), intent: "login" | "signup" = "login") {
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(<Probe client={client} intent={intent} />); });
  return renderer;
}
void test("sign-in starts with methods and opens email only after selection", async () => {
  const renderer = await mount();
  assert.equal(current.state.step, "methods");
  await act(async () => current.select("email"));
  assert.equal(current.state.step, "email");
  await act(async () => current.back());
  assert.equal(current.state.step, "methods");
  await act(async () => renderer.unmount());
});
void test("email proof advances to code, honors resend cooldown, and verifies the active challenge", async () => {
  let sent = 0; let verified = "";
  const renderer = await mount({ ...fixture(), startEmail: async () => { sent++; return { challengeId: "proof-2", expiresAt: "2030-01-01T00:00:00Z", retryAfterSeconds: 60 }; },
    verifyEmail: async (challengeId, code) => { verified = `${challengeId}:${code}`; return { redirectUrl: "https://tms.example.test/" }; } });
  await act(async () => current.select("email"));
  await act(async () => { await current.startEmail("person@example.test"); });
  assert.equal(current.state.step, "code");
  assert.equal(current.state.email, "person@example.test");
  await act(async () => { await current.resend(); });
  assert.equal(sent, 1);
  await act(async () => { await current.verify("123456"); });
  assert.equal(verified, "proof-2:123456");
  assert.equal(current.state.destination, "https://tms.example.test/");
  await act(async () => renderer.unmount());
});
void test("back cancels stale provider completions even when the adapter ignores abort", async () => {
  let finish!: (value: { authorizationUrl: string }) => void;
  let invalidations = 0;
  const renderer = await mount({ ...fixture(), startGoogle: () => new Promise(resolve => { finish = resolve; }), cancelFederation: async () => { invalidations++; } });
  let pending!: Promise<void>;
  await act(async () => { pending = current.google(); });
  await act(async () => current.back());
  await act(async () => { finish({ authorizationUrl: "https://accounts.google.com/late" }); await pending; });
  assert.equal(invalidations, 1, "back must invalidate the browser binding at the server");
  assert.equal(current.state.destination, null);
  assert.equal(current.state.pending, false);
  await act(async () => renderer.unmount());
});
void test("unavailable providers cannot initiate requests and signup cannot select SAML", async () => {
  let calls = 0;
  const renderer = await mount({ ...fixture(), methods: async () => ({ google: false, email: true, saml: true, signup: true }),
    startGoogle: async () => { calls++; return { authorizationUrl: "https://accounts.google.com/" }; } }, "signup");
  await act(async () => { await current.google(); current.select("saml"); });
  assert.equal(calls, 0);
  assert.equal(current.state.step, "methods");
  assert.equal(current.state.error, "PROVIDER_UNAVAILABLE");
  await act(async () => renderer.unmount());
});
void test("changing tenant or unmounting discards old email and redirect responses", async () => {
  let finish!: (value: { challengeId: string; expiresAt: string; retryAfterSeconds: number }) => void;
  const client = { ...fixture(), startEmail: () => new Promise<{ challengeId: string; expiresAt: string; retryAfterSeconds: number }>(resolve => { finish = resolve; }) };
  const renderer = await mount(client);
  let pending!: Promise<void>;
  await act(async () => { pending = current.startEmail("old@example.test"); });
  await act(async () => { renderer.update(<Probe client={fixture()} />); });
  await act(async () => { finish({ challengeId: "old", expiresAt: "2030-01-01T00:00:00Z", retryAfterSeconds: 60 }); await pending; });
  assert.equal(current.state.step, "methods"); assert.equal(current.state.challenge, null);
  await act(async () => renderer.unmount());
});
void test("capability service failure leaves a working retry instead of stranding public sign-in", async () => {
  let attempts = 0;
  const renderer = await mount({ ...fixture(), methods: async () => {
    if (++attempts === 1) throw new Error("offline");
    return { google: true, email: true, saml: true, signup: true };
  } });
  assert.equal(current.state.error, "SERVICE_UNAVAILABLE");
  await act(async () => current.retryMethods());
  assert.equal(current.state.error, null);
  assert.equal(current.state.methods?.email, true);
  await act(async () => renderer.unmount());
});
