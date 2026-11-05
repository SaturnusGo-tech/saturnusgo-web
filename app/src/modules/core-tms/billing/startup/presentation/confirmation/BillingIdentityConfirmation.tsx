import { useState } from "react";
import type { AdministrationPort } from "../../../../company-administration/application/ports/administration-port";
import { SessionConfirmation } from "../../../../company-administration/presentation/reauthentication/SessionConfirmation";
export function BillingIdentityConfirmation({ managed, client, signOut, retry, busy, ru }: {
  managed: boolean; client: AdministrationPort | null; signOut(): Promise<void>; retry(): Promise<void>; busy: boolean; ru: boolean;
}) {
  const [pending, setPending] = useState(false), [failed, setFailed] = useState(false);
  return <section role="alert" aria-busy={busy || pending}>
    <h3>{ru ? "Подтвердите свою личность перед оплатой" : "Confirm your identity before checkout"}</h3>
    <p>{ru ? "Для Startup нужно подтверждение входа за последние 10 минут. Сохранённые данные компании и то же действие оплаты сохранятся."
      : "Startup needs identity confirmation within the last 10 minutes. Your saved company setup and the same checkout action will be retained."}</p>
    {managed && client ? <SessionConfirmation client={client} onConfirmed={retry} /> : <>
      <p>{ru ? "Выйдите и войдите снова в тот же аккаунт. Затем откройте биллинг этого пространства и повторите оплату."
        : "Sign out and sign in to the same account again. Then open this workspace’s billing and retry checkout."}</p>
      <button type="button" disabled={busy || pending} onClick={async () => {
        if (busy || pending) return; setPending(true); setFailed(false);
        try { await signOut(); } catch { setFailed(true); } finally { setPending(false); }
      }}>{ru ? "Выйти и войти снова" : "Sign out and sign in again"}</button>
      <button type="button" disabled={busy || pending} onClick={() => { if (!busy && !pending) return retry(); }}>{ru ? "Повторить оплату после входа" : "Retry checkout after signing in"}</button>
      {failed && <p role="alert">{ru ? "Не удалось выйти. Повторите попытку." : "Could not sign out. Please try again."}</p>}
    </>}
  </section>;
}
