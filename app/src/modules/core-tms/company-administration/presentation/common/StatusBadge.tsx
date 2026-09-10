import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import styles from "../layout/administration.module.css";

export function StatusBadge({ status, member = false }: { readonly status: string; readonly member?: boolean }) {
  const { locale } = useTmsLocale();
  const copy = administrationCopy(locale);
  const key = member && status === "active" ? "memberActive" : status;
  const label = key in copy ? copy[key as keyof typeof copy] : status;
  return <span className={styles.badge} data-state={status}>{label}</span>;
}
