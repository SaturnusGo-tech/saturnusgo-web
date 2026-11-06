"use client";
import { useEffect, useState } from "react";
import { Mail, Building2 } from "lucide-react";
import type { useSignIn } from "../../application/useSignIn";
import type { SignInCopy } from "../copy/sign-in-copy";
import { isFalconDesktop, desktopSignInCommand } from "../../domain/desktop-mode";
import type { TmsLocale } from "../../../../localization/model/locale";
import styles from "../../../managed/presentation/screen/access.module.css";

export function SignInMethods({ signIn, copy, signup, companyLogin, locale = "en" }: {
  readonly signIn: ReturnType<typeof useSignIn>; readonly copy: SignInCopy; readonly signup: boolean;
  readonly companyLogin?: () => void;
  readonly locale?: TmsLocale;
}) {
  const { state } = signIn;
  const [desktop, setDesktop] = useState(false);
  useEffect(() => { setDesktop(isFalconDesktop()); }, []);
  const handoff = (method: "google" | "email" | "saml" | "company") => {
    if (!desktop) return false;
    const ids = new URLSearchParams(window.location.search).getAll("workspaceId");
    window.location.assign(desktopSignInCommand(method, locale, ids.length === 1 ? ids[0] : undefined)); return true;
  };
  const chooseCompany = () => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("workspaceId")) {
      const destination = new URL(window.location.href);destination.searchParams.delete("workspaceId");
      window.history.replaceState(window.history.state, "", `${destination.pathname}${destination.search}${destination.hash}`);
    }
    if (!handoff("company")) signIn.select("company");
  };
  const signupBlocked = signup && !state.methods?.signup;
  return <div className={styles.methodStack}>
    <button className={styles.secondary} disabled={state.pending || state.loading || !state.methods?.google || signupBlocked}
      onClick={() => { if (!handoff("google")) void signIn.google(); }}><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M21.8 12.2c0-.7-.1-1.4-.2-2.2H12v4.2h5.5c-.3 1.3-1 2.3-2 3v2.5h3.3c1.9-1.8 3-4.4 3-7.5ZM12 22c2.7 0 5-.9 6.8-2.3l-3.3-2.5c-.9.6-2.1.9-3.5.9-2.6 0-4.9-1.8-5.7-4.2H2.9v2.6C4.6 19.8 8 22 12 22ZM6.3 13.9a6 6 0 0 1 0-3.8V7.5H2.9a10 10 0 0 0 0 9l3.4-2.6ZM12 5.9c1.5 0 2.8.5 3.8 1.5L18.7 4A9.7 9.7 0 0 0 12 2C8 2 4.6 4.2 2.9 7.5l3.4 2.6C7.1 7.7 9.4 5.9 12 5.9Z" />
      </svg>{copy.google}</button>
    <button className={styles.secondary} disabled={state.pending || state.loading || (state.methods ? !state.methods.email : !companyLogin) || signupBlocked}
      onClick={() => { if (!handoff("email")) { if (companyLogin) companyLogin(); else signIn.select("email"); } }}><Mail size={18} aria-hidden="true" />{copy.email}</button>
    {!signup && <button className={styles.primary} disabled={state.pending || state.loading || !state.methods?.saml}
      onClick={() => { if (!handoff("saml")) signIn.select("saml"); }}><Building2 size={18} aria-hidden="true" />{copy.saml}</button>}
    {!signup && !companyLogin && <button className={styles.secondary} disabled={state.pending || state.loading}
      onClick={chooseCompany}><Building2 size={18} aria-hidden="true" />{copy.companyWorkspace}</button>}
    {signupBlocked && !state.loading && <p className={styles.lead} role="status">{copy.signupOff}</p>}
    {state.pending && <button className={styles.linkButton} onClick={signIn.back}>{copy.cancel}</button>}
  </div>;
}
