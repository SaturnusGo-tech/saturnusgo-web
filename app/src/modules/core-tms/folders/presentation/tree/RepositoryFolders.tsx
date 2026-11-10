import { ErrorToast } from "../../../presentation/common/error/ErrorToast";
import { Button } from "@heroui/button";
import { useDroppable } from "@dnd-kit/core";
import { useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PiArchiveDuotone, PiPlus } from "react-icons/pi";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { FolderResource, RepositoryFolder } from "../../model/folder";
import type { RepositoryCreation } from "../../model/creation/repository-creation";
import { defaultFolderExpansion, resolveFolderExpansion } from "../../model/expansion/default-expansion";
import { buildFolderTree } from "../../model/tree";
import { RepositoryFolderBranch } from "../branch/RepositoryFolderBranch";
import { RepositoryCaseLeaf } from "../case/RepositoryCaseLeaf";
import { FolderActionsDialog } from "../actions/FolderActionsDialog";
import { useRepositoryWidth, REPOSITORY_MIN, REPOSITORY_MAX } from "../resize/useRepositoryWidth";
import { RepositoryDragSelectionContext } from "../dnd/drag-click";
import { RepositoryDropReveal } from "./RepositoryDropReveal";
import { RepositoryEmptyState } from "./empty/RepositoryEmptyState";
import { FalconTooltip } from "../../../presentation/common/tooltip/FalconTooltip";
import css from "../styles/repository.module.css";

