"use client";
import { ExternalLink, Link2 } from "lucide-react";
import type { useGoogleLink } from "../application/useGoogleLink";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import styles from "./google-link.module.css";
export function GoogleLinkAction({ model, desktop }: { readonly model: ReturnType<typeof useGoogleLink>; readonly desktop: boolean }) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  if (!model.state.available) return null;
  return <div className={styles.root}>
    {desktop ? <a href="/desktop-open-profile/" className={styles.action}><ExternalLink size={17} aria-hidden="true" />
      {ru ? "Связать Google в браузере" : "Connect Google in browser"}</a>
      : <button className={styles.action} disabled={model.state.pending} aria-busy={model.state.pending} onClick={() => void model.link()}>
        <Link2 size={17} aria-hidden="true" />{model.state.pending ? (ru ? "Открываем Google…" : "Opening Google…") : (ru ? "Связать Google" : "Connect Google")}
      </button>}
    <p className={styles.hint}>{desktop
      ? (ru ? "Откройте свой профиль и подтвердите вход в компанию в браузере, затем выберите «Связать Google»." : "Open your profile and complete company sign-in in the browser, then choose Connect Google.")
      : (ru ? "Подключите Google к этой учётной записи компании." : "Connect Google to this signed-in company account.")}</p>
    {model.state.error && <p className={styles.error} role="alert">{/SESSION|LINK_REQUIRED|MFA|AUTHENTICATION/.test(model.state.error)
      ? (ru ? "Подтвердите вход в свою компанию и повторите попытку." : "Complete your company sign-in verification and try again.")
      : (ru ? "Не удалось связать Google. Повторите попытку." : "Could not connect Google. Please try again.")}</p>}
  </div>;
}
