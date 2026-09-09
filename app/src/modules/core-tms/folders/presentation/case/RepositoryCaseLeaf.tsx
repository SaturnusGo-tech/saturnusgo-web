import { useDraggable } from "@dnd-kit/core";
import { useContext } from "react";
import { PiFileTextDuotone } from "react-icons/pi";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { DragClickContext } from "../dnd/drag-click";
import css from "../styles/repository.module.css";

export function RepositoryCaseLeaf({ item, depth, selected, active, locked, canManage, ru, onToggle, onOpen }: {
  item: TestCaseSummary; depth: number; selected: boolean; active: boolean; locked: boolean; canManage: boolean;
  ru: boolean; onToggle: (id: string) => void; onOpen: (item: TestCaseSummary) => void;
}) {
  const drag = useDraggable({ id: `tree-case:${item.id}`, data: { kind: "case", caseId: item.id }, disabled: locked || !canManage || Boolean(item.archivedAt) });
  const suppress = useContext(DragClickContext);
  return <li className={css.leaf} data-selected={selected || active || undefined} style={{ paddingLeft: 12 + depth * 16, opacity: drag.isDragging ? .35 : 1 }}>
    <input type="checkbox" checked={selected} disabled={locked || !canManage || Boolean(item.archivedAt)}
      aria-label={`${ru ? "Выбрать" : "Select"} ${item.key}`} onChange={() => onToggle(item.id)} />
    <button ref={drag.setNodeRef} {...drag.listeners} {...drag.attributes} type="button" className={css.caseButton}
      disabled={locked} aria-disabled={locked || undefined}
      aria-label={`${item.key} · ${item.title}`} aria-current={active ? "page" : undefined}
      onClick={() => { if (!locked && Date.now() > suppress.current) onOpen(item); }} title={`${item.key} · ${item.title}`}>
      <PiFileTextDuotone size={16} /><span>{item.title}<small>{item.key}</small></span>
    </button>
  </li>;
}
