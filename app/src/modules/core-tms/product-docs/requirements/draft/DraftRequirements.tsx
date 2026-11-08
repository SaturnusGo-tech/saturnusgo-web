import { useState } from "react";
import { useProductDocsWorkspace } from "../../composition/context/ProductDocsContext";
import type { DraftProductDocRequirement } from "../../domain/product-docs";
import { CaseRequirementLinks } from "../case/CaseRequirementLinks";
import { CaseRequirementPicker } from "../case/CaseRequirementPicker";
import styles from "../requirements.module.css";

export function DraftRequirements({projectId, ru, value, onChange, disabled = false, retry = false}: {
  projectId?: string;
  ru: boolean;
  value: readonly DraftProductDocRequirement[];
  onChange(value: readonly DraftProductDocRequirement[]): void;
  disabled?: boolean;
  retry?: boolean;
}) {
  const docs = useProductDocsWorkspace();
  const [pickerOpen, setPickerOpen] = useState(false);
  if (!docs || projectId !== docs.scope.projectId) return null;
  return <div className={styles.field} data-documentation-field data-testid="draft-case-requirements">
    <dt>{ru ? "Документация" : "Documentation"}</dt>
    <dd>
      {retry && <p className={styles.feedback} role="status">{ru ? "Кейс уже создан. Повторите сохранение, чтобы привязать оставшиеся статьи." : "The case is saved. Save again to link the remaining pages."}</p>}
      {value.length > 0 && <CaseRequirementLinks requirements={value} ru={ru} disabled={disabled}
        onOpen={(requirement, source) => docs.open({
            docId: requirement.docId, sectionId: requirement.sectionId ?? undefined,
        }, source)}
        onRemove={docId => onChange(value.filter(item => item.docId !== docId))} />}
      <CaseRequirementPicker api={docs.api} scope={docs.scope} ru={ru} disabled={disabled}
        open={pickerOpen} onOpenChange={setPickerOpen} onLink={requirement => {
          const index = value.findIndex(item => item.docId === requirement.docId);
          onChange(index < 0 ? [...value, requirement] : value.map((item, position) => position === index ? requirement : item));
          setPickerOpen(false);
        }} />
    </dd>
  </div>;
}
