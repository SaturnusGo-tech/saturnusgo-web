"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { demoCopy } from "./content/copy";
import { DemoRequestError, requestDemo, validateDemoEmail, type DemoFailure, type DemoLocale } from "./data/request";
import styles from "./demo.module.css";

type State = "idle" | "sending" | "success" | DemoFailure;
export function FalconDemoForm({ locale }: { locale: DemoLocale }) {
  const copy = demoCopy[locale];
  const id = useId();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [fieldError, setFieldError] = useState<"email" | "consent" | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const websiteRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const pending = useRef<AbortController | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; pending.current?.abort(); };
  }, []);
  useEffect(() => {
    if (state !== "idle" && state !== "sending") statusRef.current?.focus();
  }, [state]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || state === "success") return;
    const invalid = !validateDemoEmail(email) ? "email" : !consent ? "consent" : null;
    setFieldError(invalid);
    if (invalid) { (invalid === "email" ? emailRef : consentRef).current?.focus(); return; }
    const controller = new AbortController();
    pending.current = controller;
    setState("sending");
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      await requestDemo({ email, locale, consent, website: websiteRef.current?.value ?? "" }, controller.signal);
      if (mounted.current) setState("success");
    } catch (error) {
      if (mounted.current) setState(error instanceof DemoRequestError ? error.kind : "unavailable");
    } finally {
      window.clearTimeout(timeout);
      if (pending.current === controller) pending.current = null;
    }
  }

  const busy = state === "sending";
  const failed = state === "invalid" || state === "rate" || state === "unavailable";
  return <section className={styles.section} id="demo" aria-labelledby={`${id}-title`} lang={locale}>
    <div className={styles.intro}>
      <p className={styles.eyebrow}>{copy.eyebrow}</p>
      <h2 id={`${id}-title`}>{copy.title}</h2>
      <p className={styles.lead}>{copy.lead}</p>
    </div>
    <form className={styles.form} onSubmit={submit} noValidate aria-busy={busy}>
      {state !== "success" && <>
        <label className={styles.emailLabel} htmlFor={`${id}-email`}>{copy.email}</label>
        <div className={styles.row}>
          <input ref={emailRef} id={`${id}-email`} name="email" type="email" autoComplete="email" inputMode="email"
            required maxLength={254} value={email} placeholder={copy.placeholder} disabled={busy}
            aria-invalid={fieldError === "email"} aria-describedby={fieldError === "email" ? `${id}-field-error` : undefined}
            onChange={event => { setEmail(event.target.value); if (fieldError === "email") setFieldError(null); }} />
          <button type="submit" disabled={busy}>{busy ? copy.sending : copy.submit}<span aria-hidden="true">↗</span></button>
        </div>
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor={`${id}-website`}>{copy.website}</label>
          <input ref={websiteRef} id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <div className={styles.consent}>
          <input ref={consentRef} id={`${id}-consent`} name="consent" type="checkbox" required checked={consent} disabled={busy}
            aria-invalid={fieldError === "consent"} aria-describedby={fieldError === "consent" ? `${id}-field-error` : undefined}
            onChange={event => { setConsent(event.target.checked); if (fieldError === "consent") setFieldError(null); }} />
          <label htmlFor={`${id}-consent`}>{copy.consent}{" "}<a href={`/privacy/?lang=${locale}`} target="_blank" rel="noopener noreferrer">{copy.policy}</a>{copy.consentEnd}</label>
        </div>
        {fieldError && <p className={styles.error} id={`${id}-field-error`} role="alert">{fieldError === "email" ? copy.invalidEmail : copy.missingConsent}</p>}
        <p className={styles.note}>{copy.note}</p>
      </>}
      <p ref={statusRef} id={`${id}-status`} className={failed ? styles.error : styles.status} role={failed ? "alert" : "status"} tabIndex={-1}>
        {state === "success" ? copy.success : failed ? <>{copy[state]}{" "}<a href="mailto:mercury143143@yahoo.com">{copy.contact}</a></> : ""}
      </p>
    </form>
  </section>;
}
