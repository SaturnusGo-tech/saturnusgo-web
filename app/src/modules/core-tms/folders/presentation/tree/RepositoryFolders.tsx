import { useDroppable } from "@dnd-kit/core";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PiArchiveDuotone, PiFolderPlusDuotone, PiUploadSimple } from "react-icons/pi";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { FolderResource, RepositoryFolder } from "../../model/folder";
import { buildFolderTree } from "../../model/tree";
import { RepositoryFolderBranch } from "../branch/RepositoryFolderBranch";
import { RepositoryCaseLeaf } from "../case/RepositoryCaseLeaf";
import { FolderActionsDialog } from "../actions/FolderActionsDialog";
import { useRepositoryWidth, REPOSITORY_MIN, REPOSITORY_MAX } from "../resize/useRepositoryWidth";
import css from "../styles/repository.module.css";

export function RepositoryFolders(props: {
  resource: FolderResource; cases: readonly TestCaseSummary[]; selected: ReadonlySet<string>; selectedFolder: string; selectedFolderId?: string;
  activeCaseId: string; ru: boolean; locked: boolean; onToggle: (id: string) => void; onScope: (ids: readonly string[]) => void;
  onFolder: (path: string, id?: string) => void; onCase: (item: TestCaseSummary) => void; onCreate: (path?: string) => void;
  onNewFolder: () => void; onImport: () => void;
  controls?: ReactNode; filtered?: boolean; selectionMode?: boolean; includeArchived?: boolean; onArchiveChange?: (archived: boolean) => void;
}) {
  const { resource, ru } = props;
  const resize = useRepositoryWidth();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [archive, setArchive] = useState(false);
  useEffect(() => { props.onArchiveChange?.(archive); }, [archive, props.onArchiveChange]);
  const [menu, setMenu] = useState<RepositoryFolder | null>(null);
  const tree = useMemo(() => buildFolderTree(resource.items, props.cases, archive, props.includeArchived), [resource.items, props.cases, archive, props.includeArchived]);
  const roots = useMemo(() => {
    function prune(nodes: typeof tree.roots): typeof tree.roots {
      return nodes.filter((node) => node.caseIds.length).map((node) => ({ ...node, children: prune(node.children) }));
    }
    return props.filtered ? prune(tree.roots) : tree.roots;
  }, [tree, props.filtered]);
  const drop = useDroppable({ id: "folder:root", data: { folderId: null }, disabled: props.locked || archive });
  useEffect(() => {
    const selected = resource.items.find((item) => item.id === props.selectedFolderId);
    if (selected) setArchive(Boolean(selected.archivedAt));
    const active = props.cases.find((item) => item.id === props.activeCaseId);
    const path = active?.folderPath ?? props.selectedFolder;
    if (!path) return;
    setExpanded((current) => new Set([...current, ...resource.items.filter((folder) => path === folder.path || path.startsWith(`${folder.path}/`)).map((folder) => folder.id)]));
  }, [props.activeCaseId, props.selectedFolder, props.selectedFolderId, resource.items]);
  useEffect(() => {
    if (!props.filtered) return;
    const paths = props.cases.map((item) => item.folderPath);
    setExpanded((current) => new Set([...current, ...resource.items.filter((folder) => paths.some((path) => path === folder.path || path.startsWith(`${folder.path}/`))).map((folder) => folder.id)]));
  }, [props.filtered, props.cases, resource.items]);
  function toggle(id: string) { setExpanded((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; }); }
  return <aside ref={resize.ref} style={resize.style} data-resizing={resize.resizing || undefined} data-selection={props.selectionMode || undefined} data-repository-tree className={css.repository} aria-label={ru ? "Папки и тест-кейсы" : "Folders and test cases"}>
    <header ref={drop.setNodeRef} className={css.heading} data-drop={drop.isOver || undefined}>
      <button className={css.repositoryTitle} disabled={props.locked} title={ru ? "Показать все тест-кейсы" : "Show all test cases"}
        onClick={() => { setArchive(false); props.onFolder(""); }}>{ru ? "Репозиторий" : "Repository"}</button><div>
      <button disabled={props.locked || !resource.canManage} onClick={props.onImport} aria-label={ru ? "Импорт тест-кейсов" : "Import test cases"}><PiUploadSimple size={16} /></button>
      <button disabled={props.locked || !resource.canManage} onClick={props.onNewFolder} aria-label={ru ? "Новая папка" : "New folder"}><PiFolderPlusDuotone size={18} /></button>
    </div></header>
    {props.controls}
    <div className={css.treeHeading}><span>{archive ? (ru ? "Архив папок" : "Archived folders") : (ru ? "Папки" : "Folders")}</span>
      <button aria-pressed={archive} aria-label={ru ? "Показать архив папок" : "Show archived folders"} onClick={() => setArchive(!archive)}><PiArchiveDuotone size={16} /></button></div>
    <div className={css.treeScroll} aria-busy={resource.loading}>
      {resource.error && <div className={css.loadError} role="alert"><span>{resource.error}</span><button onClick={resource.reload}>{ru ? "Обновить" : "Refresh"}</button></div>}
      {resource.loading && !resource.items.length ? <div className={css.skeleton} role="status" aria-label={ru ? "Загрузка папок" : "Loading folders"}><i /><i /><i /><i /></div> : <ul className={css.tree}>
        {roots.map((node) => <RepositoryFolderBranch key={node.folder.id} node={node} depth={0} expanded={expanded} selected={props.selected}
          selectedFolder={props.selectedFolder} selectedFolderId={props.selectedFolderId} activeCaseId={props.activeCaseId} ru={ru} locked={props.locked || resource.busy}
          canManage={resource.canManage} onExpand={toggle} onFolder={props.onFolder} onCase={props.onCase} onToggle={props.onToggle} onScope={props.onScope} onMenu={setMenu} />)}
        {tree.unfiled.map((item) => <RepositoryCaseLeaf key={item.id} item={item} depth={0} selected={props.selected.has(item.id)} active={props.activeCaseId === item.id}
          locked={props.locked} canManage={resource.canManage} ru={ru} onToggle={props.onToggle} onOpen={props.onCase} />)}
        {!roots.length && !tree.unfiled.length && !resource.error && <li className={css.empty}>{props.filtered ? (ru ? "Тест-кейсы не найдены. Измените поиск или фильтры." : "No matching test cases. Adjust the search or filters.") : archive ? (ru ? "В архиве пока пусто" : "The archive is empty") : (ru ? "Создайте первую папку или импортируйте структуру из JSON." : "Create your first folder or import a structure from JSON.")}</li>}
      </ul>}
    </div>
    <div {...resize.handleProps} className={css.resizeHandle} role="separator" tabIndex={0} aria-orientation="vertical"
      aria-label={ru ? "Изменить ширину репозитория" : "Resize repository"} aria-valuemin={REPOSITORY_MIN} aria-valuemax={REPOSITORY_MAX} aria-valuenow={resize.width}
      title={ru ? "Потяните, чтобы изменить ширину. Двойной клик — сбросить." : "Drag to resize. Double click to reset."} />
    {menu && <FolderActionsDialog folder={menu} resource={resource} ru={ru} onClose={() => setMenu(null)} onCreateCase={props.onCreate} onCreated={props.onFolder} />}
  </aside>;
}
