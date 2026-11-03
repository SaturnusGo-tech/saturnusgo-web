import { useId } from "react";
import { useColorMode } from "../../../../../shared/_hooks/useColorMode";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import css from "../config.module.css";
import appearance from "./appearance/appearance-settings.module.css";

export function AppearanceSettings() {
  const { locale, setLocale, t } = useTmsLocale();
  const { isLight, toggleAnimated } = useColorMode();
  const themeId = useId(); const languageId = useId();
  function changeTheme(target: HTMLInputElement) {
    if (!target.checked || !["light", "dark"].includes(target.value) || target.value === (isLight ? "light" : "dark")) return;
    const rect = (target.closest("label") ?? target).getBoundingClientRect();
    toggleAnimated({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }
  return <div className={`${css.settingSurface} ${appearance.surface}`}>
    <div className={`${css.settingRow} ${appearance.row}`}>
      <div className={css.settingCopy}>
        <p id={`${themeId}-label`} className={css.settingTitle}>{locale === "ru" ? "Тема" : "Theme"}</p>
        <p id={`${themeId}-hint`} className={css.settingDescription}>{t("config.appearanceHint")}</p>
      </div>
      <div className={appearance.choices} role="radiogroup" aria-orientation="horizontal" aria-labelledby={`${themeId}-label`} aria-describedby={`${themeId}-hint`}>
        {(["light", "dark"] as const).map(value => <label key={value} className={appearance.choice} data-selected={(isLight ? value === "light" : value === "dark") || undefined}>
          <input type="radio" name={themeId} value={value} checked={isLight ? value === "light" : value === "dark"}
            onChange={event => changeTheme(event.currentTarget)} />
          <span>{t(value === "light" ? "config.lightMode" : "config.darkMode")}</span>
        </label>)}
      </div>
    </div>
    <div className={`${css.settingRow} ${appearance.row}`}>
      <div className={css.settingCopy}>
        <p id={`${languageId}-label`} className={css.settingTitle}>{t("config.language")}</p>
        <p id={`${languageId}-hint`} className={css.settingDescription}>{t("config.languageHint")}</p>
      </div>
      <div className={appearance.choices} role="radiogroup" aria-orientation="horizontal" aria-labelledby={`${languageId}-label`} aria-describedby={`${languageId}-hint`}>
        {(["en", "ru"] as const).map(value => <label key={value} className={appearance.choice} data-selected={locale === value || undefined}>
          <input type="radio" name={languageId} value={value} checked={locale === value} onChange={event => {
            const next = event.currentTarget.value;
            if (event.currentTarget.checked && next !== locale && (next === "en" || next === "ru")) setLocale(next);
          }} />
          <span>{t(value === "en" ? "language.english" : "language.russian")}</span>
        </label>)}
      </div>
    </div>
  </div>;
}
