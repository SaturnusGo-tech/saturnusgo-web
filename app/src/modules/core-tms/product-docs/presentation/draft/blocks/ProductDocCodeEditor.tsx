"use client";

import { Button } from "@heroui/react";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { Annotation, Compartment, EditorState, Transaction } from "@codemirror/state";
import { EditorView, drawSelection, keymap, lineNumbers } from "@codemirror/view";
import { classHighlighter } from "@lezer/highlight";
import { $isCodeBlockNode, readOnly$, useCellValue, useCodeBlockEditorContext, type CodeBlockEditorProps } from "@mdxeditor/editor";
import { $createParagraphNode, $getNodeByKey, $setSelection } from "lexical";
import { ListOrdered, Trash2, WrapText } from "lucide-react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { ProductDocTooltip } from "../../overlay/ProductDocTooltip";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { productDocCodeLanguage, productDocCodeLanguageValue } from "./engine/codeLanguage";
import { productDocCodeSettings, updateProductDocCodeSetting } from "./engine/codeSettings";
import { CodeLanguageMenu } from "./language/CodeLanguageMenu";
import { CopySnippet } from "./snippet/CopySnippet";
import styles from "./productDocBlocks.module.css";

const syncFromDocument = Annotation.define<boolean>();

export function ProductDocCodeEditor({ code, language, meta, nodeKey, focusEmitter }: CodeBlockEditorProps) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const readOnly = useCellValue(readOnly$);
  const { parentEditor, setCode, setLanguage } = useCodeBlockEditorContext();
  const container = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  const languageSlot = useRef(new Compartment()).current;
  const settingsSlot = useRef(new Compartment()).current;
  const attributesSlot = useRef(new Compartment()).current;
  const source = useRef({ code, setCode });
  source.current = { code, setCode };
  const { wrap, lineNumbers: showNumbers } = productDocCodeSettings(meta);
  const currentLanguage = productDocCodeLanguageValue(language);

  function updateSetting(setting: "wrap" | "lineNumbers", enabled: boolean) {
    parentEditor.update(() => {
      const block = $getNodeByKey(nodeKey);
      if (!$isCodeBlockNode(block)) return;
      const nextMeta = updateProductDocCodeSetting(block.getMeta(), setting, enabled);
      // CommonMark cannot represent info-string metadata without a language token.
      if (!block.getLanguage() && nextMeta) block.setLanguage("text");
      block.setMeta(nextMeta);
    });
  }

  useLayoutEffect(() => {
    if (!container.current) return;
    const view = new EditorView({
      parent: container.current,
      state: EditorState.create({
        doc: source.current.code,
        extensions: [
          languageSlot.of([]), settingsSlot.of([]), attributesSlot.of([]),
          history(), drawSelection(), indentOnInput(), syntaxHighlighting(classHighlighter),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !update.transactions.some((transaction) => transaction.annotation(syncFromDocument))) {
              source.current.setCode(update.state.doc.toString());
            }
          }),
          EditorView.domEventHandlers({
            focus: () => parentEditor.update(() => $setSelection(null)),
            keydown: (event, current) => {
              event.stopPropagation();
              const { main } = current.state.selection;
              if (!main.empty || event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) return false;
              const next = event.key === "ArrowDown" && main.head === current.state.doc.length;
              const previous = event.key === "ArrowUp" && main.head === 0;
              if (!next && !previous) return false;
              parentEditor.update(() => {
                const node = $getNodeByKey(nodeKey);
                if (!node) return;
                const sibling = next ? node.getNextSibling() : node.getPreviousSibling();
                if (!sibling && !next) return;
                const target = sibling ?? node.insertAfter($createParagraphNode());
                current.contentDOM.blur();
                if (next) target.selectStart();
                else target.selectEnd();
              });
              return false;
            },
          }),
        ],
      }),
    });
    editor.current = view;
    return () => {
      view.destroy();
      editor.current = null;
    };
  }, [attributesSlot, languageSlot, nodeKey, parentEditor, settingsSlot]);

  useLayoutEffect(() => {
    const view = editor.current;
    if (view && code !== view.state.doc.toString()) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code },
        annotations: [syncFromDocument.of(true), Transaction.addToHistory.of(false)] });
    }
  }, [code]);

  useLayoutEffect(() => {
    editor.current?.dispatch({ effects: [
      settingsSlot.reconfigure([showNumbers ? lineNumbers() : [], wrap ? EditorView.lineWrapping : []]),
      attributesSlot.reconfigure([
        EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly),
        EditorView.contentAttributes.of({ "aria-label": ru ? "Код" : "Code", spellcheck: "false" }),
      ]),
    ] });
  }, [attributesSlot, readOnly, ru, settingsSlot, showNumbers, wrap]);

  useEffect(() => {
    let cancelled = false;
    editor.current?.dispatch({ effects: languageSlot.reconfigure([]) });
    void productDocCodeLanguage(language)?.load().then((support) => {
      if (!cancelled) editor.current?.dispatch({ effects: languageSlot.reconfigure(support.extension) });
    }, () => undefined);
    return () => { cancelled = true; };
  }, [language, languageSlot]);

  useEffect(() => {
    focusEmitter.subscribe(() => { if (!readOnly) editor.current?.focus(); });
  }, [focusEmitter, readOnly]);

  return <div className={styles.snippet} contentEditable={false} onKeyDown={(event) => event.stopPropagation()}>
    <div className={styles.snippetToolbar}>
      <CodeLanguageMenu ru={ru} value={currentLanguage} disabled={readOnly}
        onChange={(value) => setLanguage(value || (meta ? "text" : ""))} />
      <div className={styles.snippetActions}>
        <ProductDocTooltip label={ru ? "Номера строк" : "Line numbers"}>
          <Button size="sm" isIconOnly aria-label={ru ? "Номера строк" : "Line numbers"} aria-pressed={showNumbers}
            isDisabled={readOnly} onPress={() => updateSetting("lineNumbers", !showNumbers)}><ListOrdered size={15} aria-hidden="true" /></Button>
        </ProductDocTooltip>
        <ProductDocTooltip label={ru ? "Перенос строк" : "Wrap lines"}>
          <Button size="sm" isIconOnly aria-label={ru ? "Перенос строк" : "Wrap lines"} aria-pressed={wrap}
            isDisabled={readOnly} onPress={() => updateSetting("wrap", !wrap)}><WrapText size={15} aria-hidden="true" /></Button>
        </ProductDocTooltip>
        <CopySnippet code={code} locale={locale} />
        <ProductDocTooltip label={ru ? "Удалить блок кода" : "Remove code block"}>
          <Button size="sm" isIconOnly aria-label={ru ? "Удалить блок кода" : "Remove code block"}
            isDisabled={readOnly} onPress={() => parentEditor.update(() => {
              const node = $getNodeByKey(nodeKey);
              if (!node) return;
              const next = node.getNextSibling() ?? node.insertAfter($createParagraphNode());
              node.remove();
              next.selectStart();
            })}><Trash2 size={14} aria-hidden="true" /></Button>
        </ProductDocTooltip>
      </div>
    </div>
    <div className={styles.codeEditor} ref={container} />
  </div>;
}
