import { useMemo, useState, type ReactNode } from "react";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../../folders/model/folder";
import { buildFolderTree, type FolderNode } from "../../../../folders/model/tree";
import { RepositoryFolderBranch } from "../../../../folders/presentation/branch/RepositoryFolderBranch";
import { RepositoryCaseLeaf } from "../../../../folders/presentation/case/RepositoryCaseLeaf";
import css from "../../../../folders/presentation/styles/repository.module.css";
import local from "./selection-tree.module.css";

type Props = {
  cases: TestCaseSummary[]; folders: readonly RepositoryFolder[]; selected: ReadonlySet<string>;
  ru: boolean; disabled?: boolean; selectable?: boolean; includeArchived?: boolean; activeId?: string;
  onToggle: (id: string) => void; onScope: (ids: readonly string[]) => void;
  trailing?: (item: TestCaseSummary) => ReactNode;
  onOpen?: (item: TestCaseSummary) => void; heading?: ReactNode; accessory?: (item: TestCaseSummary) => ReactNode;
};
export function SelectionTree(props: Props) {
  const tree = useMemo(() => {
    const result = buildFolderTree(props.folders, props.cases, false, props.includeArchived);
    function prepare(nodes: FolderNode[]): FolderNode[] {
      return nodes.filter((node) => node.caseIds.length > 0).map((node) => ({ ...node,
        selectableCaseIds: node.caseIds, children: prepare(node.children) }));
    }
    return { ...result, roots: prepare(result.roots) };
  }, [props.folders, props.cases, props.includeArchived]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const expanded = new Set(props.folders.filter((folder) => !collapsed.has(folder.id)).map((folder) => folder.id));
  const open = props.onOpen ?? ((item: TestCaseSummary) => props.onToggle(item.id));
  return <div className={`${css.repository} ${local.root}`} data-selection={props.selectable || undefined}
    data-readonly={!props.selectable || undefined}>
    {props.heading && <div className={local.heading}>{props.heading}</div>}
    <div className={css.treeScroll}><ul className={css.tree}>
      {tree.roots.map((node) => <RepositoryFolderBranch key={node.folder.id} node={node} depth={0}
        expanded={expanded} selected={props.selected} selectedFolder="" activeCaseId={props.activeId ?? ""}
        ru={props.ru} locked={Boolean(props.disabled)} canManage={false} canSelect={props.selectable} allowArchivedSelection={props.includeArchived}
        trailing={props.trailing} accessory={props.accessory} onExpand={(id) => setCollapsed((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; })}
        onFolder={() => {}} onCase={open} onToggle={props.onToggle} onScope={props.onScope} onMenu={() => {}} />)}
      {tree.unfiled.map((item) => <RepositoryCaseLeaf key={item.id} item={item} depth={0}
        selected={props.selected.has(item.id)} active={props.activeId === item.id} ru={props.ru}
        trailing={props.trailing?.(item)} accessory={props.accessory?.(item)} locked={Boolean(props.disabled)} canManage={false} canSelect={props.selectable} allowArchivedSelection={props.includeArchived} onOpen={open} onToggle={props.onToggle} />)}
    </ul></div>
  </div>;
}
