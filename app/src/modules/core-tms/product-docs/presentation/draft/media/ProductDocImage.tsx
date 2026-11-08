"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { $isImageNode, type ImageNode, type imagePlugin } from "@mdxeditor/editor";
import { $getNodeByKey, HISTORY_PUSH_TAG } from "lexical";
import { ImageIcon, Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { useProductDocImage } from "./productDocImageSource";
import { ProductDocImageResize } from "./resize/ProductDocImageResize";
import styles from "./image.module.css";

function ImageControls({ nodeKey, alt, width }: { nodeKey: string; alt: string; width?: number | "inherit" }) {
  const ru = useTmsLocale().locale === "ru";
  const [editor] = useLexicalComposerContext();
  const [selected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const image = useRef<HTMLImageElement>(null);
  const [editAlt, setEditAlt] = useState(false);
  const [draftWidth, setDraftWidth] = useState<number | null>(null);
  const [failed, setFailed] = useState<string>();
  const source = editor.getEditorState().read(() => {
    const node = $getNodeByKey(nodeKey);
    return $isImageNode(node) ? node.getSrc() : "";
  });
  const media = useProductDocImage(source, true);
  const displayedWidth = draftWidth ?? (typeof width === "number" ? width : undefined);
  const altLabel = ru ? "Альтернативный текст" : "Alt text";
  const removeLabel = ru ? "Удалить изображение" : "Remove image";
  const unavailable = media.unavailable || (media.src && failed === media.src);

  function updateNode(change: (node: ImageNode) => void) {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) change(node);
    }, { tag: HISTORY_PUSH_TAG });
  }

  return <figure className={styles.image} data-selected={selected || editAlt || undefined}>
    <div className={styles.preview}>
      {media.src && !unavailable ? <>
        <button type="button" className={styles.select} aria-label={ru ? "Выбрать изображение" : "Select image"}
          aria-pressed={selected} onClick={() => { clearSelection(); setSelected(true); }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={image} src={media.src} alt={alt} referrerPolicy="no-referrer" width={displayedWidth}
            onError={() => setFailed(media.src ?? undefined)} />
        </button>
        <ProductDocImageResize image={image} ru={ru} onResize={setDraftWidth}
          onCommit={(value) => updateNode((node) => node.setWidthAndHeight(value, "inherit"))} />
      </> : <div className={styles.placeholder} role="status">
        <ImageIcon size={16} aria-hidden="true" />
        {media.pending ? (ru ? "Загрузка изображения…" : "Loading image…")
          : (ru ? "Изображение недоступно" : "Image unavailable")}
      </div>}
      <div className={styles.tools}>
        <button type="button" title={altLabel} aria-label={altLabel} onClick={() => setEditAlt(true)}>
          <Pencil size={15} aria-hidden="true" />
        </button>
        <button type="button" title={removeLabel} aria-label={removeLabel} onClick={() => updateNode((node) => node.remove())}>
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
    {editAlt && <form className={styles.alt} onSubmit={(event) => {
      event.preventDefault();
      event.stopPropagation();
      const value = new FormData(event.currentTarget).get("alt")?.toString().trim() ?? "";
      updateNode((node) => node.setAltText(value));
      setEditAlt(false);
    }}>
      <input autoFocus name="alt" defaultValue={alt} maxLength={500} aria-label={altLabel} placeholder={altLabel}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Escape") setEditAlt(false);
        }} />
      <button type="submit">{ru ? "Сохранить" : "Save"}</button>
      <button type="button" onClick={() => setEditAlt(false)}>{ru ? "Отмена" : "Cancel"}</button>
    </form>}
  </figure>;
}

const emptyImage = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
type ImagePluginOptions = NonNullable<Parameters<typeof imagePlugin>[0]>;

export const productDocImageOptions = {
  ImageDialog: () => null,
  // MDXEditor passes nodeKey, alt and width at runtime but omits them from the option type.
  EditImageToolbar: ImageControls as ImagePluginOptions["EditImageToolbar"],
  // The decorator receives a placeholder. ImageControls resolves the source under Falcon's attachment rules.
  imagePreviewHandler: async () => emptyImage,
  disableImageResize: true,
} satisfies ImagePluginOptions;
