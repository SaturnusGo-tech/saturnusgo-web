import { Copy, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RunItem, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import styles from "../../../tms.module.css";

type Props = {
  run: TestRunSummary;
  item: RunItem;
  canArchive: boolean;
  archivePending: boolean;
  onArchive: (run: TestRunSummary) => void;
};

export function RunExecutionHeader({ run, item, canArchive, archivePending, onArchive }: Props) {
  const { t } = useTmsLocale();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const archiveButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  function closeConfirm(restoreFocus = true) {
    setConfirmOpen(false);
    if (restoreFocus) requestAnimationFrame(() => archiveButtonRef.current?.focus());
  }

  useEffect(() => setConfirmOpen(false), [run.id]);
  useEffect(() => {
    if (!confirmOpen) return;
    cancelButtonRef.current?.focus();
    function closeOnPointer(event: PointerEvent) {
      if (!actionsRef.current?.contains(event.target as Node)) closeConfirm(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeConfirm();
    }
    document.addEventListener("pointerdown", closeOnPointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [confirmOpen]);

  return (
    <header className={styles.executionHeader}>
      <div><span>{item.caseKey}</span><h1>{item.snapshot.title}</h1><p>{item.snapshot.description}</p></div>
      <div className={styles.executionHeaderActions} ref={actionsRef}>
        <button className={styles.iconButton} aria-label={t("runs.copyCaseKey")} title={t("runs.copyCaseKey")} onClick={() => navigator.clipboard?.writeText(item.caseKey)}><Copy size={17} /></button>
        {canArchive && !run.archivedAt && (
          <button ref={archiveButtonRef} className={`${styles.iconButton} ${styles.runArchiveButton}`} aria-label={t("runs.removeFromList")} title={t("runs.removeFromList")} aria-expanded={confirmOpen} onClick={() => setConfirmOpen((current) => !current)}><Trash2 size={17} /></button>
        )}
        {confirmOpen && (
          <section className={styles.runArchivePopover} role="dialog" aria-label={t("runs.removeConfirm", { key: run.key })}>
            <button className={styles.runArchiveClose} type="button" aria-label={t("common.close")} onClick={() => closeConfirm()}><X size={15} /></button>
            <strong>{t("runs.removeConfirm", { key: run.key })}</strong>
            <p>{t("runs.removeKeepsHistory")}</p>
            <div>
              <button ref={cancelButtonRef} type="button" onClick={() => closeConfirm()}>{t("common.cancel")}</button>
              <button className={styles.runArchiveConfirmButton} type="button" disabled={archivePending} onClick={() => onArchive(run)}><Trash2 size={14} /> {archivePending ? t("runs.archiving") : t("runs.removeAction")}</button>
            </div>
          </section>
        )}
      </div>
    </header>
  );
}
