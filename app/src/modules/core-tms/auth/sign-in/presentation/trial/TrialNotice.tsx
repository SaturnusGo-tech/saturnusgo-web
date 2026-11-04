"use client";
import { ArrowUpRight, BookOpen, Folder, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { TrialStatus } from "../../domain/sign-in";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { useOptionalTmsSession } from "../../../presentation/session/TmsSessionContext";
import { documentationLink } from "../../../../documentation/navigation/documentation-link";
import { welcomeCopy } from "./welcome-copy";
import { useWelcomeVisibility } from "./state/useWelcomeVisibility";
import styles from "./trial.module.css";

export function TrialNotice({ trial }: { readonly trial: TrialStatus }) {
  const { locale } = useTmsLocale();
  const session = useOptionalTmsSession();
  const copy = welcomeCopy(locale);
  const titleId = useId();
  const key = `falcon:welcome:v2:${session?.subject ?? "personal"}:${session?.workspaceId ?? ""}:${trial.startsAt ?? trial.expiresAt}:${trial.readOnly ? "expired" : "active"}`;
  const { visible, dismiss } = useWelcomeVisibility(key);
  const [guide, setGuide] = useState("?view=help&article=create-test-case");
  useEffect(() => {
    const updateGuide = () => setGuide(documentationLink(window.location.href, "create-test-case"));
    updateGuide();
    window.addEventListener("falcon:navigation", updateGuide);
    window.addEventListener("popstate", updateGuide);
    return () => {
      window.removeEventListener("falcon:navigation", updateGuide);
      window.removeEventListener("popstate", updateGuide);
    };
  }, []);
  if (trial.kind !== "personal" || !trial.expiresAt || !visible) return null;
  const expires = new Date(trial.expiresAt), starts = trial.startsAt ? new Date(trial.startsAt) : null;
  if (!Number.isFinite(expires.getTime())) return null;
  const language = locale === "ru" ? "ru-RU" : "en-US";
  const end = expires.toLocaleDateString(language, { day: "numeric", month: "long" });
  return <aside className={`${styles.notice} ${trial.readOnly ? styles.expired : ""}`} aria-labelledby={titleId}>
    <button className={styles.close} aria-label={copy.close} onClick={dismiss}><X size={17} strokeWidth={1.6} aria-hidden="true" /></button>
    {trial.readOnly ? <><h2 id={titleId}>{copy.expired}</h2><p className={styles.description}>{copy.readonly}</p></> : <>
      <div className={styles.meta}>
        {starts && Number.isFinite(starts.getTime()) && <time dateTime={trial.startsAt!}>{starts.toLocaleDateString(language, { day: "numeric", month: "short" })}</time>}
        <span className={styles.new}>{copy.new}</span>
      </div>
      <h2 id={titleId}>{copy.title}</h2>
      <p className={styles.description}>{copy.body}</p>
      <div className={styles.artwork}><img src="/falcon/onboarding/welcome-workspace-20261104.webp" width={1050} height={510} alt="" /></div>
      <div className={styles.trial}><span>{copy.trial}</span><span>{copy.until} <time dateTime={trial.expiresAt}>{end}</time></span></div>
      <ol className={styles.steps}>
        <li><span className={styles.stepIcon}><Folder size={16} strokeWidth={1.6} aria-hidden="true" /></span><div><h3>{copy.folders}</h3><p>{copy.foldersBody}</p></div></li>
        <li><span className={styles.stepIcon}><BookOpen size={16} strokeWidth={1.6} aria-hidden="true" /></span><div><h3>{copy.cases}</h3><p>{copy.casesBody}</p></div></li>
      </ol>
      <a className={styles.guide} href={guide} onClick={dismiss}>{copy.guide}<ArrowUpRight size={16} aria-hidden="true" /></a>
    </>}
  </aside>;
}
