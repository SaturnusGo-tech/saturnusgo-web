import { useEffect, useRef, useState } from "react";
import type { SharedStepSummary } from "../../../shared-steps/model/shared-step";
import type { useSharedSteps } from "../../../shared-steps/state/useSharedSteps";
import { Modal } from "../../common/modal/Modal";
import styles from "../sharedSteps.module.css";

export function ArchiveSharedStepDialog({ item, resource, ru, onClose }: {
  item: SharedStepSummary;
  resource: ReturnType<typeof useSharedSteps>;
  ru: boolean;
  onClose: () => void;
}) {
  const operation = useRef(crypto.randomUUID());
  const request = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"changed" | "forbidden" | "failed" | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const confirm = async () => {
    if (request.current) return;
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setError(null);
    const outcome = await resource.archive(item, operation.current, controller.signal);
    request.current = null;
    if (controller.signal.aborted) return;
    setBusy(false);
    if (outcome === "success") onClose(); else setError(outcome);
  };
  return <Modal title={ru ? "Удалить общий шаг?" : "Remove shared step?"}
    onClose={() => { if (!busy) onClose(); }} panelClassName={styles.archiveDialog}>
    <div className={styles.archiveBody}>
      <strong>{item.title}</strong>
      <p>{ru ? "Он исчезнет из библиотеки и списка добавления. В тест-кейсах и ранах, где он уже используется, шаги и вложения сохранятся."
        : "It will leave the library and the insertion list. Steps and attachments in cases and runs that already use it will remain."}</p>
      {error && <p role="alert">{error === "changed" ? (ru
        ? "Общий шаг изменился. Закройте окно и проверьте обновлённую версию перед удалением."
        : "This shared step changed. Close this dialog and review the latest version before removing it.")
        : error === "forbidden" ? (ru ? "У вас нет прав на удаление общих шагов." : "You cannot remove shared steps.")
          : (ru ? "Не удалось удалить. Повторите попытку." : "Could not remove this shared step. Try again.")}</p>}
      <div className={styles.archiveActions}>
        <button type="button" className={styles.secondaryButton} disabled={busy} onClick={onClose}>
          {ru ? "Отмена" : "Cancel"}</button>
        <button type="button" className={styles.dangerButton} disabled={busy || error === "changed" || error === "forbidden"}
          onClick={() => void confirm()}>{busy ? (ru ? "Удаляем…" : "Removing…") : (ru ? "Удалить" : "Remove")}</button>
      </div>
    </div>
  </Modal>;
}
