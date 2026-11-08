"use client";

import { Button, Input } from "@heroui/react";
import { addNestedEditorChild$, NESTED_EDITOR_UPDATED_COMMAND, NestedLexicalEditor, readOnly$, realmPlugin,
  useCellValue, useMdastNodeUpdater, type DirectiveDescriptor } from "@mdxeditor/editor";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { ContainerDirective } from "mdast-util-directive";
import { useEffect, useId, useState, type ReactNode } from "react";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { productDocCollapseName } from "../../../../domain/structured/structuredMarkdown";
import styles from "./product-doc-collapse.module.css";

function ProductDocCollapse({ title, initialOpen, children }: { title: ReactNode; initialOpen: boolean; children: ReactNode }) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(initialOpen);
  const panelId = useId();
  const label = open ? (ru ? "Свернуть раздел" : "Collapse section") : (ru ? "Раскрыть раздел" : "Expand section");

  return <div className={styles.collapse} data-collapsible-section data-open={open || undefined}>
    <div className={styles.collapseHeader}>
      <Button type="button" size="sm" variant="light" isIconOnly disableRipple contentEditable={false}
        className={styles.collapseToggle} aria-label={label} aria-expanded={open} aria-controls={panelId}
        onPress={() => setOpen((value) => !value)}><ChevronRight size={14} aria-hidden="true" /></Button>
      {title}
    </div>
    <motion.div className={styles.collapsePanel} id={panelId} initial={false}
      animate={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
      transition={{ duration: reduce ? 0 : .2, ease: [.22, .7, .2, 1] }}
      inert={!open} aria-hidden={!open || undefined}>
      <div className={styles.collapseInner}>{children}</div>
    </motion.div>
  </div>;
}

function SynchronizeCollapseContent() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!editor.getRootElement()?.classList.contains(styles.collapseContent)) return;
    // The default nested editor only saves on blur outside the entire editor.
    // Keep the draft and its Save action current while writing inside this section.
    return editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
      if (!dirtyElements.size && !dirtyLeaves.size) return;
      editor.dispatchCommand(NESTED_EDITOR_UPDATED_COMMAND, undefined);
    });
  }, [editor]);
  return null;
}

export const productDocCollapsePlugin = realmPlugin({
  init(realm) { realm.pub(addNestedEditorChild$, SynchronizeCollapseContent); },
});

function ProductDocCollapseEditor({ node }: { node: ContainerDirective }) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const update = useMdastNodeUpdater<ContainerDirective>();
  const readOnly = useCellValue(readOnly$);
  const label = ru ? "Название раздела" : "Section title";
  return <ProductDocCollapse initialOpen title={<div className={styles.collapseTitleHost} data-input-shell contentEditable={false}>
    <Input aria-label={label} placeholder={ru ? "Добавьте название раздела…" : "Add section title…"}
      size="sm" variant="flat" spellCheck="false" isReadOnly={readOnly}
      value={node.attributes?.title ?? ""} maxLength={200}
      classNames={{ base: styles.collapseTitle, inputWrapper: styles.titleWrapper, input: styles.titleInput }}
      onValueChange={(value) => update({ attributes: { ...node.attributes, title: value } })}
      onKeyDown={(event) => event.stopPropagation()} />
  </div>}>
    <NestedLexicalEditor<ContainerDirective> block getContent={(current) => current.children}
      contentEditableProps={{ className: styles.collapseContent, "aria-label": ru ? "Содержимое раздела" : "Section content" }}
      getUpdatedMdastNode={(current, children) => ({ ...current, children: children as ContainerDirective["children"] })} />
  </ProductDocCollapse>;
}

export function ProductDocCollapseReader({ heading, children }: { heading?: string; children: ReactNode }) {
  const { locale } = useTmsLocale();
  const title = heading?.trim() || (locale === "ru" ? "Раздел" : "Section");
  return <ProductDocCollapse initialOpen={false} title={<span className={styles.collapseHeading}>{title}</span>}>{children}</ProductDocCollapse>;
}

export const productDocCollapseDescriptor: DirectiveDescriptor<ContainerDirective> = {
  name: productDocCollapseName,
  type: "containerDirective",
  attributes: ["title"],
  hasChildren: true,
  testNode: (node) => node.type === "containerDirective" && node.name === productDocCollapseName,
  Editor: ({ mdastNode }) => <ProductDocCollapseEditor node={mdastNode} />,
};
