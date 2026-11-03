import { useRef } from "react";
import { PiUploadSimple, PiX } from "react-icons/pi";
import type { useFolderAppearanceEditor } from "../../state/appearance-editor/useFolderAppearanceEditor";
import { KlipyGallery } from "./KlipyGallery";
import css from "./gallery.module.css";

export function FolderUpload({ editor, ru }: { editor: ReturnType<typeof useFolderAppearanceEditor>; ru: boolean }) {
  const file = useRef<HTMLInputElement>(null);
  return <div className={css.upload}>
    <KlipyGallery ru={ru} selected={editor.preview} onChoose={editor.choose} />
    <div className={css.ownImage}>
      <input ref={file} hidden type="file" disabled={editor.uploading || !editor.canUpload}
        aria-label={ru ? "Изображение папки" : "Folder image"} accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/heic,image/heif,.heic,.heif"
        onChange={event => { const value = event.target.files?.[0]; event.target.value = ""; if (value) void editor.image(value); }} />
      <div className={css.fileActions}><button type="button" disabled={editor.uploading || !editor.canUpload} onClick={() => file.current?.click()}>
        <PiUploadSimple size={14} />{ru ? "Загрузить своё изображение" : "Upload your image"}</button>
        {editor.uploading && <button type="button" onClick={editor.cancelUpload}><PiX size={14} />{ru ? "Отменить" : "Cancel"}</button>}</div>
      <p>PNG, JPG, WebP, AVIF, GIF, HEIC · {ru ? "до 10 МБ" : "up to 10 MB"}</p>
    </div>
  </div>;
}
