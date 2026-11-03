import { useState } from "react";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { settingsCopy } from "../navigation/settings-sections";
import css from "../config.module.css";

export function AccountSettings() {
  const session = useTmsSession();
  const { t, locale } = useTmsLocale();
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  return <div className={css.settingSurface}>
    <div className={css.settingRow}>
      <p className={css.settingTitle}>{settingsCopy[locale].currentAccount}</p>
      <span className={css.settingValue}>{session.label || t("auth.account")}</span>
    </div>
    <div className={css.settingRow}>
      <div className={css.settingCopy}>
        <p className={css.settingTitle}>{t("auth.signOut")}</p>
        <p className={css.settingDescription}>{locale === "ru" ? "Завершить текущую сессию в этом браузере." : "End your current session in this browser."}</p>
      </div>
      <button type="button" className={css.signOut} disabled={pending} aria-busy={pending}
        onClick={() => {
          setFailed(false); setPending(true);
          void session.signOut().catch(() => { setFailed(true); setPending(false); });
        }}>{t("auth.signOut")}</button>
    </div>
    {failed && <p role="alert" className={css.exchangeError}>{t("auth.logoutError")}</p>}
  </div>;
}
