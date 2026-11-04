import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { ManagedSecurity } from "../../../profile/security/composition/ManagedSecurity";
import css from "./security.module.css";

export function SecuritySettings() {
  const session = useTmsSession();
  const { locale } = useTmsLocale();
  if (session.kind === "managed") return <ManagedSecurity />;
  return <div className={css.page}>
    <section className={css.section}><h3>{locale === "ru" ? "Вход без пароля" : "Passwordless sign-in"}</h3>
      <p>{locale === "ru" ? "Для входа используйте Google или одноразовый код из письма. Отдельный пароль Falcon для этого аккаунта не нужен." : "Sign in with Google or a one-time email code. This account does not use a separate Falcon password."}</p></section>
    <section className={css.section}><h3>{locale === "ru" ? "Текущий аккаунт" : "Current account"}</h3><p>{session.label}</p>
      <p>{locale === "ru" ? "Завершить текущий вход можно в разделе «Аккаунт и сессия»." : "End your current session in Account and session."}</p></section>
  </div>;
}
