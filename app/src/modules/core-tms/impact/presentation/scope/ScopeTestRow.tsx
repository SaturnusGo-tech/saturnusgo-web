import { IntegrationButton } from "../../../presentation/common/integration-controls/button/IntegrationButton";
import { LoadingOrb } from "../../../../../shared/components/loading/LoadingOrb";
import { useId, useState } from "react";
import { ChevronRight, FileCode2 } from "lucide-react";
import type { ImpactAnalysis } from "../../model/impact-types";
import css from "./scope.module.css";
import { IntegrationCheckbox } from "../../../presentation/common/integration-controls/checkbox/IntegrationCheckbox";

type Selection = NonNullable<ImpactAnalysis["result"]>["selectedTestCases"][number];
export function ScopeTestRow({ caseId, caseKey, title, origin, revision, included, selection, editable, pending = false, saving = false, ru, onToggle }: {
  caseId: string; caseKey?: string | null; title?: string | null; origin?: string; revision?: number | null;
  included?: boolean; selection?: Selection; editable: boolean; pending?: boolean; saving?: boolean; ru: boolean; onToggle?: () => void;
}) {
  const [expanded, setExpanded] = useState(false), evidenceId = useId();
  const label = title || caseKey || caseId;
  const reason = selection?.reason ?? (ru ? "Добавлен вручную при проверке состава." : "Added manually during scope review.");
  const files = selection?.changedFiles ?? [];
  return <li className={css.row} data-included={included}>
    <div className={css.rowMain} data-recommendation={included === undefined || undefined}>
      {included !== undefined && <span className={css.selection} data-saving={saving || undefined} aria-busy={saving || undefined}>
        <IntegrationCheckbox isSelected={included} isDisabled={!editable} aria-disabled={pending || undefined}
          aria-label={`${ru ? "Включить" : "Include"} ${caseKey || caseId} · ${label}`}
          onValueChange={() => { if (editable && !pending) onToggle?.(); }} />
        {saving && <span className={css.saving} role="status" aria-label={ru ? "Сохраняем выбор" : "Saving selection"}>
          <LoadingOrb />
        </span>}
      </span>}
      <div className={css.copy}>
        <strong title={label}>{label}</strong>
        <div className={css.metadata}>
          {title && <span title={caseKey || caseId}>{caseKey || caseId}</span>}
          <span>{origin === "manual" ? (ru ? "Добавлен QA" : "Added by QA") : "Falcon"}</span>
          {revision != null && <span>r{revision}</span>}
          {included !== undefined && <span>{included ? (ru ? "В составе" : "Included") : (ru ? "Исключён QA" : "Excluded by QA")}</span>}
        </div>
      </div>
      <IntegrationButton type="button" className={css.detailsToggle} aria-expanded={expanded} aria-controls={evidenceId}
        aria-label={`${ru ? "Причина выбора" : "Selection details"}: ${caseKey || caseId}`} onPress={() => setExpanded(value => !value)}>
        <span>{ru ? "Обоснование" : "Details"}</span><ChevronRight size={14} aria-hidden="true" />
      </IntegrationButton>
    </div>
    <div className={css.reveal} data-open={expanded} id={evidenceId} aria-hidden={!expanded}
      ref={element => { if (element) element.inert = !expanded; }}>
      <div className={css.revealClip}><section className={css.explanation} aria-label={ru ? "Причина выбора" : "Why this test"}>
        <header className={css.explanationHeader}><h4>{ru ? "Причина выбора" : "Why this test"}</h4>
          {selection && <span className={css.confidence}>{ru ? "Уверенность" : "Confidence"} {Math.round(selection.confidence * 100)}%</span>}
        </header>
        <div className={css.explanationBody} data-files={files.length > 0 || undefined}>
          <p className={css.reason}>{reason}</p>
          {files.length > 0 && <div className={css.relatedFiles}><h5>{ru ? "Связанные файлы" : "Related files"}<span>{files.length}</span></h5>
            <ul className={css.files} aria-label={ru ? "Связанные файлы" : "Related files"} tabIndex={expanded && files.length > 4 ? 0 : -1}>{files.map(file => {
              const separator = Math.max(file.lastIndexOf("/"), file.lastIndexOf("\\"));
              return <li key={file} title={file}><FileCode2 size={16} strokeWidth={1.6} aria-hidden="true" />
                <span><strong>{file.slice(separator + 1)}</strong><small>{separator < 0 ? (ru ? "Корень репозитория" : "Repository root") : file.slice(0, separator)}</small></span>
              </li>;
            })}</ul>
          </div>}
        </div>
      </section></div>
    </div>
  </li>;
}
