"use client";

import { useEffect, useRef, useState } from "react";
import type { SignInPort } from "./sign-in-port";
import type { EmailChallenge, SignInIntent, SignInMethods, SignInStep } from "../domain/sign-in";

interface State {
  readonly step: SignInStep;
  readonly methods: SignInMethods | null;
  readonly loading: boolean;
  readonly pending: boolean;
  readonly email: string;
  readonly challenge: EmailChallenge | null;
  readonly retryAt: number;
  readonly error: string | null;
  readonly destination: string | null;
}
const initial: State = { step: "methods", methods: null, loading: true, pending: false,
  email: "", challenge: null, retryAt: 0, error: null, destination: null };
export function useSignIn(client: SignInPort, intent: SignInIntent, proof?: { readonly email: string; readonly challenge: EmailChallenge } | null) {
  const [state, setState] = useState(initial);
  const [generation, setGeneration] = useState(0);
  const current = useRef<AbortController | null>(null);
  const pending = useRef(false);
  const providerPending = useRef(false);
  const invalidation = useRef<Promise<void>>(Promise.resolve());
  const cancel = () => {
    current.current?.abort(); pending.current = false;
    if (providerPending.current) {
      providerPending.current = false;
      invalidation.current = client.cancelFederation().catch(() => {});
    }
  };
  useEffect(() => {
    cancel();
    const controller = new AbortController(); current.current = controller;
    setState(proof ? { ...initial, step: "code", email: proof.email, challenge: proof.challenge,
      retryAt: Date.now() + proof.challenge.retryAfterSeconds * 1000 } : initial);
    void client.methods(controller.signal).then(methods => {
      if (!controller.signal.aborted) setState(value => ({ ...value, methods, loading: false }));
    }).catch(() => {
      if (!controller.signal.aborted) setState(value => ({ ...value, loading: false, error: "SERVICE_UNAVAILABLE" }));
    });
    return cancel;
  }, [client, intent, generation, proof]);
  async function perform(operation: (signal: AbortSignal) => Promise<Partial<State>>) {
    if (pending.current) return;
    cancel(); pending.current = true;
    const controller = new AbortController(); current.current = controller;
    setState(value => ({ ...value, pending: true, error: null, destination: null }));
    try {
      const result = await operation(controller.signal);
      if (!controller.signal.aborted) setState(value => ({ ...value, ...result, pending: false }));
    } catch (error) {
      if (!controller.signal.aborted) setState(value => ({ ...value, pending: false,
        error: error && typeof error === "object" && "code" in error ? String(error.code) : "SERVICE_UNAVAILABLE" }));
    } finally { if (current.current === controller) { pending.current = false; providerPending.current = false; } }
  }
  function unavailable() { setState(value => ({ ...value, error: "PROVIDER_UNAVAILABLE" })); }
  function select(step: "email" | "saml") {
    if (!state.methods?.[step] || (step === "saml" && intent === "signup")) { unavailable(); return; }
    cancel(); setState(value => ({ ...value, step, pending: false, error: null, destination: null }));
  }
  function back() {
    cancel();
    setState(value => ({ ...value, step: value.step === "code" ? "email" : "methods", pending: false,
      challenge: null, error: null, destination: null }));
  }
  async function startEmail(email: string) {
    if (!state.methods?.email || (intent === "signup" && !state.methods.signup)) { unavailable(); return; }
    await perform(async signal => {
      const challenge = await client.startEmail(email.trim(), intent, signal);
      return { step: "code", email: email.trim(), challenge, retryAt: Date.now() + challenge.retryAfterSeconds * 1000 };
    });
  }
  return { state, select, back, startEmail, retryMethods: () => setGeneration(value => value + 1),
    resend: async () => {
      if (Date.now() < state.retryAt || !state.challenge) return;
      await perform(async signal => {
        const challenge=await client.resendEmail(state.challenge!.challengeId,signal);
        return {challenge,retryAt:Date.now()+challenge.retryAfterSeconds*1000};
      });
    },
    verify: async (code: string) => {
      if (!state.challenge) return;
      if (Date.parse(state.challenge.expiresAt) <= Date.now()) {
        setState(value => ({ ...value, error: "CHALLENGE_EXPIRED" })); return;
      }
      await perform(async signal => ({ destination: (await client.verifyEmail(state.challenge!.challengeId, code.trim(), signal)).redirectUrl }));
    },
    google: async () => {
      if (!state.methods?.google || (intent === "signup" && !state.methods.signup)) { unavailable(); return; }
      await perform(async signal => {
        await invalidation.current; signal.throwIfAborted(); providerPending.current = true;
        return { destination: (await client.startGoogle(intent, signal)).authorizationUrl };
      });
    },
    saml: async (organization: string) => {
      if (!state.methods?.saml || intent === "signup") { unavailable(); return; }
      await perform(async signal => {
        await invalidation.current; signal.throwIfAborted(); providerPending.current = true;
        return { destination: (await client.startSaml(organization.trim(), signal)).authorizationUrl };
      });
    },
  };
}
