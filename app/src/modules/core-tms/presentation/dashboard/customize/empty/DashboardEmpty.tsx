import { Plus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import styles from "../layout.module.css";

export function DashboardEmpty({ editing, canEdit, onCreate }: { editing: boolean; canEdit: boolean; onCreate: () => void }) {
  const { t } = useTmsLocale(); const reduced = useReducedMotion();
  return <motion.section className={styles.empty} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}>
    <img className={styles.illustration} src="/falcon/dashboard/cover-library.webp" width={360} height={240} alt="" />
    <h2>{t(editing ? "dashboardLayout.emptyDraft" : "dashboardLayout.emptyTitle")}</h2>
    <p>{t(editing ? "dashboardLayout.emptyDraftText" : "dashboardLayout.emptyText")}</p>
    {canEdit ? <button type="button" className={styles.primary} onClick={onCreate}><Plus size={16} />{t(editing ? "dashboardLayout.add" : "dashboardLayout.create")}</button>
      : <small>{t("dashboardLayout.readOnlyEmpty")}</small>}
  </motion.section>;
}
