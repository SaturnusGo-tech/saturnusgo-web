import { lazy, Suspense, useCallback, useId, useRef, useState } from "react";
import type { RepositoryFolder } from "../../../model/folder";
import { useFolderAppearanceContext } from "../../../state/appearance/folder-appearance-context";
import { useFolderAppearanceEditor } from "../../../state/appearance-editor/useFolderAppearanceEditor";
import { useAnchoredPopup } from "../../../../presentation/common/popup/useAnchoredPopup";
import { FolderVisual } from "../visual/FolderVisual";
import css from "./appearance-control.module.css";
const Picker = lazy(() => import("../picker/FolderAppearancePicker").then(module => ({ default: module.FolderAppearancePicker })));

export function FolderAppearanceControl({ folder, open: expanded, editable, disabled, ru, labelled }: {
  folder: RepositoryFolder; open?: boolean; editable?: boolean; disabled?: boolean; ru: boolean; labelled?: boolean;
}) {
  const context = useFolderAppearanceContext(); const editor = useFolderAppearanceEditor(folder);
  const [open, setOpen] = useState(false); const id = useId();
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const canEdit = Boolean(editable && context.save && !folder.archivedAt);
  useAnchoredPopup(open && canEdit, false, root, trigger, panel, close, 420, 420);
  if (!canEdit) return <FolderVisual appearance={folder.appearance} open={expanded} />;
  const appearance = editor.busy || editor.failed || open ? editor.preview : folder.appearance;
  return <div ref={root} className={css.root} data-labelled={labelled || undefined} onKeyDown={event => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
  }}>
    <button ref={trigger} type="button" className={css.trigger} disabled={disabled} data-failed={editor.failed || undefined}
      aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined}
      aria-label={`${ru ? "Оформление папки" : "Folder appearance"}: ${folder.name}`}
      onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); setOpen(!open); }}>
      <FolderVisual appearance={appearance} open={expanded} />{labelled && <span>{ru ? "Оформление папки" : "Folder appearance"}</span>}
    </button>
    {open && <div ref={panel} id={id} popover="manual" role="dialog" aria-label={ru ? "Оформление папки" : "Folder appearance"} className={css.panel}>
      <Suspense fallback={<p role="status">{ru ? "Загрузка…" : "Loading…"}</p>}><Picker folder={folder} ru={ru} editor={editor} /></Suspense>
    </div>}
  </div>;
}
