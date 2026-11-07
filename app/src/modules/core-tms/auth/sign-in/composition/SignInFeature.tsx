"use client";
import { rememberBrowserContinuation } from "../../continuation/application/browser-continuation";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useEffect, useMemo, useRef, useState } from "react";
import { createSignInClient } from "../data/sign-in-client";
import { useSignIn } from "../application/useSignIn";
import { googleEmailProof } from "./callback/google-email-proof";
import { SpaceChoiceFeature } from "../../spaces/composition/SpaceChoiceFeature";
import { DesktopAuthEntry } from "../../continuation/composition/DesktopAuthEntry";
import { hasBrowserDesktopAttempt } from "../../continuation/desktop/browser-desktop-attempt";
import { setPlanRequestIntent } from "../../continuation/domain/continuation-path";
import { readCloudSession } from "../../cloud/cloud-auth-client";
import { TmsAuthState } from "../../presentation/state/TmsAuthState";
import { WORKSPACE_PATH } from "../../../navigation/workspace-route";
import { WorkspaceMfaHandoff } from "../../workspace-handoff/composition/WorkspaceMfaHandoff";
import { SignInScreen } from "../presentation/screen/SignInScreen";
import { readPlanRequestIntent } from "../../../billing/requests/domain/plan-request";
import { useBrowserSignInMethod } from "./browser-method/useBrowserSignInMethod";
import { TMS_AUTH_PRODUCTION_SIGNED_OUT_URL } from "../../navigation/tms-auth-route";
import { companyAddress } from "../../../../core-falcon-public/company-entry/domain/company-address";
import { isFalconDesktop } from "../domain/desktop-mode";

export function SignInFeature({ signup = false }: { readonly signup?: boolean }) {
  useEffect(() => {
    if (readPlanRequestIntent(window.location.search)) rememberBrowserContinuation();
  }, []);
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
  return <DesktopAuthEntry>{handoff ? <WorkspaceMfaHandoff workspaceId={handoff}/> : choose ? <SpaceChoiceFeature /> : <PlanEntry signup={signup} />}</DesktopAuthEntry>;
}
function PlanEntry({ signup }: { readonly signup: boolean }) {
  const { locale } = useTmsLocale();
  const [intent] = useState(() => readPlanRequestIntent(window.location.search));
  const [checking, setChecking] = useState(() => Boolean(intent
    && /^\/(?:cloud-login|login|signup)\/?$/.test(window.location.pathname)
    && !hasBrowserDesktopAttempt() && !googleEmailProof(window.location.search)));
  useEffect(() => {
    if (!checking || !intent) return;
    const controller = new AbortController();
    void readCloudSession(controller.signal).then(session => {
      if (controller.signal.aborted) return;
      const workspaceId = session.authenticated ? session.workspace?.id : undefined;
      if (!workspaceId || !/^[A-Za-z0-9_-]{1,128}$/.test(workspaceId)
        || intent.kind === "request" && intent.workspaceId !== workspaceId) {
        setChecking(false);
        return;
      }
      const query = new URLSearchParams({ workspaceId, view: "config", settings: "billing" });
      setPlanRequestIntent(query, intent);
      const lang = new URLSearchParams(window.location.search).get("lang");
      query.set("lang", lang === "en" || lang === "ru" ? lang : locale);
      window.location.replace(`${WORKSPACE_PATH}?${query}`);
    }).catch(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, [checking, intent, locale]);
  return checking ? <TmsAuthState kind="loading" /> : <MethodSignInFeature signup={signup} />;
}

function MethodSignInFeature({ signup }: { readonly signup: boolean }) {
  const { locale } = useTmsLocale();
  const currentLocale=useRef(locale);currentLocale.current=locale;
  const [planIntent] = useState(() => typeof window === "undefined" ? null : readPlanRequestIntent(window.location.search));
  const client = useMemo(() => createSignInClient(fetch, () => currentLocale.current, {
    scopeWorkspace: planIntent?.kind !== "request",
  }), [planIntent]);
  const proof = useMemo(() => typeof window === "undefined" ? null : googleEmailProof(window.location.search), []);
  const intent = proof?.intent ?? (signup ? "signup" : "login");
  const signIn = useSignIn(client, intent, proof);
  const [invitedCompany] = useState(() => {
    if (typeof window === "undefined" || signup || proof || planIntent || isFalconDesktop() || hasBrowserDesktopAttempt()) return;
    const { origin, pathname, search } = window.location;
    if (`${origin}${pathname}` !== TMS_AUTH_PRODUCTION_SIGNED_OUT_URL) return;
    const query = new URLSearchParams(search);
    const [hostname, duplicate] = query.getAll("company");
    if (!hostname || duplicate !== undefined || query.has("workspaceId")) return;
    const suffix = process.env.NEXT_PUBLIC_FALCON_COMPANY_DOMAIN_SUFFIX ?? "saturnusgo.com";
    return companyAddress(hostname, suffix) === `https://${hostname}/` ? hostname : undefined;
  });
  const openedCompanyForm = useRef(false);
  useBrowserSignInMethod(signIn, { proof: Boolean(proof) });
  useEffect(() => {
    if (!invitedCompany || openedCompanyForm.current || !signIn.state.methods) return;
    openedCompanyForm.current = true;
    signIn.select("company");
  }, [invitedCompany, signIn]);
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
  return <SignInScreen signIn={signIn} signup={intent === "signup"} planIntent={planIntent} organization={invitedCompany} />;
}
