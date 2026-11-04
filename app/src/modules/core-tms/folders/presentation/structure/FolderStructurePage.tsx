import { useEffect, useId, useMemo, useRef, useState } from "react";
import { PiCaretRight, PiPlus } from "react-icons/pi";
import type { FolderResource, RepositoryFolder } from "../../model/folder";
import type { RepositoryCreation } from "../../model/creation/repository-creation";
import { buildFolderTree } from "../../model/tree";
import { useFolderAppearanceContext } from "../../state/appearance/folder-appearance-context";
import { useFolderAppearanceTip } from "../../state/appearance-onboarding/useFolderAppearanceTip";
import { InlineFolderForm } from "../creation/InlineFolderForm";
import { FolderStructureBranch } from "./FolderStructureBranch";
import { FolderAppearanceTip } from "./onboarding/FolderAppearanceTip";
import css from "./structure.module.css";

const ROOT = "folder-structure-root";
export function FolderStructurePage({ resource, ru, onBack }: {
  resource: FolderResource; ru: boolean; onBack: () => void;
}) {
  const [draftParent, setDraftParent] = useState<string | null | undefined>(null);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const [confirmed, setConfirmed] = useState<RepositoryFolder[]>([]);
  const [saving, setSaving] = useState(false), [notice, setNotice] = useState("");
  const pending = useRef(false), mounted = useRef(false), rootDraft = useRef<HTMLDivElement>(null), newFolder = useRef<HTMLButtonElement>(null);
  const tree = useRef<HTMLUListElement>(null);
  const titleId = useId(), busy = resource.busy || saving, disabled = busy || resource.loading || !resource.canManage;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    setConfirmed(previous => {
      const next = previous.filter(folder => !resource.items.some(item => item.id === folder.id));
      return next.length === previous.length ? previous : next;
    });
  }, [resource.items]);
  const folders = useMemo(() => [...new Map([...confirmed, ...resource.items].map(folder => [folder.id, folder])).values()]
    .filter(folder => !folder.archivedAt), [resource.items, confirmed]);
  const roots = useMemo(() => buildFolderTree(folders, []).roots, [folders]);
  const appearance = useFolderAppearanceContext();
  const appearanceTip = useFolderAppearanceTip(roots[0]?.folder, !disabled && !resource.error && Boolean(appearance.save));
  function dismissTip() {
    appearanceTip.dismiss();
    requestAnimationFrame(() => tree.current?.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')?.focus({ preventScroll: true }));
  }
  function begin(parentId: string | null) {
    if (disabled || pending.current) return;
    if (parentId) {
      const parent = folders.find(folder => folder.id === parentId);
      if (!parent) return;
      const ancestors = folders.filter(folder => folder.id === parentId || parent.path.startsWith(`${folder.path}/`));
      setCollapsed(previous => new Set([...previous].filter(id => !ancestors.some(folder => folder.id === id))));
    }
    setDraftParent(parentId); setNotice("");
    if (parentId === null) requestAnimationFrame(() => rootDraft.current?.querySelector<HTMLInputElement>("input")?.focus());
  }
  const creation: RepositoryCreation = {
    folders, activeFolderId: draftParent === undefined ? null : draftParent ?? ROOT,
    begin: id => begin(id === ROOT ? null : id), close: () => setDraftParent(undefined), createCase() {},
    async create(name, parentId) {
      if (disabled || pending.current) return null;
      pending.current = true; setSaving(true);
      try { return await resource.create(name, parentId); }
      finally { pending.current = false; if (mounted.current) setSaving(false); }
    },
    created(folder) {
      setConfirmed(previous => [...previous.filter(item => item.id !== folder.id), folder]);
      const ancestors = folders.filter(parent => folder.path.startsWith(`${parent.path}/`));
      setCollapsed(previous => new Set([...previous].filter(id => !ancestors.some(parent => parent.id === id))));
      setNotice(ru ? `Папка «${folder.name}» создана.` : `Folder “${folder.name}” created.`);
    },
  };
  function toggle(id: string) {
    if (busy || pending.current) return;
    setCollapsed(previous => { const next = new Set(previous); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  return <section className={css.page} aria-labelledby={titleId} aria-busy={busy || resource.loading}>
    <div className={css.content}>
      <nav className={css.breadcrumb} aria-label={ru ? "Навигация по репозиторию" : "Repository navigation"}>
        <button type="button" disabled={busy} aria-label={ru ? "Вернуться в репозиторий" : "Back to repository"}
          onClick={() => { if (!busy && !pending.current) onBack(); }}>{ru ? "Репозиторий" : "Repository"}</button>
        <PiCaretRight size={11} aria-hidden="true" /><span aria-current="page">{ru ? "Структура папок" : "Folder structure"}</span>
      </nav>
      <header className={css.heading}><div><h1 id={titleId}>{ru ? "Структура папок" : "Folder structure"}</h1>
        <p>{ru ? "Папок" : "Folders"}: {folders.length}</p></div>
        <button ref={newFolder} type="button" className={css.newFolder} disabled={disabled} aria-label={ru ? "Новая папка" : "New folder"}
          onClick={() => begin(null)}><PiPlus size={14} aria-hidden="true" />{ru ? "Новая папка" : "New folder"}</button>
      </header>
      {resource.error && <div className={css.error} role="alert"><span>{resource.error}</span>
        <button type="button" disabled={busy || resource.loading} onClick={() => { if (!busy && !resource.loading) resource.reload(); }}>{ru ? "Повторить" : "Retry"}</button></div>}
      {resource.canManage && draftParent === null && <div className={css.rootDraft} ref={rootDraft}>
        <InlineFolderForm parentId={null} parentName={ru ? "Репозиторий" : "Repository"} creation={creation} disabled={disabled} ru={ru}
          restoreFocus={() => requestAnimationFrame(() => newFolder.current?.focus({ preventScroll: true }))} />
      </div>}
      {appearanceTip.visible && <FolderAppearanceTip ru={ru} onDismiss={dismissTip} />}
      <ul ref={tree} className={css.tree} aria-label={ru ? "Папки репозитория" : "Repository folders"}>
        {roots.map(node => <FolderStructureBranch key={node.folder.id} node={node} collapsed={collapsed} creation={creation}
          disabled={disabled} busy={busy} ru={ru} onToggle={toggle} onAppearanceOpen={appearanceTip.dismiss} />)}
      </ul>
      {!folders.length && <p className={css.empty} role="status">{resource.loading ? (ru ? "Загрузка папок…" : "Loading folders…")
        : (ru ? "Создайте первую папку, чтобы организовать репозиторий." : "Create the first folder to organize your repository.")}</p>}
      {notice && <p className={css.notice} role="status">{notice}</p>}
    </div>
  </section>;
}
