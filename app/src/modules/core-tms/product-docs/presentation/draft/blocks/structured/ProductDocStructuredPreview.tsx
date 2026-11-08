"use client";

import { Spinner } from "@heroui/react";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import type { useProductDocStructuredRender } from "./render/useProductDocStructuredRender";
import { ProductDocDiagramViewer } from "./viewer/ProductDocDiagramViewer";
import styles from "./product-doc-structured.module.css";

export function ProductDocStructuredPreview({ kind, source, result, expanded }: {
  kind: "diagram" | "math"; source: string; result: ReturnType<typeof useProductDocStructuredRender>; expanded?: boolean;
}) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const label = kind === "diagram" ? (ru ? "Диаграмма Mermaid" : "Mermaid diagram") : (ru ? "Формула LaTeX" : "LaTeX formula");
  if (!source.trim()) return null;
  if (!result) return <Spinner size="sm" variant="simple" label={ru ? "Загрузка предпросмотра" : "Loading preview"}
    classNames={{ base: styles.previewLoading, wrapper: styles.previewSpinner, circle1: styles.previewSpinnerTrack }} />;
  if ("invalid" in result) {
    const error = kind === "diagram"
      ? (ru ? "Проверьте синтаксис Mermaid." : "Check the Mermaid syntax.")
      : (ru ? "Проверьте синтаксис LaTeX." : "Check the LaTeX syntax.");
    return <div className={styles.invalid} role="status"><p>{error}</p><pre>{source}</pre></div>;
  }
  if ("diagram" in result) return <ProductDocDiagramViewer key={result.diagram.url} image={result.diagram}
    label={label} ru={ru} expanded={expanded} />;
  return <div className={styles.formula} aria-label={label} dangerouslySetInnerHTML={{ __html: result.formula }} />;
}
