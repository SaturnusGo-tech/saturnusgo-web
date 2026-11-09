"use client";
import { FalconBrandMark } from "../../../../../../shared/components/brand/FalconBrandMark";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import type { useSignIn } from "../../application/useSignIn";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { signInError } from "../copy/sign-in-error";
import { signInCopy } from "../copy/sign-in-copy";
import { SignInMethods } from "../methods/SignInMethods";
import type { readPlanRequestIntent } from "../../../../billing/requests/domain/plan-request";
import { setPlanRequestIntent } from "../../../continuation/domain/continuation-path";
import { ProofForm } from "../forms/ProofForm";
import styles from "../../../managed/presentation/screen/access.module.css";

export function SignInScreen({ signIn, signup = false, planIntent = null, organization }: {
  readonly signIn: ReturnType<typeof useSignIn>;
  readonly signup?: boolean;
  readonly planIntent?: ReturnType<typeof readPlanRequestIntent>;
  readonly organization?: string;
}) {
  const { locale, setLocale } = useTmsLocale();
  const copy = signInCopy(locale);
  const entryParams = new URLSearchParams({ lang: locale });
  if (planIntent) setPlanRequestIntent(entryParams, planIntent);
  const { state } = signIn;
  const signupRequired = !signup && state.error === "SIGNUP_REQUIRED";
  const title = signupRequired ? copy.signup : state.step === "code" ? copy.codeTitle : state.step === "saml" ? copy.ssoTitle
    : state.step === "company" ? copy.companyTitle : state.step === "email" ? (signup ? copy.signupEmail : copy.emailTitle) : signup ? copy.signup : copy.login;
  useEffect(() => { if (typeof document !== "undefined") document.title = title; }, [title]);
  return <main className={styles.page} lang={locale}>
    <header className={styles.header}><div className={styles.language} aria-label={locale === "ru" ? "Язык" : "Language"}>
      <button onClick={() => setLocale("ru")} aria-pressed={locale === "ru"}>RU</button>
      <button onClick={() => setLocale("en")} aria-pressed={locale === "en"}>EN</button>
    </div></header>
    <section className={styles.content} aria-busy={state.pending || state.loading} aria-labelledby="sign-in-title">
      <a href={`/?lang=${locale}`} className={styles.brand} aria-label="Falcon"><FalconBrandMark className={styles.brandMark} /></a>
      <h1 id="sign-in-title">{title}</h1>
      {state.error && <p className={styles.error} role="alert">{signupRequired ? copy.signupRequired : signInError(state.error, state.step, copy)}</p>}
      {state.loading && <span className={styles.srOnly} role="status">{copy.loading}</span>}
      {!state.loading && !state.methods && <button className={styles.secondary} onClick={signIn.retryMethods}>{copy.retry}</button>}
      {signupRequired ? <a href={`/signup/?${entryParams}`} className={styles.primary}>{copy.signupLink}</a>
        : state.step === "methods" ? <SignInMethods signIn={signIn} copy={copy} signup={signup} locale={locale} />
        : <ProofForm signIn={signIn} copy={copy} organization={state.step === "company" ? organization : undefined} />}
      <footer className={styles.footer}>
        {state.step !== "methods" ? <button className={styles.linkButton} onClick={signIn.back}><ArrowLeft size={16} aria-hidden="true" />{copy.back}</button>
          : <a href={`${signup ? "/cloud-login/" : "/signup/"}?${entryParams}`}>{signup ? copy.loginLink : copy.signupLink}</a>}
      </footer>
      {signup && <p className={styles.disclosure}>{copy.termsStart}<a href={`/trial-terms/?lang=${locale}`} target="_blank" rel="noopener noreferrer">{copy.trialTerms}</a>
        {copy.privacyBridge}<a href={`/privacy/?lang=${locale}`} target="_blank" rel="noopener noreferrer">{copy.privacy}</a>{copy.termsEnd}</p>}
    </section>
  </main>;
}
