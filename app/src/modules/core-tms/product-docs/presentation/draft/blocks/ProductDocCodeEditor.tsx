"use client";

import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { Annotation, Compartment, EditorState, Transaction } from "@codemirror/state";
import { EditorView, drawSelection, keymap, lineNumbers, placeholder } from "@codemirror/view";
import { classHighlighter } from "@lezer/highlight";
import { $isCodeBlockNode, readOnly$, useCellValue, useCodeBlockEditorContext, type CodeBlockEditorProps } from "@mdxeditor/editor";
import { $createParagraphNode, $getNodeByKey, $setSelection } from "lexical";
import { CodeXml, ListOrdered, Trash2, WrapText } from "lucide-react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { AnimatedSelect } from "../../../../presentation/common/select/AnimatedSelect";
import { productDocCodeLanguage, productDocCodeLanguageValue, productDocLanguageOptions } from "./engine/codeLanguage";
import { productDocCodeSettings, updateProductDocCodeSetting } from "./engine/codeSettings";
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
        placeholder(ru ? "Введите или вставьте код" : "Type or paste code"),
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
      <AnimatedSelect label={ru ? "Язык" : "Language"} value={currentLanguage}
        options={productDocLanguageOptions(currentLanguage, ru ? "Обычный текст" : "Plain text")}
        triggerIcon={<CodeXml size={13} aria-hidden="true" />}
        onChange={(value) => setLanguage(value || (meta ? "text" : ""))}
        className={styles.language} compact menuMinWidth={164} disabled={readOnly} />
      <div className={styles.snippetActions}>
        <button type="button" aria-label={ru ? "Номера строк" : "Line numbers"} title={ru ? "Номера строк" : "Line numbers"}
          aria-pressed={showNumbers} disabled={readOnly} onClick={() => updateSetting("lineNumbers", !showNumbers)}><ListOrdered size={15} /></button>
        <button type="button" aria-label={ru ? "Перенос строк" : "Wrap lines"} title={ru ? "Перенос строк" : "Wrap lines"}
          aria-pressed={wrap} disabled={readOnly} onClick={() => updateSetting("wrap", !wrap)}><WrapText size={15} /></button>
        <CopySnippet code={code} locale={locale} />
        <button type="button" aria-label={ru ? "Удалить блок кода" : "Remove code block"} title={ru ? "Удалить блок кода" : "Remove code block"}
          disabled={readOnly} onClick={() => parentEditor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if (!node) return;
            const next = node.getNextSibling() ?? node.insertAfter($createParagraphNode());
            node.remove();
            next.selectStart();
          })}><Trash2 size={14} /></button>
      </div>
    </div>
    <div className={styles.codeEditor} ref={container} />
  </div>;
}
