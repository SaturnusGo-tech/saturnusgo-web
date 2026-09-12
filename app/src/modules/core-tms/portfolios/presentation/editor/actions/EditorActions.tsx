import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PiCheck, PiSpinnerGap, PiX } from "react-icons/pi";
import css from "../../styles/editor.module.css";

export function EditorActions({ targetId, formId, pending, saveLabel, cancelLabel, onCancel }: {
  targetId?: string; formId: string; pending: boolean; saveLabel: string; cancelLabel: string; onCancel: () => void;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => { setTarget(targetId ? document.getElementById(targetId) : null); }, [targetId]);
  const buttons = <div className={css.headerActions}>
    <button type="button" disabled={pending} onClick={onCancel} aria-label={cancelLabel} title={cancelLabel}><PiX /></button>
    <button type="submit" form={formId} disabled={pending} aria-label={saveLabel} title={saveLabel} data-save-organization>
      {pending ? <PiSpinnerGap className={css.spin} /> : <PiCheck />}
    </button>
  </div>;
  return target ? createPortal(buttons, target) : buttons;
}
