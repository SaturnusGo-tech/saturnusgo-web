import type { CompanyDraft } from "../../domain/administration";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import styles from "../layout/administration.module.css";

export function CapabilityFields({ value, onChange, disabled }: {
  readonly value: CompanyDraft["capabilities"]; readonly onChange: (value: CompanyDraft["capabilities"]) => void; readonly disabled: boolean;
}) {
  const { locale } = useTmsLocale();
  const choices = [{ id: "core", ru: "Тестирование", en: "Test management" }, { id: "analytics", ru: "Аналитика", en: "Analytics" },
    { id: "integrations", ru: "Интеграции", en: "Integrations" }, { id: "api_testing", ru: "API-тестирование", en: "API testing" },
    { id: "automation", ru: "Автоматизация", en: "Automation" }] as const;
  return <div className={styles.checks}>{choices.map((item) => <label key={item.id}>
    <input type="checkbox" checked={value.includes(item.id)} disabled={disabled || item.id === "core"}
      onChange={(event) => onChange(event.target.checked ? [...value, item.id] : value.filter((id) => id !== item.id))} />{item[locale]}
  </label>)}</div>;
}
