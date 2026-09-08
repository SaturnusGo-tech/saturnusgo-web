import { useRef, useState } from "react";
import type { PendingCaseAttachment } from "../../../application/evidence/case/pendingCaseAttachment";
import { useAttachmentClient } from "../../../attachments/presentation/context/AttachmentClientProvider";
import { saveSharedStepAssets, type SharedStepSaveCheckpoint } from "../../application/attachments/save-shared-step-assets";
import type { SharedStep, SharedStepDraft } from "../../model/shared-step";
import type { useSharedSteps } from "../useSharedSteps";

export function useSharedStepAssetSave(resource: ReturnType<typeof useSharedSteps>, ru: boolean) {
  const client = useAttachmentClient();
  const [entries, setEntries] = useState<PendingCaseAttachment[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const active = useRef(false);
  const checkpoint = useRef<SharedStepSaveCheckpoint>({ operationKey: crypto.randomUUID(), saved: null, uploaded: new Set() });
  const save = async (draft: SharedStepDraft, current: SharedStep | null) => {
    if (active.current) return false;
    active.current = true; setSaving(true); setError("");
    try {
      await saveSharedStepAssets({ draft, entries, checkpoint: checkpoint.current, client,
        save: (value, key) => resource.save(value, current, key), reload: resource.reload });
      return true;
    } catch {
      setError(checkpoint.current.saved
        ? (ru ? "Блок сохранён, но загрузка файлов не завершена. Нажмите «Сохранить» для повтора. Уже загруженные файлы не продублируются."
          : "The block was saved, but file upload is incomplete. Save again to retry without duplicating uploaded files.")
        : (ru ? "Не удалось сохранить. Проверьте соединение и лимит: до 20 вложений на шаг, до 20 новых файлов за сохранение."
          : "Could not save. Check your connection and limits: 20 attachments per step, 20 new files per save."));
      return false;
    } finally { active.current = false; setSaving(false); }
  };
  return { entries, setEntries, saving, error, save, locked: Boolean(checkpoint.current.saved) };
}
