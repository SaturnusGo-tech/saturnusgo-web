"use client";
import { Button } from "@heroui/react";
import { ExternalLink } from "lucide-react";
import { ErrorToast } from "../../../presentation/common/error/ErrorToast";
import type { useGoogleLink } from "../application/useGoogleLink";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import styles from "./google-link.module.css";
export function GoogleLinkAction({ model, desktop }: { readonly model: ReturnType<typeof useGoogleLink>; readonly desktop: boolean }) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  if (!model.state.available) return null;
  const error = model.state.error ? (/SESSION|LINK_REQUIRED|MFA|AUTHENTICATION/.test(model.state.error)
    ? (ru ? "Подтвердите вход в свою компанию и повторите попытку." : "Complete your company sign-in verification and try again.")
    : (ru ? "Не удалось связать Google. Повторите попытку." : "Could not connect Google. Please try again.")) : null;
  return <div className={styles.root}>
    <div className={styles.copy}><h3>Google</h3><p className={styles.hint}>{desktop
      ? (ru ? "Свяжите Google с аккаунтом компании через браузер." : "Connect Google to your company account in the browser.")
      : (ru ? "Используйте Google для входа в аккаунт компании." : "Use Google to sign in to your company account.")}</p></div>
    {desktop ? <a href="/desktop-open-profile/" className={styles.action}>{ru ? "Связать в браузере" : "Connect in browser"}<ExternalLink size={14} aria-hidden="true"/></a>
      : <Button variant="bordered" radius="full" size="sm" className={styles.action} isDisabled={model.state.pending} aria-busy={model.state.pending} onClick={() => void model.link()}>
        {model.state.pending ? (ru ? "Открываем…" : "Opening…") : (ru ? "Связать Google" : "Connect Google")}
      </Button>}
    <ErrorToast message={error}/>
  </div>;
}
