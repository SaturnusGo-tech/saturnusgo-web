import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { useSignIn } from "../../application/useSignIn";
import type { SignInPort } from "../../application/sign-in-port";

void test("expired email proof cannot submit an old challenge and can request a new one", async () => {
  let current!: ReturnType<typeof useSignIn>;
  let verified = 0; let starts = 0;
  const client: SignInPort = {
    cancelFederation: async () => {},
    methods: async () => ({ email: true, google: false, saml: false, signup: true }),
    startEmail: async () => { starts++; return { challengeId: `challenge-${starts}`, expiresAt: "2020-01-01T00:00:00Z", retryAfterSeconds: 0 }; },
    verifyEmail: async () => { verified++; return { redirectUrl: "https://tms.example.test/" }; },
    startGoogle: async () => ({ authorizationUrl: "" }), startSaml: async () => ({ authorizationUrl: "" }),
    trial: async () => ({ kind: "company", startsAt: null, expiresAt: null, readOnly: false }),
  };
  function Probe() { current = useSignIn(client, "login"); return null; }
  let renderer!: ReturnType<typeof create>;
  await act(async () => { renderer = create(<Probe />); });
  await act(async () => { await current.startEmail("qa@example.test"); });
  await act(async () => { await current.verify("123456"); });
  assert.equal(verified, 0);
  assert.equal(current.state.error, "CHALLENGE_EXPIRED");
  await act(async () => { await current.resend(); });
  assert.equal(starts, 2);
  assert.equal(current.state.challenge?.challengeId, "challenge-2");
  await act(async () => renderer.unmount());
});
