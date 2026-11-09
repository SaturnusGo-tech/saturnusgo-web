"use client";

import { LoadingOrb } from "../../../../../../../shared/components/loading/LoadingOrb";
import { addToast, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Textarea } from "@heroui/react";
import { $isCodeBlockNode, readOnly$, useCellValue, useCodeBlockEditorContext, type CodeBlockEditorProps } from "@mdxeditor/editor";
import { $createParagraphNode, $getNodeByKey, $setSelection } from "lexical";
import { Braces, Copy, EllipsisVertical, Maximize2, MousePointer2, Send, SquareFunction, Trash2, Workflow } from "lucide-react";
import { useContext, useEffect, useRef, useState, type ClipboardEvent } from "react";
import { writeClipboardText } from "../../../../../../../shared/lib/clipboard";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { productDocDiagramErrorStatus, useProductDocDiagram } from "../../../../state/diagrams/useProductDocDiagram";
import { ProductDocEmbedContext } from "../../../embeds/context/productDocEmbedContext";
import { StructuredAction } from "./controls/StructuredAction";
import { useProductDocStructuredRender } from "./render/useProductDocStructuredRender";
import { ProductDocStructuredDialog } from "./viewer/ProductDocStructuredDialog";
import { ProductDocStructuredPreview } from "./ProductDocStructuredPreview";
import { canRenderDiagram, isDiagramSource, maximumDiagramPrompt, maximumDiagramSource, maximumFormulaSource, structuredBlockKind } from "../../../../domain/structured/structuredMarkdown";
import styles from "./product-doc-structured.module.css";

function generationError(error: unknown, ru: boolean) {
  const status = productDocDiagramErrorStatus(error);
  if (status === 429) return ru ? "Лимит запросов исчерпан. Попробуйте позже." : "Generation limit reached. Try again later.";
  if (status === 422) return ru ? "Попробуйте точнее описать диаграмму." : "Try describing the diagram more specifically.";
  return ru ? "Не удалось создать диаграмму. Попробуйте ещё раз." : "Couldn’t generate the diagram. Try again.";
}

