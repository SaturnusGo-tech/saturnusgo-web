"use client";

import { AttachmentLink } from "../../../attachments/presentation/link/AttachmentLink";
import css from "../sharedSteps.module.css";

export function SharedStepSavedAttachments({ ids, ru, onRemove }: {
  ids: readonly string[];
  ru: boolean;
  onRemove: (id: string) => void;
}) {
  if (!ids.length) return null;
  return <div className={css.savedAssets} aria-label={ru ? "Вложения шага" : "Step attachments"}>
    {ids.map((id) => <AttachmentLink key={id} attachmentId={id} presentation="media"
      onDetach={() => onRemove(id)} />)}
  </div>;
}
