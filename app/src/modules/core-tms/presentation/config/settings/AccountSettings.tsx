import { LogOut, UserRound } from "lucide-react";
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
  return <>
    <div className={css.projectIdentity}><span className={css.projectMark}><UserRound size={23} /></span><div>
      <p>{settingsCopy[locale].currentAccount}</p><h3>{session.label || t("auth.account")}</h3></div></div>
    <div className={css.preferenceRow}><div className={css.preferenceCopy}><strong>{t("config.session")}</strong><span>{settingsCopy[locale].sessionNote}</span></div>
      <button type="button" className={styles.secondaryButton} disabled={pending} onClick={() => {
        setFailed(false); setPending(true); void session.signOut().catch(() => { setFailed(true); setPending(false); });
      }}><LogOut size={15} />{t("auth.signOut")}</button></div>
    {failed && <p role="alert" className={css.exchangeError}>{t("auth.logoutError")}</p>}
  </>;
}
