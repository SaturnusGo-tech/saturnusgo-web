import { Moon, Sun } from "lucide-react";
import { useColorMode } from "../../../../../shared/_hooks/useColorMode";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import type { TmsLocale } from "../../../localization/model/locale";
import surface from "../config.module.css";

const languages: Array<{ id: TmsLocale; short: string }> = [
  { id: "en", short: "EN" },
  { id: "ru", short: "RU" },
];

export function AppearanceSettings() {
  const { locale, setLocale, t } = useTmsLocale();
  const { isLight, toggleAnimated } = useColorMode();

  return (
    <section className={surface.preferenceSection} aria-labelledby="interface-settings-title">
      <h3 className={surface.visuallyHidden} id="interface-settings-title">{t("config.interface")}</h3>
      <div className={surface.themeRow}>
        <div className={surface.preferenceCopy}>
          <strong>{t("config.appearance")}</strong>
          <span>{t("config.appearanceHint")}</span>
        </div>
        <div className={surface.themeChoices} role="group" aria-label={t("config.appearance")}>
          <button
            type="button"
            data-active={isLight}
            aria-pressed={isLight}
            onClick={(event) => isLight || toggleAnimated({ x: event.clientX, y: event.clientY })}
          >
            <span className={surface.themePreview} data-theme="light" aria-hidden="true"><i /><span><b /><b /><b /></span></span><Sun size={15} /> {t("config.lightMode")}
          </button>
          <button
            type="button"
            data-active={!isLight}
            aria-pressed={!isLight}
            onClick={(event) => !isLight || toggleAnimated({ x: event.clientX, y: event.clientY })}
          >
            <span className={surface.themePreview} data-theme="dark" aria-hidden="true"><i /><span><b /><b /><b /></span></span><Moon size={15} /> {t("config.darkMode")}
          </button>
        </div>
      </div>
      <div className={surface.preferenceRow}>
        <div className={surface.preferenceCopy}>
          <strong>{t("config.language")}</strong>
          <span>{t("config.languageHint")}</span>
        </div>
        <div className={surface.choiceGroup} role="group" aria-label={t("language.label")}>
          {languages.map((language) => {
            const name = t(language.id === "en" ? "language.english" : "language.russian");
            return (
              <button
                key={language.id}
                type="button"
                data-active={locale === language.id}
                aria-pressed={locale === language.id}
                onClick={() => setLocale(language.id)}
              >
                {language.short} <span>{name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
