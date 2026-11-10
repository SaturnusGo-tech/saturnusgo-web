import { ErrorToast } from "../../../../presentation/common/error/ErrorToast";
import { useId, useState } from "react";
import { PiArrowCounterClockwise } from "react-icons/pi";
import type { FolderAppearance, FolderIconId } from "../../../model/appearance/folder-appearance";
import type { useFolderAppearanceEditor } from "../../../state/appearance-editor/useFolderAppearanceEditor";
import { EmojiPicker } from "../../../../presentation/common/emoji/EmojiPicker";
import { FolderAppearanceIcons } from "./FolderAppearanceIcons";
import { FolderUpload } from "../../../gif-gallery/presentation/FolderUpload";
import css from "./appearance-picker.module.css";

type Tab = "icons" | "emoji" | "upload";
export type FolderPickerEditor = Pick<ReturnType<typeof useFolderAppearanceEditor>,
  "preview" | "uploading" | "error" | "failed" | "uploadFailed" | "busy" | "canUpload" |
  "choose" | "retry" | "image" | "previewColor" | "retryUpload" | "cancelUpload"> & {
  imageFormats?: { accept: string; label: string };
};
export function FolderAppearancePicker({ folder, ru, editor, defaultIcon, defaultColor, resetLabel }: {
  folder: { appearance?: FolderAppearance }; ru: boolean; editor: FolderPickerEditor;
  defaultIcon?: FolderIconId; defaultColor?: string; resetLabel?: string;
}) {
  const id = useId();
  const [tab, setTab] = useState<Tab>(folder.appearance?.kind === "emoji" ? "emoji" : folder.appearance?.kind === "image" || folder.appearance?.kind === "gif" ? "upload" : "icons");
  return <div className={css.picker}>
    <header><strong>{ru ? "Оформление папки" : "Folder appearance"}</strong>
      <button type="button" disabled={editor.uploading} title={resetLabel}
        aria-label={resetLabel ?? (ru ? "Стандартная папка" : "Reset to default folder")}
        onClick={() => editor.choose(null)}><PiArrowCounterClockwise size={15} /></button></header>
    <div role="tablist" aria-label={ru ? "Тип оформления" : "Appearance type"} className={css.tabs}>
      {(["icons", "emoji", "upload"] as const).map((value, index) => <button key={value} type="button" role="tab"
        id={`${id}-${value}`} aria-controls={`${id}-panel`} autoFocus={tab === value} aria-selected={tab === value} tabIndex={tab === value ? 0 : -1} onClick={() => setTab(value)} onKeyDown={event => {
          if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
          event.preventDefault(); const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);
          const next = (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
          tabs[next]?.click(); tabs[next]?.focus();
        }}>{value === "icons" ? (ru ? "Иконки" : "Icons") : value === "emoji" ? (ru ? "Эмодзи" : "Emojis") : "GIF"}</button>)}
    </div>
    <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${tab}`} className={css.content}>
      {tab === "icons" && <FolderAppearanceIcons editor={editor} ru={ru} defaultIcon={defaultIcon} defaultColor={defaultColor} />}
      {tab === "emoji" && <EmojiPicker locale={ru ? "ru" : "en"} dynamicWidth onSelect={emoji => editor.choose({ kind: "emoji", emoji })} />}
      {tab === "upload" && <FolderUpload editor={editor} ru={ru} />}
    </div>
    <ErrorToast message={editor.error} retryLabel={ru ? "Повторить" : "Retry"} onRetry={editor.uploadFailed ? editor.retryUpload : editor.failed ? editor.retry : undefined} />
    {!editor.error && <p role="status" className={css.status}>{editor.uploading ? (ru ? "Загрузка изображения…" : "Uploading image…")
        : editor.busy ? (ru ? "Сохранение…" : "Saving…") : (ru ? "Изменения сохраняются автоматически" : "Changes save automatically")}</p>}
  </div>;
}
