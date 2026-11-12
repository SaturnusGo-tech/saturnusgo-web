"use client";

import { Button, DrawerBody, DrawerFooter } from "@heroui/react";
import { ErrorToast } from "../../../../presentation/common/error/ErrorToast";
import { useState } from "react";
import type { ProductDocCase, ProductDocScope } from "../../../domain/product-docs";
import { relatedCasesChanged, toggleRelatedCases, type ProductDocRelatedCaseSelection } from "../../../domain/related-cases/product-doc-related-cases";
import { SuiteCasePicker } from "../../../../presentation/dialogs/suite/picker/SuiteCasePicker";
import { useProductDocCaseCatalog } from "../../../state/related-cases/useProductDocCaseCatalog";
import styles from "../related-cases.module.css";

type Props = {
  scope: ProductDocScope; baseline: ProductDocCase[]; projectName: string; ru: boolean; busy: boolean; failed: boolean; canApply?: boolean;
  onCancel(): void; onApply(selection: ProductDocRelatedCaseSelection): Promise<void>;
};

type CaseChoices = Map<string, { item: ProductDocCase; selected: boolean }>;

function selectedCases(baseline: ProductDocCase[], choices: CaseChoices) {
  const cases = new Map(baseline.map(item => [item.caseId, item]));
  for (const [id, choice] of choices) {
    if (choice.selected) { if (!cases.has(id)) cases.set(id, choice.item); }
    else cases.delete(id);
  }
  return [...cases.values()];
}

export function RelatedCasePicker({ scope, baseline, projectName, ru, busy, failed, canApply = true, onCancel, onApply }: Props) {
  const resource = useProductDocCaseCatalog(scope);
  const [choices, setChoices] = useState<CaseChoices>(() => new Map());
  const cases = selectedCases(baseline, choices);
  const selected = new Set(cases.map(item => item.caseId));
  function toggle(ids: readonly string[]) {
    if (busy || resource.status !== "ready") return;
    const idsSet = new Set(ids);
    const chosen = resource.data.cases.filter(item => idsSet.has(item.id))
      .map(item => ({ caseId: item.id, title: item.title, sectionId: null }));
    setChoices(current => {
      const selected = new Set(toggleRelatedCases(selectedCases(baseline, current), chosen).map(item => item.caseId));
      const next = new Map(current);
      chosen.forEach(item => next.set(item.caseId, { item, selected: selected.has(item.caseId) }));
      return next;
    });
  }
  return <>
    <DrawerBody className={styles.pickerBody}>
      <p className={styles.hint}>{ru ? "Откройте папку и выберите её кейсы, включая вложенные папки. Связи сохранятся после применения."
        : "Open a folder and select its cases, including subfolders. Apply to save the links."}</p>
      {resource.status === "loading" && <p role="status">{ru ? "Загрузка репозитория…" : "Loading repository…"}</p>}
      {resource.status === "error" && <ErrorToast message={ru ? "Не удалось загрузить репозиторий." : "Could not load repository."} />}
      {resource.status === "ready" && <fieldset disabled={busy} className={styles.pickerFieldset}>
        <legend className={styles.srOnly}>{ru ? "Выбор связанных кейсов" : "Choose related cases"}</legend>
        <SuiteCasePicker cases={resource.data.cases} folders={resource.data.folders} selected={selected}
          projectName={projectName} ru={ru} onToggle={id => toggle([id])} onScope={toggle} />
      </fieldset>}
      {failed && <p className={styles.error} role="alert">{ru ? "Не удалось применить все связи. Выбор сохранён: повторите попытку."
        : "Could not apply all links. Your selection is retained; try again."}</p>}
    </DrawerBody>
    <DrawerFooter className={styles.footer}>
      <span className={styles.hint} aria-live="polite">{cases.length} {ru ? "выбрано" : "selected"}</span>
      <Button variant="light" size="sm" isDisabled={busy} onPress={onCancel}>{ru ? "Назад" : "Back"}</Button>
      <Button variant="solid" color="primary" size="sm" isLoading={busy}
        isDisabled={busy || !canApply || resource.status !== "ready" || !relatedCasesChanged({ baseline, cases })}
        onPress={() => void onApply({ baseline, cases })}>{ru ? "Применить" : "Apply"}</Button>
    </DrawerFooter>
  </>;
}
