import { LoadingOrb } from "../../../../../shared/components/loading/LoadingOrb";
import { useDraggable } from "@dnd-kit/core";
import { useContext, type ReactNode } from "react";
import { PiListChecks } from "react-icons/pi";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { DragClickContext, RepositoryDragSelectionContext } from "../dnd/drag-click";
import type { RepositoryCreation } from "../../model/creation/repository-creation";
import { RepositoryCaseTitle } from "./title/RepositoryCaseTitle";
import { CaseQuickAdd } from "./CaseQuickAdd";
import { PriorityIcon, priorityLabel } from "../../../presentation/common/properties/PriorityIcon";
import css from "../styles/repository.module.css";

export function RepositoryCaseLeaf({ item, depth, selected, active, loading, locked, canManage, canSelect, allowArchivedSelection, accessory, trailing, ru, onToggle, onOpen, creation, titleMode }: {
  creation?: RepositoryCreation; titleMode?: "marquee" | "inline";
  loading?: boolean; canSelect?: boolean; allowArchivedSelection?: boolean; accessory?: ReactNode; trailing?: ReactNode;
  item: TestCaseSummary; depth: number; selected: boolean; active: boolean; locked: boolean; canManage: boolean;
  ru: boolean; onToggle: (id: string) => void; onOpen: (item: TestCaseSummary) => void;
}) {
  const drag = useDraggable({ id: `tree-case:${item.id}`, data: { kind: "case", caseId: item.id, name: item.title, archived: Boolean(item.archivedAt) }, disabled: locked || !canManage || Boolean(item.archivedAt) });
  const suppress = useContext(DragClickContext);
  const moving = useContext(RepositoryDragSelectionContext);
  const quickCreate = creation && canManage && !item.archivedAt;
  const inline = titleMode === "inline";
  const priority = item.priorityAssigned === false ? null : item.priority;
  return <li className={css.leaf} data-repository-drag-row data-repository-drag-id={`tree-case:${item.id}`} data-quick-create={quickCreate || undefined} data-title-mode={titleMode} data-depth={depth} data-selected={selected || undefined} data-active={active || undefined} data-drag-source={moving.caseIds.has(item.id) || undefined}>
    <span className={css.caseRail} aria-hidden="true" />
    <input type="checkbox" checked={selected} disabled={locked || !(canSelect ?? canManage) || (Boolean(item.archivedAt) && !allowArchivedSelection)}
      aria-label={`${ru ? "Выбрать" : "Select"} ${item.key}`} onChange={() => onToggle(item.id)} />
    <button ref={drag.setNodeRef} {...drag.listeners} {...drag.attributes} type="button" className={css.caseButton}
      disabled={locked} aria-disabled={locked || undefined}
      aria-label={`${item.key} · ${item.title}`} aria-current={active ? "page" : undefined} aria-busy={loading || undefined}
      aria-description={inline ? priorityLabel(ru ? "ru" : "en", priority) : undefined}
      onClick={() => { if (!locked && Date.now() > suppress.current) onOpen(item); }} title={titleMode === "marquee" ? undefined : `${item.key} · ${item.title}`}>
      <span className={css.caseAccessory} data-case-loading={loading || undefined}>
        {accessory ?? (inline ? <PriorityIcon level={priority} empty="circle" /> : <PiListChecks size={17} />)}
        {loading && <LoadingOrb size="sm" className={css.caseOrb} />}
      </span>
      {inline ? <span className={css.caseTitle}>{item.title}</span>
        : <span className={css.caseCopy}>{titleMode === "marquee" ? <RepositoryCaseTitle title={item.title} /> : item.title}<small>{item.key}</small></span>}
      {trailing}
      {inline && <small className={css.caseKey}>{item.key}</small>}
    </button>
    {quickCreate && <CaseQuickAdd folderPath={item.folderPath || "/"} onCreate={creation.createCase} disabled={locked} ru={ru} />}
  </li>;
}
