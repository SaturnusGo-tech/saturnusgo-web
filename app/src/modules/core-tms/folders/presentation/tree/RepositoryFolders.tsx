import { useDroppable } from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";
import { PiArchiveDuotone, PiFolderPlusDuotone, PiStackDuotone, PiTrayDuotone, PiUploadSimple } from "react-icons/pi";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { FolderResource, RepositoryFolder } from "../../model/folder";
import { buildFolderTree } from "../../model/tree";
import { RepositoryFolderBranch } from "../branch/RepositoryFolderBranch";
import { RepositoryCaseLeaf } from "../case/RepositoryCaseLeaf";
import { FolderActionsDialog } from "../actions/FolderActionsDialog";
import css from "../styles/repository.module.css";

export function RepositoryFolders(props: {
  resource: FolderResource; cases: readonly TestCaseSummary[]; selected: ReadonlySet<string>; selectedFolder: string; selectedFolderId?: string;
  activeCaseId: string; ru: boolean; locked: boolean; onToggle: (id: string) => void; onScope: (ids: readonly string[]) => void;
  onFolder: (path: string, id?: string) => void; onCase: (item: TestCaseSummary) => void; onCreate: (path?: string) => void;
  onNewFolder: () => void; onImport: () => void;
}) {
  const { resource, ru } = props;
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [archive, setArchive] = useState(false);
  const [menu, setMenu] = useState<RepositoryFolder | null>(null);
  const tree = useMemo(() => buildFolderTree(resource.items, props.cases, archive), [resource.items, props.cases, archive]);
  const drop = useDroppable({ id: "folder:root", data: { folderId: null }, disabled: props.locked || archive });
  useEffect(() => {
    const selected = resource.items.find((item) => item.id === props.selectedFolderId);
    if (selected) setArchive(Boolean(selected.archivedAt));
    const active = props.cases.find((item) => item.id === props.activeCaseId);
    const path = active?.folderPath ?? props.selectedFolder;
    if (!path) return;
    setExpanded((current) => new Set([...current, ...resource.items.filter((folder) => path === folder.path || path.startsWith(`${folder.path}/`)).map((folder) => folder.id)]));
  }, [props.activeCaseId, props.selectedFolder, props.selectedFolderId, resource.items]);
  function toggle(id: string) { setExpanded((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; }); }
  return <aside data-repository-tree className={css.repository} aria-label={ru ? "Папки и тест-кейсы" : "Folders and test cases"}>
    <header className={css.heading}><strong>{ru ? "Репозиторий" : "Repository"}</strong><div>
      <button disabled={props.locked || !resource.canManage} onClick={props.onImport} aria-label={ru ? "Импорт тест-кейсов" : "Import test cases"}><PiUploadSimple size={17} /></button>
      <button disabled={props.locked || !resource.canManage} onClick={props.onNewFolder} aria-label={ru ? "Новая папка" : "New folder"}><PiFolderPlusDuotone size={20} /></button>
    </div></header>
    <button className={css.scope} data-selected={!props.selectedFolder || undefined} disabled={props.locked} onClick={() => { setArchive(false); props.onFolder(""); }}><PiStackDuotone size={18} /><span>{ru ? "Все тест-кейсы" : "All test cases"}</span><small>{props.cases.filter((item) => !item.archivedAt).length}</small></button>
    <button ref={drop.setNodeRef} className={css.scope} data-drop={drop.isOver || undefined} data-selected={props.selectedFolder === "/" || undefined} disabled={props.locked}
      onClick={() => { setArchive(false); props.onFolder("/"); }}><PiTrayDuotone size={18} /><span>{ru ? "Без папки" : "Unfiled"}</span><small>{props.cases.filter((item) => !item.archivedAt && !item.folderId && item.folderPath === "/").length}</small></button>
    <div className={css.treeHeading}><span>{archive ? (ru ? "Архив папок" : "Archived folders") : (ru ? "Папки" : "Folders")}</span>
      <button aria-pressed={archive} aria-label={ru ? "Показать архив папок" : "Show archived folders"} onClick={() => setArchive(!archive)}><PiArchiveDuotone size={16} /></button></div>
    <div className={css.treeScroll} aria-busy={resource.loading}>
      {resource.error && <div className={css.loadError} role="alert"><span>{resource.error}</span><button onClick={resource.reload}>{ru ? "Обновить" : "Refresh"}</button></div>}
      {resource.loading && !resource.items.length ? <div className={css.skeleton} role="status" aria-label={ru ? "Загрузка папок" : "Loading folders"}><i /><i /><i /><i /></div> : <ul className={css.tree}>
        {tree.roots.map((node) => <RepositoryFolderBranch key={node.folder.id} node={node} depth={0} expanded={expanded} selected={props.selected}
          selectedFolder={props.selectedFolder} selectedFolderId={props.selectedFolderId} activeCaseId={props.activeCaseId} ru={ru} locked={props.locked || resource.busy}
          canManage={resource.canManage} onExpand={toggle} onFolder={props.onFolder} onCase={props.onCase} onToggle={props.onToggle} onScope={props.onScope} onMenu={setMenu} />)}
        {props.selectedFolder === "/" && tree.unfiled.map((item) => <RepositoryCaseLeaf key={item.id} item={item} depth={0} selected={props.selected.has(item.id)} active={props.activeCaseId === item.id}
          locked={props.locked} canManage={resource.canManage} ru={ru} onToggle={props.onToggle} onOpen={props.onCase} />)}
        {!tree.roots.length && !resource.error && <li className={css.empty}>{archive ? (ru ? "В архиве пока пусто" : "The archive is empty") : (ru ? "Создайте первую папку или импортируйте структуру из JSON." : "Create your first folder or import a structure from JSON.")}</li>}
      </ul>}
    </div>
    <p className={css.hint}>{ru ? "Удерживайте кейс, чтобы перенести. Выделение работает между папками." : "Hold a case to move it. Selection stays across folders."}</p>
    {menu && <FolderActionsDialog folder={menu} resource={resource} ru={ru} onClose={() => setMenu(null)} onCreateCase={props.onCreate} onCreated={props.onFolder} />}
  </aside>;
}
