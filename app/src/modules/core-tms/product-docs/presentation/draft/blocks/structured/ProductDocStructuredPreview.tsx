"use client";

import { Spinner } from "@heroui/react";
import { useEffect, useId, useState } from "react";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { canRenderDiagram, maximumFormulaSource } from "../../../../domain/structured/structuredMarkdown";
import styles from "./product-doc-structured.module.css";

type Kind = "diagram" | "math";

let mermaidModule: Promise<typeof import("mermaid").default> | undefined;

function loadMermaid() {
  return mermaidModule ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      securityLevel: "strict", startOnLoad: false, htmlLabels: false,
      theme: "neutral", maxTextSize: 16_000, maxEdges: 300, suppressErrorRendering: true,
    });
    return mermaid;
  });
}

type RenderResult = { source: string; output: string; error?: never } | { source: string; error: true };

export function ProductDocStructuredPreview({ kind, source }: { kind: Kind; source: string }) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [result, setResult] = useState<RenderResult>();

  useEffect(() => {
    if (!source.trim()) return;
    let disposed = false;
    let objectUrl: string | undefined;
    async function render() {
      try {
        if (kind === "math") {
          if (source.length > maximumFormulaSource) throw new Error("Invalid LaTeX source");
          const { default: katex } = await import("katex");
          if (!disposed) setResult({ source, output: katex.renderToString(source, {
            displayMode: true, trust: false, strict: "error", throwOnError: true,
            output: "mathml", maxExpand: 500, maxSize: 12,
          }) });
          return;
        }
        if (!canRenderDiagram(source)) throw new Error("Invalid Mermaid source");
        const mermaid = await loadMermaid();
        if (disposed) return;
        const { svg } = await mermaid.render("falcon-diagram-" + id, source);
        if (disposed) return;
        // SVG loaded as an image uses the browser's non-interactive image security model.
        objectUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
        setResult({ source, output: objectUrl });
      } catch {
        if (!disposed) setResult({ source, error: true });
      }
    }
    void render();
    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, kind, source]);

  const label = kind === "diagram" ? (ru ? "Диаграмма Mermaid" : "Mermaid diagram") : (ru ? "Формула LaTeX" : "LaTeX formula");
  const error = kind === "diagram"
    ? (ru ? "Проверьте синтаксис Mermaid." : "Check the Mermaid syntax.")
    : (ru ? "Проверьте синтаксис LaTeX." : "Check the LaTeX syntax.");
  if (!source.trim()) return null;
  if (result?.source !== source) return <Spinner size="sm" variant="simple" label={ru ? "Загрузка предпросмотра" : "Loading preview"} />;
  if (result.error) return <div className={styles.invalid} role="status"><p>{error}</p><pre>{source}</pre></div>;
  return kind === "diagram"
    ? <div className={styles.diagramImage}>
      {/* SVG is rendered into an isolated, non-interactive image URL. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={result.output} alt={label} />
    </div>
    : <div className={styles.formula} aria-label={label} dangerouslySetInnerHTML={{ __html: result.output }} />;
}
