import type { SharedStepDraft } from "../../../shared-steps/model/shared-step";
import { FolderPathPicker } from "../../cases/inspector/placement/FolderPathPicker";
import css from "./placement.module.css";

export function SharedStepPlacement({ draft, folders, currentPath, ru, disabled, onChange }: {
  draft: SharedStepDraft; folders: readonly { id: string; path: string }[]; currentPath?: string;
  ru: boolean; disabled?: boolean; onChange(draft: SharedStepDraft): void;
}) {
  const path = draft.folderId ? folders.find(folder => folder.id === draft.folderId)?.path ?? currentPath ?? "/" : "/";
  const selectPath = (next: string) => {
    if (next === path) { onChange(draft); return; }
    if (next === "/") { onChange({ ...draft, folderId: null }); return; }
    const folder = folders.find(item => item.path === next);
    if (folder) onChange({ ...draft, folderId: folder.id });
  };
  return <div className={css.placement}>
    <FolderPathPicker value={path} folders={folders.map(folder => folder.path)} allowCreate={false} inline
      label={ru ? "Выбрать папку" : "Choose a folder"} ru={ru} disabled={disabled}
      onChange={selectPath} />
  </div>;
}
