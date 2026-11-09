import { Button } from "@heroui/react";
import { Plus } from "lucide-react";
import { useRef } from "react";
import type { DraftProductDocRequirement, ProductDocScope, ProductDocsApi } from "../../domain/product-docs";
import { RequirementPicker } from "../RequirementPicker";
import styles from "../requirements.module.css";

export function CaseRequirementPicker({ api, scope, ru, open, disabled, linkFailed, onOpenChange, onLink }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  ru: boolean;
  open: boolean;
  disabled: boolean;
  linkFailed?: boolean;
  onOpenChange(open: boolean): void;
  onLink(requirement: DraftProductDocRequirement): void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const label = ru ? "Добавить статью" : "Add page";
  return <>
    <Button ref={trigger} type="button" variant="light" className={styles.add} isDisabled={disabled} aria-haspopup="dialog"
      aria-expanded={open} onPress={() => { trigger.current?.focus({ preventScroll: true }); onOpenChange(true); }}>
      <Plus size={14} aria-hidden="true" />{label}
    </Button>
    {open && <RequirementPicker api={api} scope={scope} ru={ru} disabled={disabled} linkFailed={linkFailed}
      onLink={onLink} onClose={() => onOpenChange(false)} />}
  </>;
}
