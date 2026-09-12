import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedComponentLabel } from "../../../localization/format/labels";
import { DefectRow } from "./DefectRow";
import styles from "./defect-branch.module.css";

export function DefectBranch({ group, branch, expanded, workspaceId, selectedDefectId,
  onToggle, onSelectDefect, onLoadMore, onRetry }: {
  group: { component: string; total: number; open: number; critical: number };
  branch?: { items: Defect[]; status: string; error: string | null; hasMore: boolean };
  expanded: boolean; workspaceId?: string; selectedDefectId: string | null;
  onToggle: () => void; onSelectDefect: (id: string) => void; onLoadMore: () => void; onRetry: () => void;
}) {
  const { locale, t } = useTmsLocale();
  const id = useId();
  const reduced = useReducedMotion();
  const label = localizedComponentLabel(locale, group.component) || (locale === "ru" ? "Без компонента" : "No component");
  const loading = !branch || branch.status === "idle" || branch.status === "loading";
  return <li className={styles.branch}>
    <button type="button" className={styles.folder} onClick={onToggle} aria-expanded={expanded} aria-controls={id}>
      <ChevronRight size={14} className={styles.chevron} data-expanded={expanded || undefined} />
      {expanded ? <FolderOpen size={18} className={styles.folderIcon} /> : <Folder size={18} className={styles.folderIcon} />}
      <span className={styles.folderLabel} title={label}>{label}</span>
      {group.open > 0 && <span className={styles.openCount}>{group.open} {t("reports.openShort")}</span>}
      {group.critical > 0 && <span className={styles.critical} title={locale === "ru" ? "Открытые критические баги" : "Open critical bugs"}>{group.critical} !</span>}
      <span className={styles.count} title={locale === "ru" ? "Всего баг-репортов" : "Total bug reports"}>{group.total}</span>
    </button>
    <AnimatePresence initial={false}>
      {expanded && <motion.div id={id} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }} transition={{ duration: reduced ? 0 : .2, ease: [.22,.68,.25,1] }} className={styles.reveal}>
        <ul className={styles.children} aria-label={label} aria-busy={loading}>
          {branch?.items.map((defect) => <DefectRow key={defect.id} defect={defect} workspaceId={workspaceId}
            selected={selectedDefectId === defect.id} onSelect={onSelectDefect} />)}
          {loading && <li className={styles.skeleton} role="status" aria-label={locale === "ru" ? "Загрузка багов" : "Loading bugs"}>
            <span /><span /><span />
          </li>}
          {branch?.status === "error" && <li className={styles.message} role="alert">
            <span>{locale === "ru" ? "Не удалось загрузить баги" : "Could not load bugs"}</span>
            <button type="button" onClick={onRetry}>{locale === "ru" ? "Повторить" : "Retry"}</button>
          </li>}
          {branch?.status === "ready" && branch.items.length === 0 && <li className={styles.message}>
            {locale === "ru" ? "В разделе нет подходящих багов" : "No matching bugs in this section"}
          </li>}
          {!loading && branch?.hasMore && <li className={styles.message}>
            <button type="button" onClick={onLoadMore}>{locale === "ru" ? "Показать ещё" : "Show more"}</button>
          </li>}
        </ul>
      </motion.div>}
    </AnimatePresence>
  </li>;
}
