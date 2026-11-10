"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { CircleDot, Database, GitFork, Layers2, ListTodo } from "lucide-react";
import type { FlowchartModel } from "../model/flowchart-model";
import styles from "../product-doc-flowchart.module.css";

type CardData = Pick<FlowchartModel["nodes"][number], "label" | "detail" | "kind" | "tone" | "metrics">;
type CardNode = Node<CardData, "falcon-card">;
type GroupNode = Node<{ label: string }, "falcon-group">;
export type FlowNode = CardNode | GroupNode;

const icons = { step: ListTodo, decision: GitFork, terminal: CircleDot, storage: Database, subprocess: Layers2 };

function FlowCard({ data, sourcePosition = Position.Right, targetPosition = Position.Left }: NodeProps<CardNode>) {
  const Icon = icons[data.kind];
  return <div className={styles.card} data-tone={data.tone} data-kind={data.kind}>
    <Handle className={styles.handle} position={targetPosition} type="target" isConnectable={false} />
    <div className={styles.cardHeader}>
      <Icon className={styles.cardIcon} size={17} strokeWidth={1.65} aria-hidden="true" />
      <div className={styles.cardText}>
        <span className={styles.cardTitle}>{data.label}</span>
        {data.detail && <span className={styles.cardDetail}>{data.detail}</span>}
      </div>
    </div>
    {data.metrics && <dl className={styles.cardMetrics} style={{ gridTemplateColumns: `repeat(${data.metrics.length}, minmax(0, 1fr))` }}>
      {data.metrics.map(({ label, value }) => <div key={label}>
        <dt>{label}</dt><dd>{value}</dd>
      </div>)}
    </dl>}
    <Handle className={styles.handle} position={sourcePosition} type="source" isConnectable={false} />
  </div>;
}

function FlowGroup({ data }: NodeProps<GroupNode>) {
  return <div className={styles.group}>{data.label}</div>;
}

export const flowNodeTypes = { "falcon-card": FlowCard, "falcon-group": FlowGroup };
