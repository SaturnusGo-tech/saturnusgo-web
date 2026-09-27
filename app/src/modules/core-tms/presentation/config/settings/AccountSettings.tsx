import { LogOut } from "lucide-react";
import { useState } from "react";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { settingsCopy } from "../navigation/settings-sections";
import styles from "../../../tms.module.css";
import css from "../config.module.css";

export function AccountSettings() {
  const session = useTmsSession();
  const { t, locale } = useTmsLocale();
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  return <section className={css.settingSection}>
    <div className={css.identityRow}>
      <div className={css.settingCopy}>
        <p className={css.settingDescription}>{settingsCopy[locale].currentAccount}</p>
        <h3 className={css.settingTitle}>{session.label || t("auth.account")}</h3>
      </div>
      <div className={css.settingControls}>
        <button type="button" className={styles.secondaryButton} disabled={pending} aria-busy={pending}
          onClick={() => {
            setFailed(false); setPending(true);
            void session.signOut().catch(() => { setFailed(true); setPending(false); });
          }}><LogOut size={15} aria-hidden="true" />{t("auth.signOut")}</button>
      </div>
    </div>
    {failed && <p role="alert" className={css.exchangeError}>{t("auth.logoutError")}</p>}
  </section>;
}
