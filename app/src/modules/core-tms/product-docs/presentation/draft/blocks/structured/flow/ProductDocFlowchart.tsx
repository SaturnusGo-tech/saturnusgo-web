"use client";

import {
  Background, BackgroundVariant, BaseEdge, EdgeLabelRenderer, MarkerType, Panel,
  Position, ReactFlow, getBezierPath, useReactFlow, type Edge, type EdgeProps, type Viewport,
} from "@xyflow/react";
import { Button } from "@heroui/react";
import { Maximize, Minus, Plus } from "lucide-react";
import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { FlowchartEdgeRoute } from "./layout/flowchart-edge-route";
import type { FlowchartLayout } from "./layout/flowchart-layout";
import { flowNodeTypes, type FlowNode } from "./nodes/FlowchartNodes";
import type { FlowPreset, FlowTone } from "./model/flowchart-style";
import "@xyflow/react/dist/style.css";
import styles from "./product-doc-flowchart.module.css";

type FlowEdge = Edge<{ tone: FlowTone; preset?: FlowPreset; route?: FlowchartEdgeRoute }, "falcon-edge">;

const positions = {
  RIGHT: [Position.Right, Position.Left], LEFT: [Position.Left, Position.Right],
  DOWN: [Position.Bottom, Position.Top], UP: [Position.Top, Position.Bottom],
};
const minZoom = 0.05;
const maxZoom = 3;

function FlowConnection(props: EdgeProps<FlowEdge>) {
  const { id, data, label, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, markerStart, markerEnd } = props;
  const tone = data?.tone ?? "neutral";
  let [path, labelX, labelY] = getBezierPath(props);
  if (data?.route) {
    ({ path } = data.route);
    labelX = data.route.labelX ?? labelX;
    labelY = data.route.labelY ?? labelY;
  } else if (source === target) {
    const vertical = sourcePosition === Position.Top || sourcePosition === Position.Bottom;
    const spread = 48;
    if (vertical) {
      const outerX = sourceX + 154;
      const sign = sourcePosition === Position.Bottom ? 1 : -1;
      path = `M ${sourceX},${sourceY} C ${outerX},${sourceY + sign * spread} ${outerX},${targetY - sign * spread} ${targetX},${targetY}`;
      labelX = sourceX + 116;
      labelY = (sourceY + targetY) / 2;
    } else {
      const outerY = sourceY + 78;
      const sign = sourcePosition === Position.Right ? 1 : -1;
      path = `M ${sourceX},${sourceY} C ${sourceX + sign * spread},${outerY} ${targetX - sign * spread},${outerY} ${targetX},${targetY}`;
      labelX = (sourceX + targetX) / 2;
      labelY = sourceY + 58;
    }
  }
  const start = data?.route?.start ?? { x: sourceX, y: sourceY };
  const end = data?.route?.end ?? { x: targetX, y: targetY };
  return <>
    <BaseEdge id={id} path={path} markerStart={markerStart} markerEnd={markerEnd}
      className={`${styles.edge} ${styles[tone]}`} />
    {data?.preset === "pipeline" && <g className={`${styles.ports} ${styles[tone]}`} aria-hidden="true">
      <circle cx={start.x} cy={start.y} r={3.75} />
      <circle cx={end.x} cy={end.y} r={3.75} />
    </g>}
    {label && <EdgeLabelRenderer>
      <span className={styles.edgeLabel} data-tone={tone}
        style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}>{label}</span>
    </EdgeLabelRenderer>}
  </>;
}

const edgeTypes = { "falcon-edge": FlowConnection };
const neutralMarker = "var(--flow-neutral)";
const markers = (tone: FlowTone) => ({ type: MarkerType.ArrowClosed, color: tone === "neutral" ? neutralMarker : `var(--flow-${tone})`, width: 13, height: 13 });