export function RepositoryFolders(props: {
  resource: FolderResource; cases: readonly TestCaseSummary[]; selected: ReadonlySet<string>; selectedFolder: string; selectedFolderId?: string;
  activeCaseId: string; loadingCaseId?: string; ru: boolean; locked: boolean; onToggle: (id: string) => void; onScope: (ids: readonly string[]) => void;
  onFolder: (path: string, id?: string) => void; onCase: (item: TestCaseSummary) => void; onCreate: (path?: string) => void;
  onNewFolder: () => void; onSelectionMode: () => void; onManageFolder?: (folderId: string) => void;
  controls?: ReactNode; selectionActions?: ReactNode; task?: ReactNode; filtered?: boolean; selectionMode?: boolean; includeArchived?: boolean; hasArchivedCases?: boolean; onArchiveChange?: (archived: boolean) => void;
}) {
  const { resource, ru } = props;
  const newFolderLabel = ru ? "Новая папка" : "New folder";
  const moving = useContext(RepositoryDragSelectionContext);
  const resize = useRepositoryWidth();
  const [revealed, setExpanded] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Map<string, boolean>>(new Map());
  const lastRevealed = useRef("");
  const [archive, setArchive] = useState(false);
  const hasArchivedData = resource.items.some(folder => Boolean(folder.archivedAt)) || (props.hasArchivedCases ?? props.cases.some(item => Boolean(item.archivedAt)));
  useEffect(() => { if (!resource.loading && !hasArchivedData) setArchive(false); }, [resource.loading, hasArchivedData]);
  useEffect(() => { props.onArchiveChange?.(archive); }, [archive, props.onArchiveChange]);
  const [menu, setMenu] = useState<{ folder: RepositoryFolder; trigger: HTMLButtonElement } | null>(null);
  const menuId = menu ? `repository-folder-actions-${menu.folder.id}` : undefined;
  const [activeCreator, setActiveCreator] = useState<string | null>(null);
  const [createdFolderId, setCreatedFolderId] = useState<string | null>(null);
  useEffect(() => {
    if (archive || props.locked || !resource.canManage || !resource.items.some(folder => folder.id === activeCreator && !folder.archivedAt)) setActiveCreator(null);
  }, [archive, props.locked, resource.canManage, resource.items, activeCreator]);
  const creation: RepositoryCreation | undefined = !archive && resource.canManage && !props.selectionMode ? {
    folders: resource.items.filter(folder => !folder.archivedAt),
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
  const drop = useDroppable({ id: "folder:root", data: { folderId: null }, disabled: props.locked || archive || !resource.canManage || resource.busy || resource.loading });
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
  function reveal(id: string) {
    const destination = resource.items.find(folder => folder.id === id && !folder.archivedAt);
    if (!destination) return;
    const ids = resource.items.filter(folder => folder.id === id || destination.path.startsWith(`${folder.path}/`)).map(folder => folder.id);
    setOverrides(current => ids.every(key => current.get(key) === true) ? current : new Map([...current, ...ids.map(key => [key, true] as const)]));
  }
  return <aside ref={resize.ref} style={resize.style} data-resizing={resize.resizing || undefined} data-selection={props.selectionMode || undefined} data-repository-tree className={css.repository} aria-label={ru ? "Папки и тест-кейсы" : "Folders and test cases"}>
    {moving.active && <RepositoryDropReveal onReveal={reveal} />}
    {props.task ?? <>
    <header className={css.heading}>
      <button className={css.repositoryTitle} disabled={props.locked} title={ru ? "Показать все тест-кейсы" : "Show all test cases"}
        onClick={() => { setArchive(false); props.onFolder(""); }}>{ru ? "Репозиторий" : "Repository"}</button>
      <Button type="button" size="sm" radius="full" className={css.newCase}
        isDisabled={props.locked || !resource.canManage || archive} onPress={() => props.onCreate()}
        aria-label={ru ? "Создать тест-кейс" : "Create test case"}>
        <PiPlus size={15} aria-hidden="true" />{ru ? "Создать" : "Create"}
      </Button>
    </header>
    {props.controls}
    <div ref={drop.setNodeRef} className={css.treeHeading} data-drag-root={moving.active || undefined} data-drop={drop.isOver || undefined}>
      <div className={css.foldersLabel}>
        <span>{moving.active ? (ru ? "В корень репозитория" : "Move to repository root") : archive ? (ru ? "Архив папок" : "Archived folders") : (ru ? "Папки" : "Folders")}</span>
        {!archive && !moving.active && !props.selectionMode && <FalconTooltip label={newFolderLabel}>
          <Button type="button" size="sm" variant="light" isIconOnly className={css.newFolder}
            isDisabled={props.locked || !resource.canManage} onPress={props.onNewFolder} aria-label={newFolderLabel}>
            <PiPlus size={12} aria-hidden="true" />
          </Button>
        </FalconTooltip>}
      </div>
      {!moving.active && <div className={css.treeActions}>
        {hasArchivedData && <button type="button" className={css.archiveToggle} aria-pressed={archive}
          disabled={Boolean(props.selectionMode)} aria-hidden={props.selectionMode || undefined} tabIndex={props.selectionMode ? -1 : undefined}
          aria-label={ru ? "Показать архив папок" : "Show archived folders"} onClick={() => setArchive(!archive)}><PiArchiveDuotone size={16} /></button>}
        <button type="button" className={css.selectCases} disabled={props.locked || resource.busy}
          aria-label={ru ? "Выбрать тест-кейсы" : "Select test cases"} aria-pressed={Boolean(props.selectionMode)} onClick={props.onSelectionMode}>
          {props.selectionMode ? (ru ? "Готово" : "Done") : (ru ? "Выбрать" : "Select")}
        </button>
      </div>}
      {props.selectionMode && !moving.active && <div className={css.selectionActions}>{props.selectionActions}</div>}
    </div>
    <div className={css.treeScroll} aria-busy={resource.loading}>
      <ErrorToast message={resource.error} retryLabel={ru ? "Обновить" : "Refresh"} onRetry={resource.reload} />
      {resource.loading && !resource.items.length ? <div className={css.skeleton} role="status" aria-label={ru ? "Загрузка папок" : "Loading folders"}><i /><i /><i /><i /></div> : <ul className={css.tree}>
        {roots.map((node) => <RepositoryFolderBranch key={node.folder.id} node={node} depth={0} expanded={expanded} selected={props.selected} titleMode="inline"
          customize={!props.selectionMode} creation={creation} selectedFolder={props.selectedFolder} selectedFolderId={props.selectedFolderId} activeCaseId={props.activeCaseId} loadingCaseId={props.loadingCaseId} ru={ru} locked={props.locked || resource.busy || resource.loading}
          canManage={resource.canManage} canSelect={Boolean(props.selectionMode) && resource.canManage} onExpand={toggle} onReveal={reveal} onFolder={props.onFolder} onCase={props.onCase} onToggle={props.onToggle} onScope={props.onScope}
          activeMenuFolderId={menu?.folder.id} menuId={menuId}
          onMenu={(folder, trigger) => setMenu(current => current?.trigger === trigger ? null : { folder, trigger })} />)}
        {tree.unfiled.map((item) => <RepositoryCaseLeaf key={item.id} item={item} depth={0} selected={props.selected.has(item.id)} active={props.activeCaseId === item.id} loading={props.loadingCaseId === item.id} titleMode="inline"
          creation={creation} locked={props.locked || resource.busy || resource.loading} canManage={resource.canManage} canSelect={Boolean(props.selectionMode) && resource.canManage} ru={ru} onToggle={props.onToggle} onOpen={props.onCase} />)}
        {!roots.length && !tree.unfiled.length && !resource.error && (props.filtered || archive
          ? <li className={css.empty}>{props.filtered ? (ru ? "Тест-кейсы не найдены. Измените поиск или фильтры." : "No matching test cases. Adjust the search or filters.") : (ru ? "В архиве пока пусто" : "The archive is empty")}</li>
          : <RepositoryEmptyState ru={ru} />)}
      </ul>}
    </div></>}
    <div {...resize.handleProps} className={css.resizeHandle} role="separator" tabIndex={0} aria-orientation="vertical"
      aria-label={ru ? "Изменить ширину репозитория" : "Resize repository"} aria-valuemin={REPOSITORY_MIN} aria-valuemax={REPOSITORY_MAX} aria-valuenow={resize.width}
      title={ru ? "Потяните, чтобы изменить ширину. Двойной клик — сбросить." : "Drag to resize. Double click to reset."} />
    {menu && <FolderActionsDialog key={menu.folder.id} id={menuId} folder={menu.folder} trigger={menu.trigger}
      resource={resource} ru={ru} onClose={() => setMenu(current => current?.trigger === menu.trigger ? null : current)}
      onCreateCase={props.onCreate} onCreateFolder={creation?.begin} onManageFolder={props.onManageFolder} />}
  </aside>;
}
