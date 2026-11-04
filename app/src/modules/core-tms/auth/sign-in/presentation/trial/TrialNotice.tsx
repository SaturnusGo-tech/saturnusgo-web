"use client";
import { X } from "lucide-react";
import { useState } from "react";
import type { TrialStatus } from "../../domain/sign-in";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { signInCopy } from "../copy/sign-in-copy";
import styles from "./trial.module.css";

export function TrialNotice({ trial }: { readonly trial: TrialStatus }) {
  const { locale } = useTmsLocale();
  const copy = signInCopy(locale);
  const [dismissed, setDismissed] = useState(false);
  const [payment, setPayment] = useState(false);
  if (trial.kind !== "personal" || !trial.expiresAt || dismissed) return null;
  const end = new Date(trial.expiresAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "long", year: "numeric" });
  return <aside className={styles.notice} aria-label={trial.readOnly ? copy.readonly : copy.trial}>
    <button className={styles.close} aria-label={copy.close} onClick={() => setDismissed(true)}><X size={16} aria-hidden="true" /></button>
    <strong>{trial.readOnly ? copy.readonly : copy.trial}</strong>
    <p>{copy.ends} {end}</p>
    <button className={styles.team} onClick={() => setPayment(true)}>{copy.team}</button>
    {payment && <p className={styles.payment} role="status">{copy.payment}</p>}
  </aside>;
}
