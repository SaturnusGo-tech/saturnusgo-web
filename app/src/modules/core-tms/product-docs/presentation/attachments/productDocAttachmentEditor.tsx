"use client";

import { readOnly$, useCellValue, useLexicalNodeRemove, useMdastNodeUpdater, type DirectiveDescriptor } from "@mdxeditor/editor";
import type { LeafDirective } from "mdast-util-directive";
import { productDocAttachmentName, readProductDocAttachment } from "../../domain/attachments/productDocAttachment";
import { ProductDocAttachment } from "./ProductDocAttachment";

export const productDocAttachmentDescriptor: DirectiveDescriptor<LeafDirective> = {
  name: productDocAttachmentName,
  attributes: ["attachment", "width"],
  hasChildren: false,
  type: "leafDirective",
  testNode: (node) => node.type === "leafDirective" && node.name === productDocAttachmentName,
  Editor: function AttachmentEditor({ mdastNode }) {
    const readOnly = useCellValue(readOnly$);
    const update = useMdastNodeUpdater<LeafDirective>();
    const remove = useLexicalNodeRemove();
    const file = readProductDocAttachment(mdastNode.attributes);
    return <ProductDocAttachment {...file} onRemove={readOnly ? undefined : remove} onWidthChange={readOnly ? undefined : (width) => {
      const { width: _oldWidth, ...attributes } = mdastNode.attributes ?? {};
      update({ attributes: width === "inherit" ? attributes : { ...attributes, width: String(width) } });
    }} />;
  },
};
