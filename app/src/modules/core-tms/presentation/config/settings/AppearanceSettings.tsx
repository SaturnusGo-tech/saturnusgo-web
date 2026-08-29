import { Moon, Sun } from "lucide-react";
import { useColorMode } from "../../../../../shared/_hooks/useColorMode";
import { TmsSessionControl } from "../../../auth/presentation/session/TmsSessionControl";
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
      <div className={surface.sectionLabel}>
        <h2 id="interface-settings-title">{t("config.interface")}</h2>
      </div>
      <div className={surface.preferenceRow}>
        <div className={surface.preferenceCopy}>
          <strong>{t("config.appearance")}</strong>
          <span>{t("config.appearanceHint")}</span>
        </div>
        <div className={surface.choiceGroup} role="group" aria-label={t("config.appearance")}>
          <button
            type="button"
            data-active={isLight}
            aria-pressed={isLight}
            onClick={(event) => isLight || toggleAnimated({ x: event.clientX, y: event.clientY })}
          >
            <Sun size={15} /> {t("config.lightMode")}
          </button>
          <button
            type="button"
            data-active={!isLight}
            aria-pressed={!isLight}
            onClick={(event) => !isLight || toggleAnimated({ x: event.clientX, y: event.clientY })}
          >
            <Moon size={15} /> {t("config.darkMode")}
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
      <div className={surface.preferenceRow}>
        <div className={surface.preferenceCopy}>
          <strong>{t("config.session")}</strong>
          <span>{t("config.sessionHint")}</span>
        </div>
        <TmsSessionControl />
      </div>
    </section>
  );
}