export function ProductDocStructuredBlock({ language, code, nodeKey, focusEmitter }: CodeBlockEditorProps) {
  const kind = structuredBlockKind(language) ?? "diagram";
  const diagram = kind === "diagram";
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const generateDiagram = useProductDocDiagram();
  const scope = useContext(ProductDocEmbedContext);
  const readOnly = useCellValue(readOnly$);
  const { parentEditor, setCode } = useCodeBlockEditorContext();
  const input = useRef<HTMLTextAreaElement>(null);
  const activeRequest = useRef<AbortController>(null);
  const blockSource = useRef(code);
  blockSource.current = code;
  const [showSource, setShowSource] = useState(false);
  const [editingSource, setEditingSource] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const isSource = diagram ? isDiagramSource(code) : Boolean(code.trim());
  const preview = isSource && !showSource && !editingSource;
  const rendered = useProductDocStructuredRender(kind, code, isSource && (preview || expanded));
  const mayGenerate = diagram && !readOnly && !isSource && Boolean(code.trim() && generateDiagram && scope);
  const title = diagram ? (ru ? "Диаграмма Mermaid" : "Mermaid diagram") : (ru ? "Формула LaTeX" : "LaTeX formula");
  const placeholder = diagram ? (ru ? "Опишите диаграмму…" : "Describe your diagram…")
    : (ru ? "Введите LaTeX, чтобы вставить формулу" : "Type LaTeX to insert a formula");
  const copyLabel = ru ? "Копировать исходник" : "Copy source";
  const previewLabel = preview ? (ru ? "Показать исходник" : "Show source") : (ru ? "Предпросмотр" : "Preview");
  const expandLabel = ru ? "Развернуть" : "Expand";
  const closeLabel = ru ? "Закрыть предпросмотр" : "Close preview";
  const selectLabel = ru ? "Выделить исходник" : "Select source";
  const removeLabel = ru ? "Удалить" : "Delete";
  const PreviewIcon = diagram ? Workflow : SquareFunction;

  useEffect(() => { focusEmitter.subscribe(() => input.current?.focus({ preventScroll: true })); }, [focusEmitter]);
  useEffect(() => () => activeRequest.current?.abort(), []);

  function change(next: string) {
    setCode(next);
    setError("");
  }

  function pasteSource(event: ClipboardEvent<HTMLElement>) {
    const pasted = event.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n");
    if (!pasted.trim() || !input.current) return;
    const { selectionStart, selectionEnd } = input.current;
    const next = code.slice(0, selectionStart) + pasted + code.slice(selectionEnd);
    if (diagram ? !canRenderDiagram(next) : next.length > maximumFormulaSource) return;
    event.preventDefault();
    event.stopPropagation();
    change(next);
    setEditingSource(false);
    setShowSource(false);
  }

  async function copy() {
    try {
      await writeClipboardText(code);
      addToast({ title: ru ? "Исходник скопирован" : "Source copied", severity: "success" });
    } catch {
      addToast({ title: ru ? "Выделите и скопируйте исходник вручную" : "Select and copy the source", severity: "danger" });
    }
  }

  async function generate() {
    if (!mayGenerate || !scope || !generateDiagram || activeRequest.current) return;
    const prompt = code.trim();
    if (prompt.length > maximumDiagramPrompt) {
      setError(ru ? "Описание должно содержать не больше 2 000 символов." : "Describe the diagram in 2,000 characters or less.");
      return;
    }
    const controller = new AbortController();
    activeRequest.current = controller;
    setGenerating(true);
    setError("");
    try {
      const source = await generateDiagram(scope, prompt, controller.signal);
      if (controller.signal.aborted || blockSource.current !== code) return;
      if (!canRenderDiagram(source)) throw new Error("Unexpected diagram result");
      setCode(source);
      setEditingSource(false);
      setShowSource(false);
    } catch (failure) {
      if (!controller.signal.aborted) setError(generationError(failure, ru));
    } finally {
      activeRequest.current = null;
      if (!controller.signal.aborted) setGenerating(false);
    }
  }

  function remove() {
    parentEditor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!$isCodeBlockNode(node)) return;
      const sibling = node.getNextSibling() ?? node.getPreviousSibling() ?? node.insertAfter($createParagraphNode());
      node.remove();
      sibling.selectStart();
    });
  }

  const toolbar = <div className={styles.controls}>
    <StructuredAction label={copyLabel} disabled={!code} onPress={() => void copy()}><Copy size={14} aria-hidden="true" /></StructuredAction>
    <StructuredAction label={previewLabel} disabled={!isSource} pressed={preview}
      onPress={() => { setShowSource(preview); setEditingSource(false); }}>{preview ? <Braces size={14} aria-hidden="true" /> : <PreviewIcon size={14} aria-hidden="true" />}</StructuredAction>
    <StructuredAction label={expandLabel} disabled={!code} onPress={() => setExpanded(true)}><Maximize2 size={14} aria-hidden="true" /></StructuredAction>
  </div>;
  return <div className={styles.block} data-structured-block={kind} data-editor-dialog contentEditable={false}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setEditingSource(false); }}>
    {!readOnly && <Dropdown placement="bottom-start" classNames={{ content: styles.menu }}>
      <DropdownTrigger>
        <Button type="button" variant="light" size="sm" disableRipple isIconOnly className={styles.handle}
          aria-label={ru ? "Действия блока" : "Block actions"}><EllipsisVertical size={15} aria-hidden="true" /></Button>
      </DropdownTrigger>
      <DropdownMenu aria-label={ru ? "Действия блока" : "Block actions"} itemClasses={{ base: styles.menuItem }}
        onAction={(key) => {
          if (key === "copy") void copy();
          if (key === "select") {
            setShowSource(true);
            requestAnimationFrame(() => { input.current?.focus(); input.current?.select(); });
          }
          if (key === "delete") remove();
        }}>
        <DropdownItem key="copy" startContent={<Copy size={14} aria-hidden="true" />}>{copyLabel}</DropdownItem>
        <DropdownItem key="select" startContent={<MousePointer2 size={14} aria-hidden="true" />}>{selectLabel}</DropdownItem>
        <DropdownItem key="delete" startContent={<Trash2 size={14} aria-hidden="true" />}>{removeLabel}</DropdownItem>
      </DropdownMenu>
    </Dropdown>}
    <div className={styles.surface} data-kind={kind} data-preview={preview || undefined}>
      {toolbar}
      {preview ? <ProductDocStructuredPreview kind={kind} source={code} result={rendered} /> :
        <div className={styles.fieldShell} data-input-shell><Textarea ref={input} aria-label={title} placeholder={placeholder} value={code}
          minRows={diagram ? 3 : 1} maxRows={14} maxLength={diagram ? maximumDiagramSource : maximumFormulaSource}
          spellCheck="false" isReadOnly={readOnly} isDisabled={generating}
          classNames={{ base: styles.field, inputWrapper: styles.inputWrapper, input: styles.input }}
          onValueChange={change} onKeyDown={(event) => event.stopPropagation()}
          onPaste={pasteSource}
          onFocus={() => { setEditingSource(true); parentEditor.update(() => $setSelection(null)); }} /></div>}
      {diagram && !isSource && !readOnly && <div className={styles.footer}>
        {error && <p role="alert">{error}</p>}
        {mayGenerate && <Button type="button" size="sm" variant="light" radius="full" disableRipple className={styles.generate}
          isLoading={generating} spinner={<LoadingOrb />} onPress={() => void generate()}
          startContent={!generating && <Send size={13} aria-hidden="true" />}>{ru ? "Сгенерировать" : "Generate"}</Button>}
      </div>}
    </div>
    <ProductDocStructuredDialog isOpen={expanded} onClose={() => setExpanded(false)} title={title}
      closeLabel={closeLabel} kind={kind} source={code} result={rendered} showSource={!isSource} />
  </div>;
}
