"use client";
import { rememberBrowserContinuation } from "../../continuation/application/browser-continuation";
import { useEffect, useMemo } from "react";
import { createSignInClient } from "../data/sign-in-client";
import { useSignIn } from "../application/useSignIn";
import { googleEmailProof } from "./callback/google-email-proof";
import { SpaceChoiceFeature } from "../../spaces/composition/SpaceChoiceFeature";
import { SignInScreen } from "../presentation/screen/SignInScreen";

export function SignInFeature({ signup = false }: { readonly signup?: boolean }) {
  const choose = useMemo(() => {
    if (typeof window === "undefined") return false;
    const values = new URLSearchParams(window.location.search).getAll("chooseSpace");
    return values.length === 1 && values[0] === "1";
  }, []);
  return choose ? <SpaceChoiceFeature /> : <MethodSignInFeature signup={signup} />;
}
function MethodSignInFeature({ signup }: { readonly signup: boolean }) {
  const client = useMemo(() => createSignInClient(), []);
  const proof = useMemo(() => typeof window === "undefined" ? null : googleEmailProof(window.location.search), []);
  const intent = proof?.intent ?? (signup ? "signup" : "login");
  const signIn = useSignIn(client, intent, proof);
  useEffect(() => {
    if (!proof) return;
    const url = new URL(window.location.href);
    for (const key of ["challengeId", "email", "expiresAt", "retryAfterSeconds", "intent"]) url.searchParams.delete(key);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [proof]);
  useEffect(() => {
    if (!signIn.state.destination) return;
    const destination = new URL(signIn.state.destination);
    if (destination.protocol === "https:") { rememberBrowserContinuation(); window.location.assign(destination.href); }
  }, [signIn.state.destination]);
  return <SignInScreen signIn={signIn} signup={intent === "signup"} />;
}
