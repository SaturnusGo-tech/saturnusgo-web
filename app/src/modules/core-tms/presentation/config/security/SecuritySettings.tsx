import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { ManagedSecurity } from "../../../profile/security/composition/ManagedSecurity";
import { SecurityRow } from "../../../profile/security/presentation/SecurityRow";
import css from "../../../profile/security/presentation/security-settings.module.css";

export function SecuritySettings() {
  const session = useTmsSession();
  const { locale } = useTmsLocale();
  if (session.kind === "managed") return <ManagedSecurity key={`${session.workspaceId}:${session.subject}`} />;
  return <div className={css.page}>
    <SecurityRow title={locale === "ru" ? "Текущий аккаунт" : "Current account"} description={session.label}/>
    <SecurityRow title={locale === "ru" ? "Вход и защита" : "Sign-in and security"}
      description={locale === "ru" ? "Настройки входа доступны у провайдера, через которого вы вошли в Falcon." : "Manage sign-in security with the provider you used to access Falcon."}/>
    <SecurityRow title={locale === "ru" ? "Текущая сессия" : "Current session"}
      description={locale === "ru" ? "Чтобы выйти из Falcon на этом устройстве, откройте «Аккаунт и сессия»." : "To sign out of Falcon on this device, open Account and session."}/>
  </div>;
}
