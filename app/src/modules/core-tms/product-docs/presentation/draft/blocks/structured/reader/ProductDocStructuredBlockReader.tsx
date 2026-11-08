"use client";

import { Braces, Maximize2, SquareFunction, Workflow } from "lucide-react";
import { useState } from "react";
import { useTmsLocale } from "../../../../../../localization/context/useTmsLocale";
import { StructuredAction } from "../controls/StructuredAction";
import { ProductDocStructuredPreview } from "../ProductDocStructuredPreview";
import { useProductDocStructuredRender } from "../render/useProductDocStructuredRender";
import { ProductDocStructuredDialog } from "../viewer/ProductDocStructuredDialog";
import styles from "../product-doc-structured.module.css";

export function ProductDocStructuredBlockReader({ kind, source }: { kind: "diagram" | "math"; source: string }) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const [expanded, setExpanded] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const label = kind === "diagram" ? (ru ? "Диаграмма Mermaid" : "Mermaid diagram") : (ru ? "Формула LaTeX" : "LaTeX formula");
  const rendered = useProductDocStructuredRender(kind, source, true);
  const ViewIcon = !showSource ? Braces : kind === "diagram" ? Workflow : SquareFunction;
  const viewLabel = showSource ? (ru ? "Предпросмотр" : "Preview") : (ru ? "Показать исходник" : "Show source");
  if (!source.trim()) return null;
  return <div className={styles.surface} data-kind={kind} data-preview data-structured-block={kind}>
    <div className={styles.controls}>
      <StructuredAction label={viewLabel} pressed={!showSource} onPress={() => setShowSource(!showSource)}>
        <ViewIcon size={14} aria-hidden="true" />
      </StructuredAction>
      <StructuredAction label={ru ? "Развернуть" : "Expand"} onPress={() => setExpanded(true)}>
        <Maximize2 size={14} aria-hidden="true" />
      </StructuredAction>
    </div>
    {showSource ? <pre className={styles.readSource}>{source}</pre> :
      <ProductDocStructuredPreview kind={kind} source={source} result={rendered} />}
    <ProductDocStructuredDialog isOpen={expanded} onClose={() => setExpanded(false)} title={label}
      closeLabel={ru ? "Закрыть предпросмотр" : "Close preview"} kind={kind} source={source} result={rendered} />
  </div>;
}
