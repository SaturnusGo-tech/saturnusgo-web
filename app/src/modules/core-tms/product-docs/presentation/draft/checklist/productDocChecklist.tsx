"use client";

import { $isListItemNode, $isListNode, ListItemNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { addComposerChild$, addNestedEditorChild$, readOnly$, realmPlugin, useCellValue } from "@mdxeditor/editor";
import { $getNodeByKey, SKIP_DOM_SELECTION_TAG, setDOMUnmanaged, type NodeKey } from "lexical";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { FalconCheckbox } from "../../../../presentation/common/checkbox/FalconCheckbox";
import styles from "./product-doc-checklist.module.css";

type Task = { key: NodeKey; item: HTMLElement; host: HTMLSpanElement; text: string; checked: boolean };

function ProductDocChecklist() {
  const [editor] = useLexicalComposerContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const readOnly = useCellValue(readOnly$);
  const ru = useTmsLocale().locale === "ru";

  useEffect(() => {
    const mounted = new Map<NodeKey, Task>();

    function remove(key: NodeKey) {
      const current = mounted.get(key);
      if (!current) return;
      current.host.remove();
      delete current.item.dataset.productDocCheckItem;
      mounted.delete(key);
    }

    const unsubscribe = editor.registerMutationListener(ListItemNode, (mutations) => {
      editor.getEditorState().read(() => {
        let changed = false;
        for (const [key, mutation] of mutations) {
          const node = mutation === "destroyed" ? null : $getNodeByKey(key);
          const item = editor.getElementByKey(key);
          const parent = node?.getParent();
          if (!item || !$isListItemNode(node) || !$isListNode(parent) || parent.getListType() !== "check" || $isListNode(node.getFirstChild())) {
            changed ||= mounted.has(key);
            remove(key);
            continue;
          }
          if (mounted.get(key)?.item !== item) remove(key);
          const previous = mounted.get(key);
          const host = previous?.host ?? item.ownerDocument.createElement("span");
          if (!previous) {
            host.className = styles.position;
            host.contentEditable = "false";
            setDOMUnmanaged(host, { captureSelection: true });
            item.append(host);
          }
          item.dataset.productDocCheckItem = "";
          item.removeAttribute("role");
          item.removeAttribute("aria-checked");
          item.removeAttribute("tabindex");
          const text = node.getTextContent().trim();
          const checked = node.getChecked() === true;
          if (!previous || previous.checked !== checked || previous.text !== text) {
            mounted.set(key, { key, item, host, text, checked });
            changed = true;
          }
        }
        if (changed) setTasks([...mounted.values()]);
      });
    }, { skipInitialization: false });

    return () => {
      unsubscribe();
      for (const key of mounted.keys()) remove(key);
    };
  }, [editor]);

  return tasks.map(({ key, host, checked, text }) => createPortal(
    <FalconCheckbox aria-label={text || (ru ? "Отметить задачу" : "Mark task")} isSelected={checked} isReadOnly={readOnly}
      onValueChange={(value) => {
        if (!editor.isEditable()) return;
        editor.update(() => {
          const item = $getNodeByKey(key);
          if ($isListItemNode(item)) item.setChecked(value);
        }, { tag: SKIP_DOM_SELECTION_TAG });
      }} />,
    host, key,
  ));
}

export const productDocChecklistPlugin = realmPlugin({
  init(realm) {
    realm.pubIn({ [addComposerChild$]: ProductDocChecklist, [addNestedEditorChild$]: ProductDocChecklist });
  },
});
