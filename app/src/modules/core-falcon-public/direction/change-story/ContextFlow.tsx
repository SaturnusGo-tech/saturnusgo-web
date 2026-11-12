'use client';

import {
  Handle, Position, ReactFlow, getBezierPath, useReactFlow, useUpdateNodeInternals,
  type Edge, type EdgeProps, type Node, type NodeProps,
} from '@xyflow/react';
import { motion, useTransform, type MotionValue } from 'framer-motion';
import { ClipboardCheck, Globe2, MousePointer2, PanelTop } from 'lucide-react';
import { useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { StoryCopy } from './story-copy';
import '@xyflow/react/dist/style.css';
import styles from './context-flow.module.css';

type Tone = 'lavender' | 'amber' | 'teal';
type ContextNodeData = {
  kind: 'source' | 'branch' | 'review';
  title: string;
  detail: string;
  index: number;
  compact: boolean;
  appear: number;
  time: MotionValue<number>;
  staticView: boolean;
};
type ContextNode = Node<ContextNodeData, 'context-node'>;
type ContextEdge = Edge<{
  tone: Tone;
  index: number;
  compact: boolean;
  canvasWidth: number;
  start: number;
  time: MotionValue<number>;
  staticView: boolean;
}, 'context-edge'>;

const tones: Tone[] = ['lavender', 'amber', 'teal'];
const branchIcons = [PanelTop, MousePointer2, ClipboardCheck];
const viewport = { x: 0, y: 0, zoom: 1 };
const portFraction = (index: number, compact: boolean) => compact ? 0.65 - index * 0.15 : 0.26 + index * 0.24;

function Port({ type, index, compact }: { type: 'source' | 'target'; index: number; compact: boolean }) {
  const position = compact
    ? type === 'source' ? Position.Bottom : Position.Top
    : type === 'source' ? Position.Right : Position.Left;
  const offset = compact ? { left: `${portFraction(index, compact) * 100}%` } : { top: `${portFraction(index, compact) * 100}%` };
  return <Handle id={`${type}-${index}`} type={type} position={position} isConnectable={false}
    className={styles.port} data-tone={tones[index]} style={offset} />;
}

function ContextFlowNode({ id, data }: NodeProps<ContextNode>) {
  const updateNodeInternals = useUpdateNodeInternals();
  const revealDuration = data.kind === 'review' ? 250 : 350;
  const opacity = useTransform(data.time, [data.appear, data.appear + revealDuration], [0, 1]);
  const filter = useTransform(data.time, [data.appear, data.appear + revealDuration], ['blur(3px)', 'blur(0px)']);
  useLayoutEffect(() => updateNodeInternals(id), [data.compact, id, updateNodeInternals]);
  const Icon = branchIcons[data.index];

  return <motion.div className={styles.node} data-kind={data.kind} data-compact={data.compact}
    style={data.staticView ? undefined : { opacity, filter }}>
    {data.kind === 'source' && <>
      <Globe2 className={styles.sourceIcon} size={26} strokeWidth={1.65} aria-hidden="true" />
      <div className={styles.nodeText}><strong>{data.title}</strong><span>{data.detail}</span></div>
      {tones.map((tone, index) => <Port key={tone} type="source" index={index} compact={data.compact} />)}
    </>}
    {data.kind === 'branch' && <>
      <Handle id="in" type="target" position={Position.Left} isConnectable={false}
        className={styles.port} data-tone={tones[data.index]} />
      <Icon className={styles.branchIcon} size={18} strokeWidth={1.65} aria-hidden="true" />
      <div className={styles.nodeText}><strong>{data.title}</strong><span>{data.detail}</span></div>
      <Handle id="out" type="source" position={Position.Right} isConnectable={false}
        className={styles.port} data-tone={tones[data.index]} />
    </>}
    {data.kind === 'review' && <>
      {tones.map((tone, index) => <Port key={tone} type="target" index={index} compact={data.compact} />)}
      <div className={styles.reviewIdentity}>
        <span className={styles.codexMark} aria-hidden="true">
          <img className={styles.codexLight} src="/assets/integrations/codex/codex-light.png" width={22} height={22} alt="" />
          <img className={styles.codexDark} src="/assets/integrations/codex/codex-dark.png" width={22} height={22} alt="" />
        </span>
        <span className={styles.owner}>Codex</span>
      </div>
      <div className={styles.nodeText}><strong>{data.title}</strong><span>{data.detail}</span></div>
    </>}
  </motion.div>;
}

/** Keep the three relationships distinct around the stacked phone composition. */
function compactPath(props: EdgeProps<ContextEdge>): string {
  const { sourceX: sx, sourceY: sy, targetX: tx, targetY: ty, source, data } = props;
  const index = data?.index ?? 0;
  const radius = 9;
  if (source === 'landing') {
    const lane = 36 - index * 12;
    const cross = sy + 32 - index * 6;
    return `M${sx} ${sy} L${sx} ${cross - radius} Q${sx} ${cross} ${sx - radius} ${cross} L${lane + radius} ${cross} Q${lane} ${cross} ${lane} ${cross + radius} L${lane} ${ty - radius} Q${lane} ${ty} ${lane + radius} ${ty} L${tx} ${ty}`;
  }
  const lane = (data?.canvasWidth ?? 350) - 12 - index * 12;
  const cross = ty - 16 - index * 6;
  return `M${sx} ${sy} L${lane - radius} ${sy} Q${lane} ${sy} ${lane} ${sy + radius} L${lane} ${cross - radius} Q${lane} ${cross} ${lane - radius} ${cross} L${tx + radius} ${cross} Q${tx} ${cross} ${tx} ${cross + radius} L${tx} ${ty}`;
}

/**
 * Native handles sit on a known node box. Derive their centers in flow coordinates:
 * React Flow's cached DOM rects include the outer story camera's scale, which is
 * independent of its own viewport and otherwise leaves the lines short of ports.
 */
function logicalPort(node: ContextNode, type: 'source' | 'target', index: number) {
  const width = node.width ?? node.measured?.width ?? 0;
  const height = node.height ?? node.measured?.height ?? 0;
  const x = node.position.x;
  const y = node.position.y;
  if (node.data.kind === 'branch' || !node.data.compact) {
    const fraction = node.data.kind === 'branch' ? 0.5 : portFraction(index, false);
    return {
      x: type === 'source' ? x + width - 1 : x + 1,
      y: y + 1 + (height - 2) * fraction,
      position: type === 'source' ? Position.Right : Position.Left,
    };
  }
  return {
    x: x + 1 + (width - 2) * portFraction(index, true),
    y: type === 'source' ? y + height - 1 : y + 1,
    position: type === 'source' ? Position.Bottom : Position.Top,
  };
}

function ContextFlowEdge(props: EdgeProps<ContextEdge>) {
  const data = props.data!;
  const { getNode } = useReactFlow<ContextNode, ContextEdge>();
  const offset = useTransform(data.time, [data.start, data.start + 550], [1, 0]);
  const opacity = useTransform(data.time, [data.start, data.start + 60], [0, 1]);
  const sourceNode = getNode(props.source);
  const targetNode = getNode(props.target);
  const source = sourceNode && logicalPort(sourceNode, 'source', data.index);
  const target = targetNode && logicalPort(targetNode, 'target', data.index);
  const geometry = source && target ? {
    ...props, sourceX: source.x, sourceY: source.y, sourcePosition: source.position,
    targetX: target.x, targetY: target.y, targetPosition: target.position,
  } : props;
  const path = data.compact ? compactPath(geometry) : getBezierPath({ ...geometry, curvature: 0.42 })[0];
  return <motion.path className={styles.edge} data-tone={data.tone} d={path} fill="none" pathLength={1}
    strokeDasharray="1 1" strokeDashoffset={data.staticView ? 0 : offset}
    style={{ opacity: data.staticView ? 1 : opacity }} />;
}

const nodeTypes = { 'context-node': ContextFlowNode };
const edgeTypes = { 'context-edge': ContextFlowEdge };

export function ContextFlow({ c, time, staticView }: {
  c: StoryCopy;
  time: MotionValue<number>;
  staticView: boolean;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const compact = width < 880;

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const measure = () => {
      if (canvas.clientWidth) setWidth(canvas.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const nodes = useMemo((): ContextNode[] => {
    const sourceWidth = compact ? Math.min(width - 56, Math.max(216, (width - 80) * 0.8), 292) : 179;
    const branchWidth = compact ? Math.min(width - 80, Math.max(190, (width - 112) * 0.8), 253) : 214;
    const reviewWidth = compact ? sourceWidth : 190;
    const gap = (width - sourceWidth - branchWidth - reviewWidth - 48) / 2;
    const geometry = compact
      ? [
        { x: (width - sourceWidth) / 2, y: 14, width: sourceWidth, height: 64 },
        ...c.branches.map((_, index) => ({ x: (width - branchWidth) / 2, y: 110 + index * 80, width: branchWidth, height: 68 })),
        { x: (width - reviewWidth) / 2, y: 378, width: reviewWidth, height: 84 },
      ]
      : [
        { x: 24, y: 185, width: sourceWidth, height: 80 },
        ...c.branches.map((_, index) => ({ x: 24 + sourceWidth + gap, y: 48 + index * 143, width: branchWidth, height: 69 })),
        { x: width - reviewWidth - 24, y: 178.5, width: reviewWidth, height: 93 },
      ];
    const content: Pick<ContextNodeData, 'kind' | 'title' | 'detail' | 'index' | 'appear'>[] = [
      { kind: 'source', title: c.source, detail: c.sourceNote, index: 0, appear: 3400 },
      ...c.branches.map((title, index) => ({ kind: 'branch' as const, title, detail: c.branchNotes[index], index, appear: 4000 + index * 400 })),
      { kind: 'review', title: c.review, detail: c.reviewNote, index: 0, appear: 5900 },
    ];
    return content.map((data, index) => {
      const { x, y, width: nodeWidth, height } = geometry[index];
      return {
        id: index === 0 ? 'landing' : index === 4 ? 'review' : `branch-${index - 1}`,
        type: 'context-node', position: { x, y }, width: nodeWidth, height,
        style: { width: nodeWidth, height } as CSSProperties,
        data: { ...data, compact, time, staticView },
        draggable: false, selectable: false, focusable: false, zIndex: 2,
      };
    });
  }, [c, compact, staticView, time, width]);

  const edges = useMemo((): ContextEdge[] => tones.flatMap((tone, index) => {
    const data = { tone, index, compact, canvasWidth: width, time, staticView };
    return [
      { id: `context-${index}`, type: 'context-edge', source: 'landing', target: `branch-${index}`, sourceHandle: `source-${index}`, targetHandle: 'in', data: { ...data, start: 4450 + index * 400 }, focusable: false },
      { id: `review-${index}`, type: 'context-edge', source: `branch-${index}`, target: 'review', sourceHandle: 'out', targetHandle: `target-${index}`, data: { ...data, start: 6200 + index * 100 }, focusable: false },
    ];
  }), [compact, staticView, time, width]);

  return <div ref={canvasRef} className={styles.canvas} data-compact={compact}
    role="img" aria-label={`${c.source}: ${c.branches.join(', ')}. Codex: ${c.review}.`}>
    <ReactFlow<ContextNode, ContextEdge> id={`context-${id}`} nodes={nodes} edges={edges}
      nodeTypes={nodeTypes} edgeTypes={edgeTypes} defaultViewport={viewport}
      minZoom={1} maxZoom={1} nodesDraggable={false} nodesConnectable={false}
      nodesFocusable={false} edgesFocusable={false} elementsSelectable={false}
      panOnDrag={false} panOnScroll={false} zoomOnScroll={false} zoomOnPinch={false}
      zoomOnDoubleClick={false} preventScrolling={false} selectionOnDrag={false}
      deleteKeyCode={null} disableKeyboardA11y />
  </div>;
}
