import { useCallback, useId, useLayoutEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { useAnchoredPopup } from "../../../presentation/common/popup/useAnchoredPopup";
import type { DraftProductDocRequirement, ProductDocScope, ProductDocsApi } from "../../domain/product-docs";
import { RequirementPicker } from "../RequirementPicker";
import styles from "../requirements.module.css";

export function CaseRequirementPicker({ api, scope, ru, open, disabled, onOpenChange, onLink }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  ru: boolean;
  open: boolean;
  disabled: boolean;
  onOpenChange(open: boolean): void;
  onLink(requirement: DraftProductDocRequirement): void;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const restoreTrigger = useRef(false);
  const changeOpen = useRef(onOpenChange);
  const label = ru ? "Добавить статью" : "Add page";
  useLayoutEffect(() => { changeOpen.current = onOpenChange; }, [onOpenChange]);
  const closeOutside = useCallback(() => { restoreTrigger.current = false; changeOpen.current(false); }, []);
  useAnchoredPopup(open, false, root, trigger, panel, closeOutside, 336, 380);
  useLayoutEffect(() => {
    if (open) panel.current?.querySelector("input")?.focus({ preventScroll: true });
  }, [open]);
  useLayoutEffect(() => {
    if (!open && !disabled && restoreTrigger.current) {
      restoreTrigger.current = false;
      if (document.activeElement === document.body || root.current?.contains(document.activeElement)) {
        trigger.current?.focus({ preventScroll: true });
      }
    }
  }, [open, disabled]);

  return <div ref={root}>
    <button ref={trigger} type="button" className={styles.add} disabled={disabled} aria-haspopup="dialog"
      aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => onOpenChange(!open)}>
      <Plus size={14} aria-hidden />{label}
    </button>
    {open && <div ref={panel} id={id} className={styles.pickerPopover} popover="manual" role="dialog" aria-label={label}>
      <RequirementPicker api={api} scope={scope} ru={ru} disabled={disabled}
        onLink={requirement => { restoreTrigger.current = true; onLink(requirement); }}
        onClose={() => { restoreTrigger.current = true; onOpenChange(false); }} />
    </div>}
  </div>;
}
