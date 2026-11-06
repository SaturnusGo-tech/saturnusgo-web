import { useRef, useState } from "react";
import type { AdministrationPort } from "../../../../company-administration/application/ports/administration-port";
import { SessionConfirmation } from "../../../../company-administration/presentation/reauthentication/SessionConfirmation";
import { rememberBrowserContinuation } from "../../../../auth/continuation/application/browser-continuation";
import { CompanyProgressOrb } from "../wizard/progress/CompanyProgressStep";
import wizardCss from "../startup.module.css";
import css from "./identity-confirmation.module.css";
export function BillingIdentityConfirmation({ managed, client, signOut, retry, busy, ru, fullscreen = false }: {
  managed: boolean; client: AdministrationPort | null; signOut(): Promise<void>; retry(): Promise<void>; busy: boolean; ru: boolean; fullscreen?: boolean;
}) {
  const [pending, setPending] = useState(false), [failed, setFailed] = useState(false);
  const signingOut = useRef(false);
  if (managed && client) return <section className={css.identity}><SessionConfirmation client={client} onConfirmed={retry} /></section>;
  const Heading = fullscreen ? "h1" : "h3";
  return <section className={fullscreen ? wizardCss.progress : css.identity} role="status" aria-live="polite" aria-busy={busy || pending}>
    {fullscreen && <CompanyProgressOrb ready={!pending} />}
    <Heading>{pending ? (ru ? "Выходим из аккаунта…" : "Signing out…") : (ru ? "Войдите снова, чтобы продолжить" : "Sign in again to continue")}</Heading>
    <p className={fullscreen ? wizardCss.companyName : undefined}>{ru ? "Данные компании сохранены. После входа в тот же аккаунт продолжим настройку Startup."
      : "Your company details are saved. Sign in to the same account to continue setting up Startup."}</p>
    <button className={fullscreen ? wizardCss.primary : css.primary} type="button" disabled={busy || pending} onClick={async () => {
      if (busy || signingOut.current) return;
      signingOut.current = true; setPending(true); setFailed(false);
      try { rememberBrowserContinuation(); await signOut(); } catch { setFailed(true); }
      finally { signingOut.current = false; setPending(false); }
    }}>{pending ? (ru ? "Выходим…" : "Signing out…") : "OK"}</button>
    {failed && <p className={css.error} role="alert">{ru ? "Не удалось выйти. Нажмите OK, чтобы повторить." : "Could not sign out. Select OK to try again."}</p>}
  </section>;
}
