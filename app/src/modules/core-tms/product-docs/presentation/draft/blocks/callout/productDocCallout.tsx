import { AdmonitionDirectiveDescriptor, NestedLexicalEditor, type DirectiveDescriptor } from "@mdxeditor/editor";
import type { ContainerDirective } from "mdast-util-directive";
import styles from "./product-doc-callout.module.css";

export const productDocCallout: DirectiveDescriptor<ContainerDirective> = {
  ...AdmonitionDirectiveDescriptor,
  Editor: ({mdastNode}) => <div className={styles.callout} data-tone={mdastNode.name}>
    <NestedLexicalEditor<ContainerDirective> block getContent={node => node.children}
      getUpdatedMdastNode={(node, children) => ({...node, children: children as ContainerDirective["children"]})} />
  </div>,
};
