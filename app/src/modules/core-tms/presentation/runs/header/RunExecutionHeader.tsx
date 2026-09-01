import { Copy, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RunItem, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { CaseTypeIcon } from "../../cases/list/CaseBadges";
import styles from "../../../tms.module.css";
import runStyles from "../runs.module.css";

type Props = {
  run: TestRunSummary;
  item: RunItem;
  canArchive: boolean;
  archivePending: boolean;
  onArchive: (run: TestRunSummary) => void;
};

export function RunExecutionHeader({ run, item, canArchive, archivePending, onArchive }: Props) {
  const { locale, t } = useTmsLocale();
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
    <header className={runStyles.header}>
      <div><span className={runStyles.caseIdentity}><CaseTypeIcon locale={locale} type={item.snapshot.type} /><b>{item.caseKey}</b></span><h1>{item.snapshot.title}</h1><p>{item.snapshot.description}</p></div>
      <div className={runStyles.headerActions} ref={actionsRef}>
        <button className={`${styles.iconButton} ${runStyles.headerIconButton}`} aria-label={t("runs.copyCaseKey")} title={t("runs.copyCaseKey")} onClick={() => navigator.clipboard?.writeText(item.caseKey)}><Copy size={17} /></button>
        {canArchive && !run.archivedAt && (
          <button ref={archiveButtonRef} className={`${styles.iconButton} ${runStyles.headerIconButton} ${runStyles.archiveButton}`} aria-label={t("runs.removeFromList")} title={t("runs.removeFromList")} aria-expanded={confirmOpen} onClick={() => setConfirmOpen((current) => !current)}><Trash2 size={17} /></button>
        )}
        {confirmOpen && (
          <section className={runStyles.archivePopover} role="dialog" aria-label={t("runs.removeConfirm", { key: run.key })}>
            <button className={runStyles.archiveClose} type="button" aria-label={t("common.close")} onClick={() => closeConfirm()}><X size={15} /></button>
            <strong>{t("runs.removeConfirm", { key: run.key })}</strong>
            <p>{t("runs.removeKeepsHistory")}</p>
            <div>
              <button ref={cancelButtonRef} type="button" onClick={() => closeConfirm()}>{t("common.cancel")}</button>
              <button className={runStyles.archiveConfirmButton} type="button" disabled={archivePending} onClick={() => onArchive(run)}><Trash2 size={14} /> {archivePending ? t("runs.archiving") : t("runs.removeAction")}</button>
            </div>
          </section>
        )}
      </div>
    </header>
  );
}
