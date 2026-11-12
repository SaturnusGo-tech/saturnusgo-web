import { Button } from "@heroui/react";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import type { AdministrationPort } from "../../../company-administration/application/ports/administration-port";
import type { Profile } from "../../../company-administration/domain/administration";
import { ProfilePasswordForm } from "../../../company-administration/presentation/profile/ProfilePasswordForm";
import { ProfileSessions } from "../../../company-administration/presentation/devices/ProfileSessions";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useSecurityDialog } from "../application/useSecurityDialog";
import { SecurityRow } from "./SecurityRow";
import { SecurityDialog } from "./dialog/SecurityDialog";
import styles from "./security-settings.module.css";

export function SecurityPanel({ profile, client, google }: { profile: Profile; client: AdministrationPort; google: ReactNode }) {
  const { locale } = useTmsLocale(), ru = locale === "ru";
  const dialog = useSecurityDialog();
  return <div className={styles.page} data-security-settings>
    <SecurityRow title={ru ? "Электронная почта" : "Email address"} description={profile.email}>
      <span className={styles.status}>{profile.emailVerified && <Check size={15} aria-hidden="true"/>}
        {profile.emailVerified ? (ru ? "Подтверждена" : "Verified") : (ru ? "Не подтверждена" : "Not verified")}</span>
    </SecurityRow>
    <SecurityRow title={ru ? "Пароль" : "Password"} description={ru ? "Пароль для входа в аккаунт компании." : "Your password for this company account."}>
      <Button variant="bordered" radius="full" size="sm" className={styles.action} onPress={() => dialog.open("password")}>{ru ? "Изменить пароль" : "Change password"}</Button>
    </SecurityRow>
    {google}
    <SecurityRow title={ru ? "Двухфакторная аутентификация" : "Two-factor authentication"}
      description={ru ? "Дополнительное подтверждение при входе в аккаунт." : "An extra verification step when you sign in."}>
      <span className={styles.status}>{profile.mfaEnabled && <Check size={15} aria-hidden="true"/>}{profile.mfaEnabled ? (ru ? "Включена" : "Enabled") : (ru ? "Не включена" : "Not enabled")}</span>
    </SecurityRow>
    <SecurityRow title={ru ? "Устройства и сессии" : "Devices and sessions"}
      description={ru ? "Просматривайте устройства и завершайте другие сессии." : "Review your devices and end other sessions."}>
      <Button variant="bordered" radius="full" size="sm" className={styles.action} onPress={() => dialog.open("sessions")}>{ru ? "Управлять" : "Manage"}</Button>
    </SecurityRow>
    {dialog.screen && <SecurityDialog title={dialog.screen === "password" ? (ru ? "Изменить пароль" : "Change password") : (ru ? "Устройства и сессии" : "Devices and sessions")}
      pending={dialog.pending} onClose={dialog.close}>
      {dialog.screen === "password" ? <ProfilePasswordForm profile={profile} client={client} onPendingChange={dialog.setPending} onSaved={dialog.close}/>
        : <ProfileSessions client={client} version={0} showHeading={false} onPendingChange={dialog.setPending}/>}
    </SecurityDialog>}
  </div>;
}
