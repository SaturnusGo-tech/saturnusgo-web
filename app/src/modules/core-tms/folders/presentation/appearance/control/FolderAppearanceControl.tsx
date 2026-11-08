import { lazy, Suspense, useCallback, useId, useRef, useState, type ReactNode } from "react";
import type { FolderAppearance, FolderIconId } from "../../../model/appearance/folder-appearance";
import type { RepositoryFolder } from "../../../model/folder";
import { useFolderAppearanceContext } from "../../../state/appearance/folder-appearance-context";
import { useFolderAppearanceEditor } from "../../../state/appearance-editor/useFolderAppearanceEditor";
import { markFolderAppearanceTipSeen } from "../../../state/appearance-onboarding/appearance-tip-storage";
import { useAnchoredPopup } from "../../../../presentation/common/popup/useAnchoredPopup";
import { FolderVisual } from "../visual/FolderVisual";
import type { FolderPickerEditor } from "../picker/FolderAppearancePicker";
import css from "./appearance-control.module.css";
const Picker = lazy(() => import("../picker/FolderAppearancePicker").then(module => ({ default: module.FolderAppearancePicker })));

export function FolderAppearanceControl({ folder, open: expanded, editable, disabled, ru, labelled, onOpen }: {
  folder: RepositoryFolder; open?: boolean; editable?: boolean; disabled?: boolean; ru: boolean; labelled?: boolean; onOpen?: () => void;
}) {
  const context = useFolderAppearanceContext(); const editor = useFolderAppearanceEditor(folder);
  if (!editable || !context.save || folder.archivedAt) return <FolderVisual appearance={folder.appearance} open={expanded} />;
  return <FolderAppearancePopover name={folder.name} appearance={folder.appearance} editor={editor}
    disabled={disabled} ru={ru} labelled={labelled} renderVisual={value => <FolderVisual appearance={value} open={expanded} />}
    onOpen={() => { markFolderAppearanceTipSeen(folder); onOpen?.(); }} />;
}

export function FolderAppearancePopover({ name, appearance, editor, disabled, ru, labelled, onOpen,
  renderVisual, defaultIcon, defaultColor, resetLabel }: {
  name: string; appearance?: FolderAppearance; editor: FolderPickerEditor;
  disabled?: boolean; ru: boolean; labelled?: boolean; onOpen?: () => void;
  renderVisual(value: FolderAppearance | undefined): ReactNode;
  defaultIcon?: FolderIconId; defaultColor?: string; resetLabel?: string;
}) {
  const [open, setOpen] = useState(false); const id = useId();
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useAnchoredPopup(open, false, root, trigger, panel, close, 420, 420);
  const label = ru ? "Оформление папки" : "Folder appearance";
  return <div ref={root} className={css.root} data-labelled={labelled || undefined} onKeyDown={event => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
  }}>
    <button ref={trigger} type="button" className={css.trigger} disabled={disabled} data-failed={editor.failed || undefined}
      aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined}
      aria-label={`${label}: ${name}`}
      onPointerDown={event => event.stopPropagation()} onClick={event => {
        event.stopPropagation();
        if (!open) onOpen?.();
        setOpen(!open);
      }}>
      {renderVisual(editor.busy || editor.failed || open ? editor.preview : appearance)}{labelled && <span>{label}</span>}
    </button>
    {open && <div ref={panel} id={id} popover="manual" role="dialog" aria-label={label} className={css.panel}>
      <Suspense fallback={<p role="status">{ru ? "Загрузка…" : "Loading…"}</p>}><Picker folder={{ appearance }} ru={ru}
        editor={editor} defaultIcon={defaultIcon} defaultColor={defaultColor} resetLabel={resetLabel} /></Suspense>
    </div>}
  </div>;
}
