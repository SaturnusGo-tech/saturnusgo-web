import { useState } from "react";
import { ChevronDown, ChevronRight, Folder } from "@openai/apps-sdk-ui/components/Icon";
import { UNFILED, type PickerFolder } from "../model/picker-model";
import styles from "../suite-picker.module.css";

export function PickerFolders({ folders, count, current, projectName, ru, onChoose }: {
  folders: readonly PickerFolder[]; count: number; current: string; projectName: string; ru: boolean; onChoose: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  let hiddenDepth: number | null = null;
  const visible = folders.filter(folder => {
    if (hiddenDepth !== null && folder.depth > hiddenDepth) return false;
    hiddenDepth = collapsed.has(folder.id) ? folder.depth : null;
    return true;
  });
  return <nav className={styles.folderNav} aria-label={ru ? "Папки тест-кейсов" : "Test case folders"}>
    <span className={styles.folderHeading} title={projectName}>{projectName}</span>
    <button type="button" className={styles.allFolders} aria-current={!current ? "page" : undefined} onClick={() => onChoose("")}>
      <Folder width={17} height={17} aria-hidden="true" /><span>{ru ? "Все кейсы" : "All cases"}</span><small>{count}</small>
    </button>
    {visible.map(folder => <div key={folder.id} className={styles.folderRow} style={{ paddingInlineStart: Math.min(folder.depth, 5) * 12 }}>
      {folder.hasChildren ? <button type="button" className={styles.folderChevron}
        aria-label={`${collapsed.has(folder.id) ? (ru ? "Развернуть" : "Expand") : (ru ? "Свернуть" : "Collapse")}: ${folder.name}`}
        aria-expanded={!collapsed.has(folder.id)} onClick={() => setCollapsed(value => {
          const next = new Set(value); if (next.has(folder.id)) next.delete(folder.id); else next.add(folder.id); return next;
        })}>{collapsed.has(folder.id) ? <ChevronRight width={14} height={14} /> : <ChevronDown width={14} height={14} />}</button>
        : <span className={styles.folderChevronSpace} />}
      <button type="button" className={styles.folderButton} title={folder.path} aria-current={current === folder.id ? "page" : undefined}
        onClick={() => onChoose(folder.id)}><Folder width={16} height={16} aria-hidden="true" />
        <span>{folder.id === UNFILED ? (ru ? "Без папки" : "Unfiled") : folder.name}</span><small>{folder.caseIds.length}</small>
      </button>
    </div>)}
  </nav>;
}
