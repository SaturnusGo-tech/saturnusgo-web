"use client";

import { Textarea } from "@heroui/react";
import { readOnly$, useCellValue, useCodeBlockEditorContext, type CodeBlockEditorProps } from "@mdxeditor/editor";
import { $setSelection } from "lexical";
import { Braces, ChartScatter } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTmsLocale } from "../../../../../../localization/context/useTmsLocale";
import { StructuredAction } from "../controls/StructuredAction";
import { StructuredBlockActions } from "../controls/StructuredBlockActions";
import fieldStyles from "../product-doc-structured.module.css";
import { ProductDocChart } from "./ProductDocChart";
import { maximumChartSource } from "./model/product-doc-chart";
import styles from "./product-doc-chart.module.css";

export function ProductDocChartEditor({ code, focusEmitter }: CodeBlockEditorProps) {
  const ru = useTmsLocale().locale === "ru";
  const { parentEditor, setCode } = useCodeBlockEditorContext();
  const readOnly = useCellValue(readOnly$);
  const input = useRef<HTMLTextAreaElement>(null);
  const focusSource = useRef(false);
  const [showSource, setShowSource] = useState(!code.trim());
  const sourceLabel = ru ? "Данные графика (JSON)" : "Chart data (JSON)";
  const toggleLabel = showSource ? (ru ? "Предпросмотр" : "Preview") : (ru ? "Данные графика" : "Chart data");
  const ToggleIcon = showSource ? ChartScatter : Braces;

  useEffect(() => {
    focusEmitter.subscribe(() => {
      if (input.current) input.current.focus({ preventScroll: true });
      else {
        focusSource.current = true;
        setShowSource(true);
      }
    });
    return () => focusEmitter.subscribe(() => undefined);
  }, [focusEmitter]);
  useEffect(() => {
    if (!showSource || !focusSource.current) return;
    focusSource.current = false;
    input.current?.focus({ preventScroll: true });
  }, [showSource]);

  return <div className={`${fieldStyles.block} ${styles.editor}`} contentEditable={false} data-editor-dialog data-structured-block="chart">
    <StructuredBlockActions phase={undefined} label={sourceLabel}>
      <StructuredAction label={toggleLabel} pressed={showSource} onPress={() => setShowSource(!showSource)}>
        <ToggleIcon size={14} aria-hidden="true" />
      </StructuredAction>
    </StructuredBlockActions>
    {showSource ? <div className={fieldStyles.surface}>
      <div className={fieldStyles.fieldShell}>
        <Textarea ref={input} aria-label={sourceLabel} value={code} isReadOnly={readOnly}
          maxLength={maximumChartSource} minRows={5} maxRows={14} spellCheck="false"
          classNames={{ base: fieldStyles.field, inputWrapper: fieldStyles.inputWrapper, input: fieldStyles.input }}
          onValueChange={setCode} onKeyDown={event => event.stopPropagation()}
          onFocus={() => parentEditor.update(() => $setSelection(null))} />
      </div>
    </div> : <ProductDocChart source={code} openInNewTab />}
  </div>;
}
