"use client";

import { useMemo } from "react";
import type { SharedStep, SharedStepDraft } from "../../../shared-steps/model/shared-step";
import type { useSharedSteps } from "../../../shared-steps/state/useSharedSteps";
import { useSharedStepAssetSave } from "../../../shared-steps/state/attachments/useSharedStepAssetSave";
import { CaseAttachmentDraftProvider } from "../../cases/inspector/attachments/CaseAttachmentDraftContext";
import { SharedStepEditor } from "../SharedStepEditor";

export function SharedStepAttachmentEditor({ draft, current, resource, ru, onChange, onClose }: {
  draft: SharedStepDraft;
  current: SharedStep | null;
  resource: ReturnType<typeof useSharedSteps>;
  ru: boolean;
  onChange: (draft: SharedStepDraft) => void;
  onClose: () => void;
}) {
  const assets = useSharedStepAssetSave(resource, ru);
  const validStepIds = useMemo(() => new Set(draft.items.map(({ id }) => id)), [draft.items]);
  return <CaseAttachmentDraftProvider locale={ru ? "ru" : "en"}
    enabled={resource.attachmentsEnabled && !assets.saving && !assets.locked}
    entries={assets.entries} validStepIds={validStepIds} onEntries={assets.setEntries}>
    <SharedStepEditor draft={draft} ru={ru} onChange={onChange} onCancel={onClose}
      saving={assets.saving} locked={assets.locked} error={assets.error}
      onSave={() => void assets.save(draft, current).then((saved) => { if (saved) onClose(); })} />
  </CaseAttachmentDraftProvider>;
}
