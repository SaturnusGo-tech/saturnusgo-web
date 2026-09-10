import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import { administrationError } from "../copy/administration-errors";
import styles from "../layout/administration.module.css";

export function ResourceState({ loading, error, retry }: { readonly loading: boolean; readonly error: string | null; readonly retry: () => void }) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  return loading ? <div className={styles.loading} role="status" aria-label={locale === "ru" ? "Загрузка" : "Loading"}>
    <div className={styles.skeleton} /><div className={styles.skeleton} /><div className={styles.skeleton} />
  </div> : <div><p role="alert" className={styles.error}>{administrationError(error ?? "SERVICE_UNAVAILABLE", locale)}</p>
    <button className={styles.button} onClick={retry}>{copy.retry}</button></div>;
}
