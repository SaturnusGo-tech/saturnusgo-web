import { AdmonitionDirectiveDescriptor, NestedLexicalEditor, type DirectiveDescriptor } from "@mdxeditor/editor";
import type { ContainerDirective } from "mdast-util-directive";
import { ProductDocCallout, isProductDocCalloutTone } from "./surface/ProductDocCallout";

export const productDocCallout: DirectiveDescriptor<ContainerDirective> = {
  ...AdmonitionDirectiveDescriptor,
  Editor: ({mdastNode}) => <ProductDocCallout tone={isProductDocCalloutTone(mdastNode.name) ? mdastNode.name : "note"}>
    <NestedLexicalEditor<ContainerDirective> block getContent={node => node.children}
      getUpdatedMdastNode={(node, children) => ({...node, children: children as ContainerDirective["children"]})} />
  </ProductDocCallout>,
};
