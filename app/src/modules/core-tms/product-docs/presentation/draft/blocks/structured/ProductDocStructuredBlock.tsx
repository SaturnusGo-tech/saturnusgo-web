"use client";

import { ErrorToast, showErrorToast } from "../../../../../presentation/common/error/ErrorToast";
import { addToast, Button, Textarea } from "@heroui/react";
import { $isCodeBlockNode, readOnly$, useCellValue, useCodeBlockEditorContext, type CodeBlockEditorProps } from "@mdxeditor/editor";
import { $createParagraphNode, $getNodeByKey, $setSelection } from "lexical";
import { Braces, Copy, Maximize2, Send, SquareFunction, Workflow } from "lucide-react";
import { useContext, useEffect, useLayoutEffect, useRef, useState, type ClipboardEvent } from "react";
import { writeClipboardText } from "../../../../../../../shared/lib/clipboard";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { productDocDiagramErrorStatus, useProductDocDiagram } from "../../../../state/diagrams/useProductDocDiagram";
import { ProductDocEmbedContext } from "../../../embeds/context/productDocEmbedContext";
import { StructuredAction } from "./controls/StructuredAction";
import { StructuredBlockActions } from "./controls/StructuredBlockActions";
import { StructuredBlockMenu } from "./controls/menu/StructuredBlockMenu";
import { useStructuredBlockActivity } from "./motion/useStructuredBlockActivity";
import { useStructuredBlockFootprint } from "./motion/useStructuredBlockFootprint";
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
  const generateButton = useRef<HTMLButtonElement>(null);
  const activeRequest = useRef<{ source: string; controller: AbortController }>(null);
  const generationKey = diagram && !readOnly ? code : null;
  const blockSource = useRef(generationKey);
  blockSource.current = generationKey;
  const [showSource, setShowSource] = useState(false);
  const [editingSource, setEditingSource] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [generationSource, setGenerationSource] = useState<string | null>(null);
  const [error, setError] = useState("");
  const isSource = diagram ? isDiagramSource(code) : Boolean(code.trim());
  const committingDiagram = diagram && generationSource !== null && generationSource !== code;
  const preview = isSource && !showSource && (!editingSource || committingDiagram);
  const rendered = useProductDocStructuredRender(kind, code, isSource && (preview || expanded));
  const generating = generationSource !== null && generationSource === generationKey;
  const pending = generating || (preview && !rendered);
  const mayGenerate = diagram && !readOnly && !isSource && Boolean(code.trim() && generateDiagram && scope);
  const activity = useStructuredBlockActivity(pending, generating || preview || (mayGenerate && !showSource));
  const surface = useStructuredBlockFootprint(!activity.reveal);
  const keepPrompt = preview && generationSource !== null; // Keep the prompt until the saved source can be shown.
  const showPreview = preview && activity.reveal && !keepPrompt;
  const hasDiagram = diagram && showPreview && rendered && !("invalid" in rendered);
  const title = diagram ? (ru ? "Диаграмма" : "Diagram") : (ru ? "Формула LaTeX" : "LaTeX formula");
  const placeholder = diagram ? (ru ? "Опишите диаграмму…" : "Describe your diagram…")
    : (ru ? "Введите LaTeX, чтобы вставить формулу" : "Type LaTeX to insert a formula");
  const copyLabel = ru ? "Копировать исходник" : "Copy source";
  const previewLabel = preview ? (ru ? "Показать исходник" : "Show source") : (ru ? "Предпросмотр" : "Preview");
  const expandLabel = ru ? "Развернуть" : "Expand";
  const closeLabel = ru ? "Закрыть предпросмотр" : "Close preview";
  const PreviewIcon = diagram ? Workflow : SquareFunction;

  useEffect(() => { focusEmitter.subscribe(() => input.current?.focus({ preventScroll: true })); }, [focusEmitter]);
  useEffect(() => () => activeRequest.current?.controller.abort(), []);
  useEffect(() => {
    const request = activeRequest.current;
    if (request && request.source !== generationKey) cancelGeneration();
  }, [generationKey]);

  useLayoutEffect(() => {
    if (generationSource === null || generating || (preview && !activity.reveal)) return;
    if (preview && generateButton.current === document.activeElement) surface.current?.focus({ preventScroll: true });
    setGenerationSource(null);
  }, [activity.reveal, generating, generationSource, preview, surface]);

  function cancelGeneration() {
    const request = activeRequest.current;
    if (!request) return;
    activeRequest.current = null;
    request.controller.abort();
    setGenerationSource(null);
  }

  function change(next: string) {
    cancelGeneration();
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
      showErrorToast({ message: ru ? "Выделите и скопируйте исходник вручную" : "Select and copy the source" });
    }
  }

  async function generate() {
    if (!mayGenerate || !scope || !generateDiagram || generating || activeRequest.current) return;
    const prompt = code.trim();
    if (prompt.length > maximumDiagramPrompt) {
      setError(ru ? "Описание должно содержать не больше 2 000 символов." : "Describe the diagram in 2,000 characters or less.");
      return;
    }
    const controller = new AbortController();
    const request = { source: code, controller };
    activeRequest.current = request;
    setGenerationSource(code);
    setShowSource(false);
    setError("");
    try {
      const source = await generateDiagram(scope, prompt, controller.signal);
      if (controller.signal.aborted || blockSource.current !== code) return;
      if (!canRenderDiagram(source)) throw new Error("Unexpected diagram result");
      setEditingSource(false);
      setCode(source);
    } catch (failure) {
      if (!controller.signal.aborted && blockSource.current === code) {
        setError(generationError(failure, ru));
        setGenerationSource(null);
      }
    } finally {
      if (activeRequest.current === request) activeRequest.current = null;
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

  const toolbar = <StructuredBlockActions phase={activity.phase} label={generating
    ? (ru ? "Создаём диаграмму" : "Generating diagram")
    : (ru ? "Готовим предпросмотр" : "Preparing preview")}>
    <StructuredAction label={copyLabel} disabled={!code} inactive={Boolean(activity.phase)} onPress={() => void copy()}><Copy size={14} aria-hidden="true" /></StructuredAction>
    <StructuredAction label={previewLabel} disabled={!isSource} inactive={Boolean(activity.phase)} pressed={preview}
      onPress={() => { setShowSource(preview); setEditingSource(false); }}>{preview ? <Braces size={14} aria-hidden="true" /> : <PreviewIcon size={14} aria-hidden="true" />}</StructuredAction>
    <StructuredAction label={expandLabel} disabled={!code} inactive={Boolean(activity.phase)} onPress={() => setExpanded(true)}><Maximize2 size={14} aria-hidden="true" /></StructuredAction>
  </StructuredBlockActions>;
  return <div className={styles.block} data-structured-block={kind} data-editor-dialog contentEditable={false}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setEditingSource(false); }}>
    {!readOnly && <StructuredBlockMenu ru={ru} onCopy={() => void copy()} onRemove={remove} onSelect={() => {
      cancelGeneration();
      setShowSource(true);
      requestAnimationFrame(() => { input.current?.focus(); input.current?.select(); });
    }} />}
    <div ref={surface} tabIndex={-1} className={styles.surface} data-kind={kind}
      data-preview={preview && !keepPrompt || undefined} data-diagram-canvas={hasDiagram || undefined}>
      {toolbar}
      {showPreview && <div className={styles.previewReveal}>
        <ProductDocStructuredPreview kind={kind} source={code} result={rendered} />
      </div>}
      {(!preview || keepPrompt) &&
        <div className={styles.fieldShell} data-input-shell><Textarea ref={input} aria-label={title} placeholder={placeholder}
          value={keepPrompt ? generationSource : code}
          minRows={diagram ? 3 : 1} maxRows={14} maxLength={diagram ? maximumDiagramSource : maximumFormulaSource}
          spellCheck="false" isReadOnly={readOnly} isDisabled={generating || keepPrompt}
          classNames={{ base: styles.field, inputWrapper: styles.inputWrapper, input: styles.input }}
          onValueChange={change} onKeyDown={(event) => event.stopPropagation()}
          onPaste={pasteSource}
          onFocus={() => { setEditingSource(true); parentEditor.update(() => $setSelection(null)); }} /></div>}
      {(diagram && !isSource && !readOnly || keepPrompt) && <div className={styles.footer}>
        <ErrorToast message={activity.reveal && error ? error : null} />
        {(mayGenerate || keepPrompt) && <Button ref={generateButton} type="button" size="sm" variant="light" radius="full" disableRipple className={styles.generate}
          aria-disabled={generating || keepPrompt || undefined} onPress={() => void generate()}
          startContent={<Send size={13} aria-hidden="true" />}>{ru ? "Сгенерировать" : "Generate"}</Button>}
      </div>}
    </div>
    <ProductDocStructuredDialog isOpen={expanded} onClose={() => setExpanded(false)} title={title}
      closeLabel={closeLabel} kind={kind} source={code} result={rendered} showSource={!isSource} />
  </div>;
}
