import { useDraggable } from "@dnd-kit/core";
import { useContext, type ReactNode } from "react";
import { PiListChecks } from "react-icons/pi";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { DragClickContext } from "../dnd/drag-click";
import type { RepositoryCreation } from "../../model/creation/repository-creation";
import { CaseQuickAdd } from "./CaseQuickAdd";
import css from "../styles/repository.module.css";

export function RepositoryCaseLeaf({ item, depth, selected, active, locked, canManage, canSelect, allowArchivedSelection, accessory, trailing, ru, onToggle, onOpen, creation }: {
  creation?: RepositoryCreation;
  canSelect?: boolean; allowArchivedSelection?: boolean; accessory?: ReactNode; trailing?: ReactNode;
  item: TestCaseSummary; depth: number; selected: boolean; active: boolean; locked: boolean; canManage: boolean;
  ru: boolean; onToggle: (id: string) => void; onOpen: (item: TestCaseSummary) => void;
}) {
  const drag = useDraggable({ id: `tree-case:${item.id}`, data: { kind: "case", caseId: item.id }, disabled: locked || !canManage || Boolean(item.archivedAt) });
  const suppress = useContext(DragClickContext);
  const quickCreate = creation && canManage && !item.archivedAt;
  return <li className={css.leaf} data-quick-create={quickCreate || undefined} data-depth={depth} data-selected={selected || undefined} data-active={active || undefined} style={{ opacity: drag.isDragging ? .35 : 1 }}>
    <span className={css.caseRail} aria-hidden="true" />
    <input type="checkbox" checked={selected} disabled={locked || !(canSelect ?? canManage) || (Boolean(item.archivedAt) && !allowArchivedSelection)}
      aria-label={`${ru ? "Выбрать" : "Select"} ${item.key}`} onChange={() => onToggle(item.id)} />
    <button ref={drag.setNodeRef} {...drag.listeners} {...drag.attributes} type="button" className={css.caseButton}
      disabled={locked} aria-disabled={locked || undefined}
      aria-label={`${item.key} · ${item.title}`} aria-current={active ? "page" : undefined}
      onClick={() => { if (!locked && Date.now() > suppress.current) onOpen(item); }} title={`${item.key} · ${item.title}`}>
      {accessory ?? <PiListChecks size={17} />}<span>{item.title}<small>{item.key}</small></span>{trailing}
    </button>
    {quickCreate && <CaseQuickAdd folderPath={item.folderPath || "/"} onCreate={creation.createCase} disabled={locked} ru={ru} />}
  </li>;
}
