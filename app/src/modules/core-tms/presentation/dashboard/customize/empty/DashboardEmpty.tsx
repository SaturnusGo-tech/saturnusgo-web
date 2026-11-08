import { Plus } from "lucide-react";
import { PiSquaresFour } from "react-icons/pi";
import { motion, useReducedMotion } from "framer-motion";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import styles from "../layout.module.css";

export function DashboardEmpty({ editing, personal, canEdit, onAdd }: { editing: boolean; personal: boolean; canEdit: boolean; onAdd: () => void }) {
  const { t } = useTmsLocale(); const reduced = useReducedMotion();
  return <motion.section className={styles.empty} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}>
    <PiSquaresFour className={styles.illustration} size={44} aria-hidden="true" />
    <h2>{t(editing ? "dashboardLayout.emptyDraft" : "dashboardLayout.emptyTitle")}</h2>
    <p>{t(editing
      ? personal ? "dashboardLayout.personalEditHint" : "dashboardLayout.emptyDraftText"
      : personal ? "dashboardLayout.personalEmptyText" : "dashboardLayout.emptyText")}</p>
    {canEdit ? <button type="button" className={styles.primary} onClick={onAdd}><Plus size={16} />{t("dashboardLayout.add")}</button>
      : !personal && <small>{t("dashboardLayout.readOnlyEmpty")}</small>}
  </motion.section>;
}
