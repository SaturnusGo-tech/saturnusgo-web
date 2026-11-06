"use client";
import { useEffect, useRef, useState } from "react";
import type { useSignIn } from "../../application/useSignIn";
import type { SignInCopy } from "../copy/sign-in-copy";
import styles from "../../../managed/presentation/screen/access.module.css";

export function ProofForm({ signIn, copy, organization }: { readonly signIn: ReturnType<typeof useSignIn>;
  readonly copy: SignInCopy; readonly organization?: string }) {
  const { state } = signIn;
  const [email, setEmail] = useState(state.email);
  const [code, setCode] = useState("");
  const [company, setCompany] = useState(organization ?? "");
  const [now, setNow] = useState(Date.now());
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); setCode(""); }, [state.step]);
  useEffect(() => {
    if (state.step !== "code") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [state.step]);
  const companyEntry = state.step === "saml" || state.step === "company";
  const seconds = Math.max(0, Math.ceil((state.retryAt - now) / 1000));
  return <form className={styles.form} onSubmit={event => {
    event.preventDefault();
    if (state.step === "code") void signIn.verify(code);
    else if (state.step === "saml") void signIn.saml(company);
    else if (state.step === "company") void signIn.company(company);
    else void signIn.startEmail(email);
  }}>
    {state.step === "code" ? <>
      <p className={styles.lead}>{copy.codeBody} <strong>{state.email}</strong>.</p>
      <label className={styles.field}>{copy.codeLabel}<span className={styles.inputWrap}>
        <input ref={input} value={code} onChange={event => setCode(event.target.value)} autoComplete="one-time-code"
          inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required disabled={state.pending} />
      </span></label>
    </> : <label className={styles.field}>{companyEntry ? copy.company : copy.emailLabel}
      <span className={styles.inputWrap}><input ref={input} type={companyEntry ? "text" : "email"}
        value={companyEntry ? company : email} onChange={event => companyEntry ? setCompany(event.target.value) : setEmail(event.target.value)}
        placeholder={companyEntry ? "umbrella-falcon.saturnusgo.com" : undefined}
        autoComplete={companyEntry ? "organization" : "email"} autoCapitalize="none" spellCheck={false}
        maxLength={companyEntry ? 253 : 320} required disabled={state.pending} />
      </span>{companyEntry && <span className={styles.fieldHint}>{copy.organizationHint}</span>}
    </label>}
    <button type="submit" className={styles.primary} disabled={state.pending}>{state.step === "email" ? copy.send : copy.continue}</button>
    {state.step === "saml" && state.error === "FEDERATION_UNAVAILABLE" && <button type="button" className={styles.secondary}
      disabled={state.pending || !company.trim()} onClick={() => void signIn.company(company)}>{copy.companyContinue}</button>}
    {state.step === "code" && <button type="button" className={styles.linkButton} disabled={state.pending || seconds > 0}
      onClick={() => void signIn.resend()}>{seconds > 0 ? `${copy.wait} ${seconds} ${copy.seconds}` : copy.resend}</button>}
  </form>;
}
