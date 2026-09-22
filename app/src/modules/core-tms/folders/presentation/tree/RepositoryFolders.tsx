import { useDroppable } from "@dnd-kit/core";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PiArchiveDuotone, PiFolderPlusDuotone, PiUploadSimple, PiPlus } from "react-icons/pi";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { FolderResource, RepositoryFolder } from "../../model/folder";
import type { RepositoryCreation } from "../../model/creation/repository-creation";
import { defaultFolderExpansion, resolveFolderExpansion } from "../../model/expansion/default-expansion";
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
  const [revealed, setExpanded] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Map<string, boolean>>(new Map());
  const lastRevealed = useRef("");
  const [archive, setArchive] = useState(false);
  useEffect(() => { props.onArchiveChange?.(archive); }, [archive, props.onArchiveChange]);
  const [menu, setMenu] = useState<RepositoryFolder | null>(null);
  const [activeCreator, setActiveCreator] = useState<string | null>(null);
  const [createdFolderId, setCreatedFolderId] = useState<string | null>(null);
  useEffect(() => {
    if (archive || props.locked || !resource.canManage || !resource.items.some(folder => folder.id === activeCreator && !folder.archivedAt)) setActiveCreator(null);
  }, [archive, props.locked, resource.canManage, resource.items, activeCreator]);
  const creation: RepositoryCreation | undefined = !archive && resource.canManage && !props.selectionMode ? {
    activeFolderId: activeCreator, begin: setActiveCreator, close: () => setActiveCreator(null), create: resource.create,
    created: folder => {
      setCreatedFolderId(folder.id);
      const ancestors = resource.items.filter(parent => folder.path.startsWith(`${parent.path}/`)).map(parent => parent.id);
      setExpanded(current => new Set([...current, ...ancestors]));
      setOverrides(current => new Map([...current].filter(([id]) => !ancestors.includes(id))));
      props.onFolder(folder.path, folder.id);
    },
    createCase: props.onCreate,
  } : undefined;
  const tree = useMemo(() => buildFolderTree(resource.items, props.cases, archive, props.includeArchived), [resource.items, props.cases, archive, props.includeArchived]);
  const defaults = useMemo(() => defaultFolderExpansion(tree.roots), [tree]);
  const expanded = resolveFolderExpansion(defaults, overrides, revealed);
  const roots = useMemo(() => {
    const created = props.selectedFolderId === createdFolderId ? resource.items.find(folder => folder.id === createdFolderId) : undefined;
    function prune(nodes: typeof tree.roots): typeof tree.roots {
      return nodes.filter(node => node.caseIds.length || created?.id === node.folder.id || created?.path.startsWith(`${node.folder.path}/`))
        .map(node => ({ ...node, children: prune(node.children) }));
    }
    return props.filtered ? prune(tree.roots) : tree.roots;
  }, [tree, props.filtered, resource.items, createdFolderId, props.selectedFolderId]);
  const drop = useDroppable({ id: "folder:root", data: { folderId: null }, disabled: props.locked || archive });
  useEffect(() => {
    const selected = resource.items.find((item) => item.id === props.selectedFolderId);
    if (selected) setArchive(Boolean(selected.archivedAt));
    const active = props.cases.find((item) => item.id === props.activeCaseId);
    const path = active?.folderPath ?? props.selectedFolder;
    if (!path) return;
    const revealKey = [props.activeCaseId, path, ...resource.items.filter((folder) => path === folder.path || path.startsWith(`${folder.path}/`)).map((folder) => folder.id)].join(":");
    if (lastRevealed.current === revealKey) return;
    lastRevealed.current = revealKey;
    setOverrides((current) => new Map([...current].filter(([id]) => { const folder = resource.items.find((item) => item.id === id); return !folder || !(path === folder.path || path.startsWith(`${folder.path}/`)); })));
    setExpanded((current) => new Set([...current, ...resource.items.filter((folder) => path === folder.path || path.startsWith(`${folder.path}/`)).map((folder) => folder.id)]));
  }, [props.activeCaseId, props.selectedFolder, props.selectedFolderId, resource.items]);
  useEffect(() => {
    if (!props.filtered) return;
    const paths = props.cases.map((item) => item.folderPath);
    setOverrides((current) => new Map([...current].filter(([id]) => { const folder = resource.items.find((item) => item.id === id); return !folder || !paths.some((path) => path === folder.path || path.startsWith(`${folder.path}/`)); })));
    setExpanded((current) => new Set([...current, ...resource.items.filter((folder) => paths.some((path) => path === folder.path || path.startsWith(`${folder.path}/`))).map((folder) => folder.id)]));
  }, [props.filtered, props.cases, resource.items]);
  function toggle(id: string) { setOverrides((current) => new Map(current).set(id, !expanded.has(id))); }
  return <aside ref={resize.ref} style={resize.style} data-resizing={resize.resizing || undefined} data-selection={props.selectionMode || undefined} data-repository-tree className={css.repository} aria-label={ru ? "Папки и тест-кейсы" : "Folders and test cases"}>
    <header ref={drop.setNodeRef} className={css.heading} data-drop={drop.isOver || undefined}>
      <button className={css.repositoryTitle} disabled={props.locked} title={ru ? "Показать все тест-кейсы" : "Show all test cases"}
        onClick={() => { setArchive(false); props.onFolder(""); }}>{ru ? "Репозиторий" : "Repository"}</button><div>
      <button disabled={props.locked || !resource.canManage} onClick={props.onImport} className={css.headerAction} aria-label={ru ? "Импорт тест-кейсов" : "Import test cases"}><PiUploadSimple size={16} /><span>{ru ? "Импорт" : "Import"}</span></button>
      <button disabled={props.locked || !resource.canManage} onClick={props.onNewFolder} className={`${css.headerAction} ${css.newFolder}`} title={ru ? "Новая папка" : "New folder"} aria-label={ru ? "Новая папка" : "New folder"}><PiFolderPlusDuotone size={18} /><span>{ru ? "Новая папка" : "New folder"}</span></button>
      <button className={css.newCase} disabled={props.locked || !resource.canManage || archive} onClick={() => props.onCreate()} aria-label={ru ? "Новый тест-кейс" : "New test case"} title={ru ? "Новый тест-кейс" : "New test case"}><PiPlus size={18} /></button>
    </div></header>
    {props.controls}
    <div className={css.treeHeading}><span>{archive ? (ru ? "Архив папок" : "Archived folders") : (ru ? "Папки" : "Folders")}</span>
      <button aria-pressed={archive} aria-label={ru ? "Показать архив папок" : "Show archived folders"} onClick={() => setArchive(!archive)}><PiArchiveDuotone size={16} /></button></div>
    <div className={css.treeScroll} aria-busy={resource.loading}>
      {resource.error && <div className={css.loadError} role="alert"><span>{resource.error}</span><button onClick={resource.reload}>{ru ? "Обновить" : "Refresh"}</button></div>}
      {resource.loading && !resource.items.length ? <div className={css.skeleton} role="status" aria-label={ru ? "Загрузка папок" : "Loading folders"}><i /><i /><i /><i /></div> : <ul className={css.tree}>
        {roots.map((node) => <RepositoryFolderBranch key={node.folder.id} node={node} depth={0} expanded={expanded} selected={props.selected}
          creation={creation} selectedFolder={props.selectedFolder} selectedFolderId={props.selectedFolderId} activeCaseId={props.activeCaseId} ru={ru} locked={props.locked || resource.busy || resource.loading}
          canManage={resource.canManage} onExpand={toggle} onFolder={props.onFolder} onCase={props.onCase} onToggle={props.onToggle} onScope={props.onScope} onMenu={setMenu} />)}
        {tree.unfiled.map((item) => <RepositoryCaseLeaf key={item.id} item={item} depth={0} selected={props.selected.has(item.id)} active={props.activeCaseId === item.id}
          creation={creation} locked={props.locked || resource.busy || resource.loading} canManage={resource.canManage} ru={ru} onToggle={props.onToggle} onOpen={props.onCase} />)}
        {!roots.length && !tree.unfiled.length && !resource.error && <li className={css.empty}>{props.filtered ? (ru ? "Тест-кейсы не найдены. Измените поиск или фильтры." : "No matching test cases. Adjust the search or filters.") : archive ? (ru ? "В архиве пока пусто" : "The archive is empty") : (ru ? "Создайте первую папку или импортируйте структуру из JSON." : "Create your first folder or import a structure from JSON.")}</li>}
      </ul>}
    </div>
    <div {...resize.handleProps} className={css.resizeHandle} role="separator" tabIndex={0} aria-orientation="vertical"
      aria-label={ru ? "Изменить ширину репозитория" : "Resize repository"} aria-valuemin={REPOSITORY_MIN} aria-valuemax={REPOSITORY_MAX} aria-valuenow={resize.width}
      title={ru ? "Потяните, чтобы изменить ширину. Двойной клик — сбросить." : "Drag to resize. Double click to reset."} />
    {menu && <FolderActionsDialog folder={menu} resource={resource} ru={ru} onClose={() => setMenu(null)} onCreateCase={props.onCreate} onCreated={props.onFolder} />}
  </aside>;
}
