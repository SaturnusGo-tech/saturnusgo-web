import { addComposerChild$, addExportVisitor$, addImportVisitor$, realmPlugin } from "@mdxeditor/editor";
import { productDocExportImage, productDocImportImage } from "../codec/productDocImageVisitors";
import { ProductDocImageInput, productDocMediaBusyCallback$ } from "./ProductDocImageInput";

export const productDocImageInputPlugin = realmPlugin<{ onMediaBusy?: (pending: boolean) => void }>({
  init(realm, options) {
    realm.pubIn({
      [addComposerChild$]: ProductDocImageInput,
      [addImportVisitor$]: productDocImportImage,
      [addExportVisitor$]: productDocExportImage,
      [productDocMediaBusyCallback$]: options?.onMediaBusy,
    });
  },
  update(realm, options) {
    realm.pub(productDocMediaBusyCallback$, options?.onMediaBusy);
  },
});
