"use client";

import { activeEditor$, addComposerChild$, currentSelection$, readOnly$, realmPlugin, rootEditor$, useCellValue, usePublisher } from "@mdxeditor/editor";
import { Signal, useRealm } from "@mdxeditor/gurx";
import type { RangeSelection } from "lexical";
import { useEffect, useState } from "react";
import { KlipyGallery } from "../../../../../folders/gif-gallery/presentation/KlipyGallery";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { ProductDocModal } from "../../../overlay/ProductDocModal";
import { captureImageTarget, insertProductDocImages, type ProductDocImageTarget } from "../insertion/productDocImageInsertion";
import { productDocImageSource } from "../productDocImageSource";
import styles from "./gif.module.css";

const openProductDocGif$ = Signal<ProductDocImageTarget>();

export function useProductDocGif() {
  const active = useCellValue(activeEditor$);
  const root = useCellValue(rootEditor$);
  const current = useCellValue(currentSelection$);
  const open = usePublisher(openProductDocGif$);
  return (selection?: RangeSelection | null) => {
    const editor = active ?? root;
    if (!editor?.isEditable()) return;
    open(selection === undefined ? captureImageTarget(editor, current) : { editor, selection: selection?.clone() ?? null });
  };
}

function ProductDocGifPicker() {
  const realm = useRealm();
  const readOnly = useCellValue(readOnly$);
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const [target, setTarget] = useState<ProductDocImageTarget | null>(null);
  useEffect(() => realm.sub(openProductDocGif$, setTarget), [realm]);

  if (!target || readOnly) return null;
  return <ProductDocModal title={ru ? "Вставить GIF" : "Insert GIF"} closeLabel={ru ? "Закрыть" : "Close"}
    onClose={() => setTarget(null)} className={styles.panel}>
    <KlipyGallery ru={ru} onChoose={(gif) => {
      const source = productDocImageSource(gif.url);
      if (!source || !target.editor.getRootElement()?.isConnected) return;
      insertProductDocImages(target, [source.url.href]);
      setTarget(null);
      requestAnimationFrame(() => { if (target.editor.getRootElement()?.isConnected) target.editor.focus(); });
    }} />
  </ProductDocModal>;
}

export const productDocGifPlugin = realmPlugin({
  init(realm) { realm.pub(addComposerChild$, ProductDocGifPicker); },
});
