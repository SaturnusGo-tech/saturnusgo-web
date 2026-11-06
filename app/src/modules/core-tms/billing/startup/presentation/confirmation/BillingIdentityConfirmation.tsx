import { useState } from "react";
import type { AdministrationPort } from "../../../../company-administration/application/ports/administration-port";
import { SessionConfirmation } from "../../../../company-administration/presentation/reauthentication/SessionConfirmation";
import css from "./identity-confirmation.module.css";
export function BillingIdentityConfirmation({ managed, client, signOut, retry, busy, ru }: {
  managed: boolean; client: AdministrationPort | null; signOut(): Promise<void>; retry(): Promise<void>; busy: boolean; ru: boolean;
}) {
  const [pending, setPending] = useState(false), [failed, setFailed] = useState(false);
  return <section className={css.identity} role="alert" aria-busy={busy || pending}>
    {managed && client ? <SessionConfirmation client={client} onConfirmed={retry} /> : <>
      <div className={css.copy}><h3>{ru ? "Войдите снова, чтобы продолжить" : "Sign in again to continue"}</h3>
        <p>{ru ? "Подтвердите вход в тот же аккаунт, затем вернитесь к оплате. Данные компании сохранены."
          : "Confirm the same account, then return to checkout. Your saved company setup is retained."}</p></div>
      <div className={css.actions}><button className={css.primary} type="button" disabled={busy || pending} onClick={async () => {
        if (busy || pending) return; setPending(true); setFailed(false);
        try { await signOut(); } catch { setFailed(true); } finally { setPending(false); }
      }}>{ru ? "Войти снова" : "Sign in again"}</button>
      <button className={css.secondary} type="button" disabled={busy || pending} onClick={() => { if (!busy && !pending) return retry(); }}>{ru ? "Уже вошли? Продолжить оплату" : "Already signed in? Retry checkout"}</button></div>
      {failed && <p className={css.error} role="alert">{ru ? "Не удалось выйти. Повторите попытку." : "Could not sign out. Please try again."}</p>}
    </>}
  </section>;
}
