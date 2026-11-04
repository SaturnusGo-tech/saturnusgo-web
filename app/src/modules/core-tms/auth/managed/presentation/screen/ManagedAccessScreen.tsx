"use client";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { useManagedAccess } from "../../application/useManagedAccess";
import type { useSignIn } from "../../../sign-in/application/useSignIn";
import { signInCopy } from "../../../sign-in/presentation/copy/sign-in-copy";
import { SignInMethods } from "../../../sign-in/presentation/methods/SignInMethods";
import { ProofForm } from "../../../sign-in/presentation/forms/ProofForm";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { accessCopy } from "../copy/access-copy";
import { accessError } from "../copy/access-error";
import { LoginForm } from "../forms/LoginForm";
import { FirstPasswordForm } from "../forms/FirstPasswordForm";
import { MfaForm } from "../mfa/MfaForm";
import { RecoveryCodes } from "../mfa/RecoveryCodes";
import styles from "./access.module.css";

export function ManagedAccessScreen({ access, signIn }: { readonly access: ReturnType<typeof useManagedAccess>;
  readonly signIn?: ReturnType<typeof useSignIn> }) {
  const { locale, setLocale } = useTmsLocale();
  const copy = accessCopy(locale);
  const methodCopy = signInCopy(locale);
  const { state } = access;
  const stage = state.session?.stage ?? "anonymous";
  const [companyEmail, setCompanyEmail] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const step = signIn?.state.step ?? "methods";
  useEffect(() => {
    if (!state.loading && (stage !== "anonymous" || companyEmail)) titleRef.current?.focus({ preventScroll: true });
  }, [stage, state.loading, companyEmail, step]);
  const title = stage === "password_change" ? copy.firstTitle : stage === "mfa_enrollment" ? copy.enrollTitle
    : stage === "mfa_challenge" ? copy.mfaTitle : state.entrypoint?.audience === "platform" ? copy.sandbox : companyEmail ? methodCopy.emailTitle
      : step === "saml" ? methodCopy.ssoTitle : methodCopy.login;
  const lead = stage === "password_change" ? copy.firstBody : stage === "mfa_enrollment" ? copy.enrollBody
    : stage === "mfa_challenge" ? copy.mfaBody : null;
  const contact = state.entrypoint?.accessContact;
  return <main className={styles.page} lang={locale}>
    <header className={styles.header}><div className={styles.language} aria-label={locale === "ru" ? "Язык" : "Language"}>
      <button onClick={() => setLocale("ru")} aria-pressed={locale === "ru"}>RU</button>
      <button onClick={() => setLocale("en")} aria-pressed={locale === "en"}>EN</button>
    </div></header>
    <section className={styles.content} aria-busy={state.loading || state.pending || signIn?.state.pending}>
      <a href="/" className={styles.brand} aria-label="Falcon"><span className={styles.brandMark} aria-hidden="true" /></a>
      {state.loading ? <div className={styles.loading} role="status" aria-label={copy.loading}><LoaderCircle size={24} className={styles.spinner} /></div>
        : state.recoveryCodes.length > 0 ? <RecoveryCodes copy={copy} codes={state.recoveryCodes} onContinue={access.acknowledgeCodes} />
        : !state.entrypoint?.available ? <>
          <h1>{state.entrypoint ? copy.unavailable : copy.unknown}</h1>
          <p className={styles.lead}>{state.entrypoint ? copy.unavailableBody : accessError(state.error ?? "SERVICE_UNAVAILABLE", locale)}</p>
          <button className={styles.primary} onClick={() => void access.refresh()}>{copy.retry}</button>
        </> : <>
          <h1 ref={titleRef} tabIndex={-1}>{title}</h1>{lead && <p className={styles.lead}>{lead}</p>}
          {state.error && <p className={styles.error} role="alert">{accessError(state.error, locale)}</p>}
          {signIn?.state.error && <p className={styles.error} role="alert">{signIn.state.error === "PROVIDER_UNAVAILABLE" ? methodCopy.unavailable : methodCopy.error}</p>}
          {stage === "anonymous" && (companyEmail || !signIn ? <LoginForm copy={copy} pending={state.pending} onSubmit={access.login} />
            : step === "methods" ? <SignInMethods signIn={signIn} copy={methodCopy} signup={false} companyLogin={() => setCompanyEmail(true)} />
              : <ProofForm signIn={signIn} copy={methodCopy} organization={state.entrypoint.hostname} />)}
          {stage === "password_change" && <FirstPasswordForm copy={copy} pending={state.pending} onSubmit={access.firstPassword} />}
          {(stage === "mfa_enrollment" || stage === "mfa_challenge") && <MfaForm copy={copy} enrollment={state.enrollment}
            enrolling={stage === "mfa_enrollment"} pending={state.pending} onPrepare={access.prepareMfa} onSubmit={access.verify} />}
          {(stage !== "anonymous" || signIn) && <footer className={styles.footer}>
            {stage !== "anonymous" ? <button className={styles.linkButton} disabled={state.pending} onClick={() => void access.logout()}>
              <ArrowLeft size={16} aria-hidden="true" />{copy.cancel}</button>
              : companyEmail || step !== "methods" ? <button className={styles.linkButton} disabled={state.pending}
                onClick={() => { setCompanyEmail(false); signIn?.back(); }}><ArrowLeft size={16} aria-hidden="true" />{methodCopy.back}</button>
                : <a href="https://tms.saturnusgo.com/signup/">{methodCopy.signupLink}</a>}
          </footer>}
        </>}
      {!state.loading && !state.recoveryCodes.length && stage === "anonymous" && companyEmail && state.entrypoint?.available && <footer className={styles.footer}>
        <details className={styles.help}><summary>{copy.forgotPassword}</summary>
          <div><p>{copy.accessHelp}</p>{contact && <a href={`mailto:${contact}`}>{contact}</a>}</div></details>
      </footer>}
      {!state.loading && !state.entrypoint?.available && contact && <footer className={styles.footer}>
        <span>{copy.accessHelp}</span><a href={`mailto:${contact}`}>{contact}</a>
      </footer>}
    </section>
  </main>;
}