function FlowchartControls({ zoom, ru }: { zoom: number; ru: boolean }) {
  const view = useReactFlow();
  const animation = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180;
  return <Panel position="bottom-right" className={styles.tools} role="group" aria-label={ru ? "Масштаб диаграммы" : "Diagram zoom"}>
    <Button className={styles.tool} size="sm" variant="light" isIconOnly disableRipple
      isDisabled={zoom <= minZoom} aria-label={ru ? "Уменьшить" : "Zoom out"}
      onPress={() => { void view.zoomOut({ duration: animation() }); }}><Minus size={15} aria-hidden="true" /></Button>
    <output className={styles.scale}>{Math.round(zoom * 100)}%</output>
    <Button className={styles.tool} size="sm" variant="light" isIconOnly disableRipple
      isDisabled={zoom >= maxZoom} aria-label={ru ? "Увеличить" : "Zoom in"}
      onPress={() => { void view.zoomIn({ duration: animation() }); }}><Plus size={15} aria-hidden="true" /></Button>
    <Button className={styles.tool} size="sm" variant="light" isIconOnly disableRipple
      aria-label={ru ? "Показать целиком" : "Fit diagram"}
      onPress={() => { void view.fitView({ duration: animation(), minZoom, maxZoom: 1, padding: 0.14 }); }}>
      <Maximize size={14} aria-hidden="true" />
    </Button>
  </Panel>;
}

function initialViewport(layout: FlowchartLayout, width: number, height: number, expanded?: boolean): Viewport {
  const margin = 20;
  const fit = Math.min(1, (width - margin * 2) / layout.bounds.width, (height - margin * 2) / layout.bounds.height);
  const zoom = Math.max(expanded ? minZoom : 0.8, fit);
  const x = (width - layout.bounds.width * zoom) / 2;
  const y = (height - layout.bounds.height * zoom) / 2;
  return {
    x: x > margin ? x : layout.direction === "LEFT" ? 2 * x - margin : margin,
    y: y > margin ? y : layout.direction === "UP" ? 2 * y - margin : margin,
    zoom,
  };
}

export default function ProductDocFlowchart({ layout, expanded, ru }: {
  layout: FlowchartLayout; expanded?: boolean; ru: boolean;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport>();
  const [zoom, setZoom] = useState(1);
  const [sourcePosition, targetPosition] = positions[layout.direction];
  const nodes = useMemo(() => layout.nodes.map((node): FlowNode => {
    const geometry = { id: node.id, position: { x: node.x, y: node.y }, width: node.width, height: node.height };
    if ("kind" in node) return { ...geometry, type: "falcon-card", data: node, sourcePosition, targetPosition, zIndex: 2 };
    return { ...geometry, type: "falcon-group", data: node, zIndex: 0, focusable: false, ariaRole: "group" };
  }), [layout.nodes, sourcePosition, targetPosition]);
  const edges = useMemo(() => layout.edges.map((edge): FlowEdge => ({
    id: edge.id, source: edge.from, target: edge.to, label: edge.label, type: "falcon-edge", data: { tone: edge.tone, preset: layout.preset, route: edge.route }, zIndex: 1,
    markerEnd: edge.arrow === "none" ? undefined : markers(edge.tone),
    markerStart: edge.arrow === "both" ? markers(edge.tone) : undefined,
  })), [layout.edges, layout.preset]);

  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const initialize = () => {
      if (!element.clientWidth || !element.clientHeight) return;
      const initial = initialViewport(layout, element.clientWidth, element.clientHeight, expanded);
      setViewport(current => current ?? initial);
      observer.disconnect();
    };
    const observer = new ResizeObserver(initialize);
    observer.observe(element);
    initialize();
    return () => observer.disconnect();
  }, [expanded, layout]);

  return <div ref={viewportRef} className={styles.canvas} data-preset={layout.preset} data-expanded={expanded || undefined}
    style={expanded ? undefined : { height: Math.max(240, Math.min(500, layout.bounds.height + 72)) }}
    role="region" aria-label={ru ? "Интерактивная диаграмма" : "Interactive diagram"}>
    {viewport && <ReactFlow<FlowNode, FlowEdge> id={id} nodes={nodes} edges={edges} nodeTypes={flowNodeTypes} edgeTypes={edgeTypes}
      minZoom={minZoom} maxZoom={maxZoom} defaultViewport={viewport} onInit={() => setZoom(viewport.zoom)}
      onMove={(_, view) => setZoom(view.zoom)}
      nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
      panOnDrag panOnScroll={Boolean(expanded)} preventScrolling={Boolean(expanded)}
      zoomOnScroll={false} zoomOnPinch zoomOnDoubleClick={false}
      selectionOnDrag={false} deleteKeyCode={null} onlyRenderVisibleElements>
      <Background id={`falcon-grid-${id}`} variant={BackgroundVariant.Dots} color="var(--flow-grid)" gap={16} size={1.25} />
      <FlowchartControls ru={ru} zoom={zoom} />
    </ReactFlow>}
  </div>;
}
