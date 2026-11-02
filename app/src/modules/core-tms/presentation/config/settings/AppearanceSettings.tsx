import { useId } from "react";
import { useColorMode } from "../../../../../shared/_hooks/useColorMode";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import css from "../config.module.css";

export function AppearanceSettings() {
  const { locale, setLocale, t } = useTmsLocale();
  const { isLight, toggleAnimated } = useColorMode();
  const themeId = useId(); const languageId = useId();
  return <div className={css.settingSurface}>
    <div className={css.settingRow}>
      <div className={css.settingCopy}>
        <label htmlFor={themeId} className={css.settingTitle}>{locale === "ru" ? "Тема" : "Theme"}</label>
        <p className={css.settingDescription}>{t("config.appearanceHint")}</p>
      </div>
      <select id={themeId} className={css.select} value={isLight ? "light" : "dark"} onChange={event => {
        if (event.target.value === (isLight ? "light" : "dark")) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        toggleAnimated({ x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 });
      }}>
        <option value="light">{t("config.lightMode")}</option>
        <option value="dark">{t("config.darkMode")}</option>
      </select>
    </div>
    <div className={css.settingRow}>
      <div className={css.settingCopy}>
        <label htmlFor={languageId} className={css.settingTitle}>{t("config.language")}</label>
        <p className={css.settingDescription}>{t("config.languageHint")}</p>
      </div>
      <select id={languageId} className={css.select} value={locale} onChange={event => {
        const next = event.target.value;
        if (next === "en" || next === "ru") setLocale(next);
      }}>
        <option value="en">{t("language.english")}</option>
        <option value="ru">{t("language.russian")}</option>
      </select>
    </div>
  </div>;
}
