import { Link2, Plus } from "lucide-react";
import { EmptyState } from "../common/empty/EmptyState";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import styles from "../../tms.module.css";
export function HooksView() {
  const { t } = useTmsLocale();
  return <div className={`${styles.pane} ${styles.centeredPane}`}><EmptyState icon={<Link2 size={36} />} title={t("hooks.title")} text={t("hooks.description")} action={<button className={styles.secondaryButton} disabled><Plus size={16} /> {t("hooks.addLater")}</button>} /></div>;
}
