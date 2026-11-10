"use client";

import { Braces, Maximize2, SquareFunction, Workflow } from "lucide-react";
import { useState } from "react";
import { useTmsLocale } from "../../../../../../localization/context/useTmsLocale";
import { StructuredAction } from "../controls/StructuredAction";
import { StructuredBlockActions } from "../controls/StructuredBlockActions";
import { useStructuredBlockActivity } from "../motion/useStructuredBlockActivity";
import { useStructuredBlockFootprint } from "../motion/useStructuredBlockFootprint";
import { ProductDocStructuredPreview } from "../ProductDocStructuredPreview";
import { useProductDocStructuredRender } from "../render/useProductDocStructuredRender";
import { ProductDocStructuredDialog } from "../viewer/ProductDocStructuredDialog";
import styles from "../product-doc-structured.module.css";

export function ProductDocStructuredBlockReader({ kind, source }: { kind: "diagram" | "math"; source: string }) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const [expanded, setExpanded] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const label = kind === "diagram" ? (ru ? "Диаграмма" : "Diagram") : (ru ? "Формула LaTeX" : "LaTeX formula");
  const rendered = useProductDocStructuredRender(kind, source, true);
  const preview = !showSource && Boolean(source.trim());
  const activity = useStructuredBlockActivity(preview && !rendered, preview);
  const surface = useStructuredBlockFootprint(!activity.reveal);
  const ViewIcon = !showSource ? Braces : kind === "diagram" ? Workflow : SquareFunction;
  const viewLabel = showSource ? (ru ? "Предпросмотр" : "Preview") : (ru ? "Показать исходник" : "Show source");
  if (!source.trim()) return null;
  return <div ref={surface} className={styles.surface} data-kind={kind} data-preview data-structured-block={kind}
    data-diagram-canvas={kind === "diagram" && preview && rendered && !("invalid" in rendered) || undefined}>
    <StructuredBlockActions phase={activity.phase} label={ru ? "Готовим предпросмотр" : "Preparing preview"}>
      <StructuredAction label={viewLabel} pressed={!showSource} inactive={Boolean(activity.phase)} onPress={() => setShowSource(!showSource)}>
        <ViewIcon size={14} aria-hidden="true" />
      </StructuredAction>
      <StructuredAction label={ru ? "Развернуть" : "Expand"} inactive={Boolean(activity.phase)} onPress={() => setExpanded(true)}>
        <Maximize2 size={14} aria-hidden="true" />
      </StructuredAction>
    </StructuredBlockActions>
    {showSource ? <pre className={styles.readSource}>{source}</pre> : activity.reveal &&
      <div className={styles.previewReveal}><ProductDocStructuredPreview kind={kind} source={source} result={rendered} /></div>}
    <ProductDocStructuredDialog isOpen={expanded} onClose={() => setExpanded(false)} title={label}
      closeLabel={ru ? "Закрыть предпросмотр" : "Close preview"} kind={kind} source={source} result={rendered} />
  </div>;
}
