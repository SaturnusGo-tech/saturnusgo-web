"use client";
import { ArrowLeft } from "lucide-react";
import type { useSignIn } from "../../application/useSignIn";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { signInCopy } from "../copy/sign-in-copy";
import { SignInMethods } from "../methods/SignInMethods";
import { ProofForm } from "../forms/ProofForm";
import styles from "../../../managed/presentation/screen/access.module.css";

export function SignInScreen({ signIn, signup = false }: { readonly signIn: ReturnType<typeof useSignIn>; readonly signup?: boolean }) {
  const { locale, setLocale } = useTmsLocale();
  const copy = signInCopy(locale);
  const { state } = signIn;
  const title = state.step === "code" ? copy.codeTitle : state.step === "saml" ? copy.ssoTitle
    : state.step === "email" ? (signup ? copy.signupEmail : copy.emailTitle) : signup ? copy.signup : copy.login;
  return <main className={styles.page} lang={locale}>
    <header className={styles.header}><div className={styles.language} aria-label={locale === "ru" ? "Язык" : "Language"}>
      <button onClick={() => setLocale("ru")} aria-pressed={locale === "ru"}>RU</button>
      <button onClick={() => setLocale("en")} aria-pressed={locale === "en"}>EN</button>
    </div></header>
    <section className={styles.content} aria-busy={state.pending || state.loading} aria-labelledby="sign-in-title">
      <a href="/" className={styles.brand} aria-label="Falcon"><img src="/falcon/falcon-mark-light.png" width={56} height={56} alt="" /></a>
      <h1 id="sign-in-title">{title}</h1>
      {state.error && <p className={styles.error} role="alert">{state.error === "PROVIDER_UNAVAILABLE" ? copy.unavailable
        : /CODE|CHALLENGE|EXPIRED/.test(state.error) ? copy.expired : copy.error}</p>}
      {state.loading && <span className={styles.srOnly} role="status">{copy.loading}</span>}
      {!state.loading && !state.methods && <button className={styles.secondary} onClick={signIn.retryMethods}>{copy.retry}</button>}
      {state.step === "methods" ? <SignInMethods signIn={signIn} copy={copy} signup={signup} />
        : <ProofForm signIn={signIn} copy={copy} />}
      <footer className={styles.footer}>
        {state.step !== "methods" ? <button className={styles.linkButton} onClick={signIn.back}><ArrowLeft size={16} aria-hidden="true" />{copy.back}</button>
          : <a href={signup ? "/cloud-login/" : "/signup/"}>{signup ? copy.loginLink : copy.signupLink}</a>}
      </footer>
    </section>
  </main>;
}
