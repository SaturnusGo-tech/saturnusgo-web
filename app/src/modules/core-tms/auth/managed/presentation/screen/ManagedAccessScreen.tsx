"use client";

import { LoaderCircle } from "lucide-react";
import type { useManagedAccess } from "../../application/useManagedAccess";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { accessCopy } from "../copy/access-copy";
import { accessError } from "../copy/access-error";
import { LoginForm } from "../forms/LoginForm";
import { FirstPasswordForm } from "../forms/FirstPasswordForm";
import { MfaForm } from "../mfa/MfaForm";
import { RecoveryCodes } from "../mfa/RecoveryCodes";
import styles from "./access.module.css";

export function ManagedAccessScreen({ access }: { readonly access: ReturnType<typeof useManagedAccess> }) {
  const { locale, setLocale } = useTmsLocale();
  const copy = accessCopy(locale);
  const { state } = access;
  const stage = state.session?.stage ?? "anonymous";
  const title = stage === "password_change" ? copy.firstTitle : stage === "mfa_enrollment" ? copy.enrollTitle
    : stage === "mfa_challenge" ? copy.mfaTitle : copy.loginTitle;
  const lead = stage === "password_change" ? copy.firstBody : stage === "mfa_enrollment" ? copy.enrollBody
    : stage === "mfa_challenge" ? copy.mfaBody : null;
  const contact = state.entrypoint?.accessContact;
  return <main className={styles.page}>
    <header className={styles.header}>
      <a href="/" className={styles.brand}><img src="/falcon/falcon-mark-dark.png" alt="" />Falcon</a>
      <div className={styles.language} aria-label={locale === "ru" ? "Язык" : "Language"}>
        <button onClick={() => setLocale("ru")} aria-pressed={locale === "ru"}>RU</button>
        <button onClick={() => setLocale("en")} aria-pressed={locale === "en"}>EN</button>
      </div>
    </header>
    <section className={styles.content} aria-busy={state.loading}>
      {state.loading ? <div className={styles.loading} role="status" aria-label={copy.loading}><LoaderCircle size={24} className={styles.spinner} /></div>
        : state.recoveryCodes.length > 0 ? <RecoveryCodes copy={copy} codes={state.recoveryCodes} onContinue={access.acknowledgeCodes} />
        : !state.entrypoint?.available ? <>
          <h1>{state.entrypoint ? copy.unavailable : copy.unknown}</h1>
          <p className={styles.lead}>{state.entrypoint ? copy.unavailableBody : accessError(state.error ?? "SERVICE_UNAVAILABLE", locale)}</p>
          <button className={styles.primary} onClick={() => void access.refresh()}>{copy.retry}</button>
        </> : <>
          <p className={styles.company}>{state.entrypoint.audience === "platform" ? copy.sandbox : state.entrypoint.name}</p>
          <h1>{title}</h1>{lead && <p className={styles.lead}>{lead}</p>}
          {state.error && <p className={styles.error} role="alert">{accessError(state.error, locale)}</p>}
          {stage === "anonymous" && <LoginForm copy={copy} pending={state.pending} onSubmit={access.login} />}
          {stage === "password_change" && <FirstPasswordForm copy={copy} pending={state.pending} onSubmit={access.firstPassword} />}
          {(stage === "mfa_enrollment" || stage === "mfa_challenge") && <MfaForm copy={copy} enrollment={state.enrollment}
            enrolling={stage === "mfa_enrollment"} pending={state.pending} onPrepare={access.prepareMfa} onSubmit={access.verify} />}
          {stage !== "anonymous" && <div className={styles.footer}><button className={styles.linkButton}
            disabled={state.pending} onClick={() => void access.logout()}>{copy.cancel}</button></div>}
        </>}
      {!state.loading && !state.recoveryCodes.length && <footer className={styles.footer}>
        {contact && <><span>{copy.accessHelp}</span><a href={`mailto:${contact}`}>{contact}</a></>}
      </footer>}
    </section>
  </main>;
}
