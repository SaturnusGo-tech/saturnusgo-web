"use client";
import { rememberBrowserContinuation } from "../../continuation/application/browser-continuation";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useEffect, useMemo, useRef } from "react";
import { createSignInClient } from "../data/sign-in-client";
import { useSignIn } from "../application/useSignIn";
import { googleEmailProof } from "./callback/google-email-proof";
import { SpaceChoiceFeature } from "../../spaces/composition/SpaceChoiceFeature";
import { DesktopAuthEntry } from "../../continuation/composition/DesktopAuthEntry";
import { WorkspaceMfaHandoff } from "../../workspace-handoff/composition/WorkspaceMfaHandoff";
import { SignInScreen } from "../presentation/screen/SignInScreen";
import { useBrowserSignInMethod } from "./browser-method/useBrowserSignInMethod";

export function SignInFeature({ signup = false }: { readonly signup?: boolean }) {
  const choose = useMemo(() => {
    if (typeof window === "undefined") return false;
    const values = new URLSearchParams(window.location.search).getAll("chooseSpace");
    return values.length === 1 && values[0] === "1";
  }, []);
  const handoff=useMemo(()=>{
    if(typeof window==="undefined")return null;
    const query=new URLSearchParams(window.location.search),ids=query.getAll("workspaceId");
    return query.getAll("workspaceHandoff").length===1&&query.get("workspaceHandoff")==="1"&&ids.length===1&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(ids[0])?ids[0]:null;
  },[]);
  return <DesktopAuthEntry>{handoff ? <WorkspaceMfaHandoff workspaceId={handoff}/> : choose ? <SpaceChoiceFeature /> : <MethodSignInFeature signup={signup} />}</DesktopAuthEntry>;
}
function MethodSignInFeature({ signup }: { readonly signup: boolean }) {
  const { locale } = useTmsLocale();
  const currentLocale=useRef(locale);currentLocale.current=locale;
  const client = useMemo(() => createSignInClient(fetch,()=>currentLocale.current), []);
  const proof = useMemo(() => typeof window === "undefined" ? null : googleEmailProof(window.location.search), []);
  const intent = proof?.intent ?? (signup ? "signup" : "login");
  const signIn = useSignIn(client, intent, proof);
  useBrowserSignInMethod(signIn, { proof: Boolean(proof) });
  useEffect(() => {
    if (!proof) return;
    const url = new URL(window.location.href);
    for (const key of ["challengeId", "email", "expiresAt", "retryAfterSeconds", "intent"]) url.searchParams.delete(key);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [proof]);
  useEffect(() => {
    if (!signIn.state.destination) return;
    const destination = new URL(signIn.state.destination);
    if (destination.protocol === "https:") {
      if (signIn.state.step === "company") {
        destination.searchParams.set("method", "company"); destination.searchParams.set("lang", locale);
      }
      rememberBrowserContinuation(); window.location.assign(destination.href);
    }
  }, [signIn.state.destination, signIn.state.step, locale]);
  return <SignInScreen signIn={signIn} signup={intent === "signup"} />;
}
