import { Moon, Sun } from "lucide-react";
import { useId } from "react";
import { useColorMode } from "../../../../../shared/_hooks/useColorMode";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import type { TmsLocale } from "../../../localization/model/locale";
import css from "../config.module.css";

const languages: TmsLocale[] = ["en", "ru"];

export function AppearanceSettings() {
  const { locale, setLocale, t } = useTmsLocale();
  const { isLight, toggleAnimated } = useColorMode();
  const languageGroup = useId();
  const appearanceTitle = useId();
  const languageTitle = useId();
  return <div className={css.settingsStack}>
    <section className={css.settingSection} aria-labelledby={appearanceTitle}>
      <div className={css.settingCopy}>
        <h3 id={appearanceTitle} className={css.settingTitle}>{t("config.appearance")}</h3>
        <p className={css.settingDescription}>{t("config.appearanceHint")}</p>
      </div>
      <div className={css.themeChoices} role="group" aria-label={t("config.appearance")}>
        <button type="button" className={css.themeCard} data-active={isLight} aria-pressed={isLight}
          onClick={(event) => isLight || toggleAnimated({ x: event.clientX, y: event.clientY })}>
          <span className={css.themePreview} data-theme="light" aria-hidden="true"><i /><span><b /><b /><b /></span></span>
          <Sun size={15} aria-hidden="true" /> {t("config.lightMode")}
        </button>
        <button type="button" className={css.themeCard} data-active={!isLight} aria-pressed={!isLight}
          onClick={(event) => !isLight || toggleAnimated({ x: event.clientX, y: event.clientY })}>
          <span className={css.themePreview} data-theme="dark" aria-hidden="true"><i /><span><b /><b /><b /></span></span>
          <Moon size={15} aria-hidden="true" /> {t("config.darkMode")}
        </button>
      </div>
    </section>
    <section className={css.settingSection} aria-labelledby={languageTitle}>
      <h3 id={languageTitle} className={css.settingTitle}>{t("config.language")}</h3>
      <div className={css.languageOptions} role="radiogroup" aria-labelledby={languageTitle}>
        {languages.map((language) => <label key={language}>
          <input type="radio" name={languageGroup} value={language} checked={locale === language}
            onChange={() => setLocale(language)} />
          <span>{t(language === "en" ? "language.english" : "language.russian")}</span>
        </label>)}
      </div>
    </section>
  </div>;
}
