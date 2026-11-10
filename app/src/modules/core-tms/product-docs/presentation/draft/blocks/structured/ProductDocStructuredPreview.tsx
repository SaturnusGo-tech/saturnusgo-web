"use client";

import dynamic from "next/dynamic";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import type { useProductDocStructuredRender } from "./render/useProductDocStructuredRender";
import { ProductDocDiagramViewer } from "./viewer/ProductDocDiagramViewer";
import styles from "./product-doc-structured.module.css";

const ProductDocFlowchart = dynamic(() => import("./flow/ProductDocFlowchart"), { ssr: false });

export function ProductDocStructuredPreview({ kind, source, result, expanded }: {
  kind: "diagram" | "math"; source: string; result: ReturnType<typeof useProductDocStructuredRender>; expanded?: boolean;
}) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const label = kind === "diagram" ? (ru ? "Диаграмма Mermaid" : "Mermaid diagram") : (ru ? "Формула LaTeX" : "LaTeX formula");
  if (!source.trim() || !result) return null;
  if ("invalid" in result) {
    const error = kind === "diagram"
      ? (ru ? "Проверьте синтаксис Mermaid." : "Check the Mermaid syntax.")
      : (ru ? "Проверьте синтаксис LaTeX." : "Check the LaTeX syntax.");
    return <div className={styles.invalid} role="status"><p>{error}</p><pre>{source}</pre></div>;
  }
  if ("flowchart" in result) return <ProductDocFlowchart key={source} layout={result.flowchart} ru={ru} expanded={expanded} />;
  if ("diagram" in result) return <ProductDocDiagramViewer key={result.diagram.url} image={result.diagram}
    label={label} ru={ru} expanded={expanded} />;
  return <div className={styles.formula} aria-label={label} dangerouslySetInnerHTML={{ __html: result.formula }} />;
}
