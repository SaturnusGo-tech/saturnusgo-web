import { useId } from "react";
import { useColorMode } from "../../../../../shared/_hooks/useColorMode";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { AppearanceDropdown } from "./dropdown/AppearanceDropdown";
import css from "../config.module.css";

export function AppearanceSettings() {
  const { locale, setLocale, t } = useTmsLocale();
  const { isLight, toggleAnimated } = useColorMode();
  const themeId = useId(); const languageId = useId();
  return <div className={css.settingSurface}>
    <div className={css.settingRow}>
      <div className={css.settingCopy}>
        <label id={`${themeId}-label`} htmlFor={themeId} className={css.settingTitle}>{locale === "ru" ? "Тема" : "Theme"}</label>
        <p id={`${themeId}-hint`} className={css.settingDescription}>{t("config.appearanceHint")}</p>
      </div>
      <AppearanceDropdown id={themeId} labelledBy={`${themeId}-label`} describedBy={`${themeId}-hint`}
        value={isLight ? "light" : "dark"}
        options={[{ value: "light", label: t("config.lightMode") }, { value: "dark", label: t("config.darkMode") }]}
        onChange={(next, origin) => { if (next !== (isLight ? "light" : "dark")) toggleAnimated(origin); }} />
    </div>
    <div className={css.settingRow}>
      <div className={css.settingCopy}>
        <label id={`${languageId}-label`} htmlFor={languageId} className={css.settingTitle}>{t("config.language")}</label>
        <p id={`${languageId}-hint`} className={css.settingDescription}>{t("config.languageHint")}</p>
      </div>
      <AppearanceDropdown id={languageId} labelledBy={`${languageId}-label`} describedBy={`${languageId}-hint`} value={locale}
        options={[{ value: "en", label: t("language.english") }, { value: "ru", label: t("language.russian") }]}
        onChange={next => { if (next === "en" || next === "ru") setLocale(next); }} />
    </div>
  </div>;
}
