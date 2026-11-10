"use client";

import { useEffect, useId, useState } from "react";
import { canRenderDiagram, maximumFormulaSource } from "../../../../../domain/structured/structuredMarkdown";
import type { DiagramImage } from "../viewer/ProductDocDiagramViewer";
import type { FlowchartLayout } from "../flow/layout/flowchart-layout";
import { readMermaidFlowchart } from "../flow/mermaid/read-mermaid-flowchart";

type Kind = "diagram" | "math";
type Rendered = { diagram: DiagramImage } | { flowchart: FlowchartLayout } | { formula: string } | { invalid: true };

let mermaidModule: Promise<typeof import("mermaid").default> | undefined;
let mermaidWork = Promise.resolve();
let katexModule: Promise<typeof import("katex").default> | undefined;

function loadMermaid() {
  return mermaidModule ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      securityLevel: "strict", startOnLoad: false, htmlLabels: false,
      theme: "neutral", maxTextSize: 16_000, maxEdges: 300, suppressErrorRendering: true,
    });
    return mermaid;
  }).catch(error => {
    mermaidModule = undefined;
    throw error;
  });
}

function queueMermaid<Result>(work: () => Promise<Result>) {
  // Mermaid shares parser state across its diagram API and fallback renderer.
  const result = mermaidWork.then(work);
  mermaidWork = result.then(() => {}, () => {});
  return result;
}

function loadKatex() {
  return katexModule ??= import("katex").then(({ default: katex }) => katex).catch(error => {
    katexModule = undefined;
    throw error;
  });
}

function diagramImage(svg: string): DiagramImage {
  const root = new DOMParser().parseFromString(svg, "image/svg+xml").documentElement;
  const [, , width, height] = (root.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
  if (root.localName !== "svg" || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("Invalid diagram dimensions");
  }
  root.setAttribute("width", String(width));
  root.setAttribute("height", String(height));
  root.style.removeProperty("max-width");
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(root)], { type: "image/svg+xml" }));
  return { url, width, height };
}

export function useProductDocStructuredRender(kind: Kind, source: string, visible: boolean) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [requested, setRequested] = useState("");
  const renderSource = visible || requested === source ? source : "";
  const [result, setResult] = useState<{ kind: Kind; source: string; rendered: Rendered }>();

  useEffect(() => {
    // Warm the matching renderer while an author is writing the source or prompt.
    void (kind === "diagram" ? loadMermaid() : loadKatex()).catch(() => {});
  }, [kind]);

  useEffect(() => {
    if (visible) setRequested(source);
    else setRequested(previous => previous === source ? previous : "");
  }, [source, visible]);

  useEffect(() => {
    const source = renderSource;
    setResult(undefined);
    if (!source.trim()) return;
    let disposed = false;
    let image: DiagramImage | undefined;
    const show = (rendered: Rendered) => setResult({ kind, source, rendered });
    async function render() {
      try {
        if (kind === "math") {
          if (source.length > maximumFormulaSource) throw new Error("Invalid LaTeX source");
          const katex = await loadKatex();
          if (!disposed) show({ formula: katex.renderToString(source, {
            displayMode: true, trust: false, strict: "error", throwOnError: true,
            output: "mathml", maxExpand: 500, maxSize: 12,
          }) });
          return;
        }
        if (!canRenderDiagram(source)) throw new Error("Invalid Mermaid source");
        const mermaid = await loadMermaid();
        if (disposed) return;
        const flowchart = await queueMermaid(() => readMermaidFlowchart(mermaid, source)).catch(() => undefined);
        if (disposed) return;
        if (flowchart) {
          const layout = await import("../flow/layout/flowchart-layout")
            .then(({ layoutFlowchart }) => layoutFlowchart(flowchart)).catch(() => undefined);
          if (disposed) return;
          if (layout) {
            show({ flowchart: layout });
            return;
          }
        }
        const { svg } = await queueMermaid(() => mermaid.render("falcon-diagram-" + id, source));
        if (disposed) return;
        image = diagramImage(svg);
        show({ diagram: image });
      } catch {
        if (!disposed) show({ invalid: true });
      }
    }
    void render();
    return () => {
      disposed = true;
      if (image) URL.revokeObjectURL(image.url);
    };
  }, [id, kind, renderSource]);

  if (result?.source === source && result.kind === kind) return result.rendered;
}
