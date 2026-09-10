import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import styles from "./permissions.module.css";

export function CompanyFeatureUnavailable({ onReturn }: { readonly onReturn: () => void }) {
  const { locale } = useTmsLocale();
  return <section className={styles.state} aria-labelledby="company-feature-title">
    <h2 id="company-feature-title">{locale === "ru" ? "Раздел не подключён" : "This section is not enabled"}</h2>
    <p>{locale === "ru" ? "Подключение возможностей можно обсудить с администратором компании." : "Contact your company administrator to discuss enabling this feature."}</p>
    <button onClick={onReturn}>{locale === "ru" ? "К тест-кейсам" : "Go to test cases"}</button>
  </section>;
}
