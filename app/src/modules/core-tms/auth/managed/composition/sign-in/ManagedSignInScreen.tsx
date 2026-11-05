"use client";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { rememberBrowserContinuation } from "../../../continuation/application/browser-continuation";
import { useEffect, useMemo, useRef } from "react";
import { createSignInClient } from "../../../sign-in/data/sign-in-client";
import { useSignIn } from "../../../sign-in/application/useSignIn";
import type { useManagedAccess } from "../../application/useManagedAccess";
import { ManagedAccessScreen } from "../../presentation/screen/ManagedAccessScreen";

export function ManagedSignInScreen({ access }: { readonly access: ReturnType<typeof useManagedAccess> }) {
  const {locale}=useTmsLocale(),currentLocale=useRef(locale);currentLocale.current=locale;
  const client = useMemo(() => createSignInClient(fetch,()=>currentLocale.current), []);
  const signIn = useSignIn(client, "login");
  useEffect(() => {
    if (!signIn.state.destination) return;
    const destination = new URL(signIn.state.destination);
    if (destination.protocol === "https:") { rememberBrowserContinuation(); window.location.assign(destination.href); }
  }, [signIn.state.destination]);
  return <ManagedAccessScreen access={access} signIn={signIn} />;
}
