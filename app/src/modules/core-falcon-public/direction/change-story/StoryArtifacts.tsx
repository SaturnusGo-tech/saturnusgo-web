'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import {
  BookOpen, CircleDashed, CircleHelp, Folder, Globe2, House, Link2,
  PanelTop, Send, Server, Square, UsersRound,
} from 'lucide-react';
import { PriorityIcon } from '../../../core-tms/presentation/common/properties/PriorityIcon';
import type { StoryCopy } from './story-copy';
import shared from './change-story.module.css';
import styles from './story-artifacts.module.css';

type ArtifactProps = { c: StoryCopy; time: MotionValue<number>; staticView: boolean };

function CodexMark({ size = 22 }: { size?: number }) {
  return <span className={styles.codexMark} style={{ width: size, height: size }} aria-hidden="true">
    <img className={styles.codexDark} src="/assets/integrations/codex/codex-dark.png" width={size} height={size} alt="" />
    <img className={styles.codexLight} src="/assets/integrations/codex/codex-light.png" width={size} height={size} alt="" />
  </span>;
}

export function CasesArtifact({ c, time, staticView }: ArtifactProps) {
  return <div className={`${shared.casesArtifact} ${styles.cases}`}>
    <div className={shared.caseListing}>
      <div className={shared.sceneLabel}><CodexMark /><span>Codex</span><span>→</span><Folder size={17} /><span>{c.scope}</span></div>
      <div className={shared.repositoryHeading}><h3>{c.casesTitle}</h3><span>6</span><small><CircleDashed size={12} />{c.draft}</small></div>
      <div className={shared.caseRows}>{c.cases.map((title, index) => <CaseRow
        key={title} title={c.shortCases[index] ?? title} index={index} time={time} staticView={staticView}
      />)}</div>
    </div>
    <div className={shared.caseExample}>
      <div className={shared.exampleMeta}><CircleDashed size={14} /><span>{c.draftOne}</span><span>UMB-WEB-01</span></div>
      <h4>{c.cases[0]}</h4>
      <div className={shared.scenario}>{[[c.given, c.givenText], [c.when, c.whenText], [c.then, c.thenText]].map(([label, text]) =>
        <div key={label}><strong>{label}</strong><span>{text}</span></div>,
      )}</div>
      <div className={shared.caseDocLink}><BookOpen size={16} />{c.guideTitle}<Link2 size={13} /></div>
    </div>
  </div>;
}

function CaseRow({ title, index, time, staticView }: {
  title: string; index: number; time: MotionValue<number>; staticView: boolean;
}) {
  const start = 9700 + index * 220;
  const opacity = useTransform(time, [start, start + 700], [0, 1]);
  const x = useTransform(time, [start, start + 700], [14, 0]);
  return <motion.div className={shared.caseRow} data-selected={index === 0} style={staticView ? undefined : { opacity, x }}>
    <PriorityIcon level={index < 3 ? 'high' : 'medium'} />
    <span>{title}</span><small>UMB-WEB-0{index + 1}</small>
  </motion.div>;
}

type Tone = 'violet' | 'amber' | 'teal';
type Point = readonly [number, number];
type DiagramNode = { x: number; y: number; width: number; height: number; appear: number };
type DiagramEdge = { source: number; target: number; from: Point; to: Point; path: string; tone: Tone; appear: number };

const icons = [Globe2, PanelTop, House, UsersRound, CircleHelp, Send, Server];
const desktopNodes: DiagramNode[] = [
  { x: 8, y: 116, width: 132, height: 64, appear: 16000 },
  { x: 196, y: 116, width: 150, height: 64, appear: 16400 },
  { x: 398, y: 4, width: 146, height: 56, appear: 16900 },
  { x: 398, y: 78, width: 146, height: 56, appear: 17300 },
  { x: 398, y: 152, width: 146, height: 56, appear: 17700 },
  { x: 398, y: 226, width: 146, height: 56, appear: 18100 },
  { x: 600, y: 226, width: 176, height: 56, appear: 19000 },
];
const desktopEdges: DiagramEdge[] = [
  { source: 0, target: 1, from: [140, 148], to: [196, 148], path: 'M140 148H196', tone: 'violet', appear: 16400 },
  { source: 1, target: 2, from: [346, 128], to: [398, 32], path: 'M346 128C373 128 371 32 398 32', tone: 'violet', appear: 17000 },
  { source: 1, target: 3, from: [346, 142], to: [398, 106], path: 'M346 142C373 142 371 106 398 106', tone: 'amber', appear: 17450 },
  { source: 1, target: 4, from: [346, 156], to: [398, 180], path: 'M346 156C373 156 371 180 398 180', tone: 'teal', appear: 17900 },
  { source: 1, target: 5, from: [346, 170], to: [398, 254], path: 'M346 170C373 170 371 254 398 254', tone: 'amber', appear: 18350 },
  { source: 5, target: 6, from: [544, 254], to: [600, 254], path: 'M544 254H600', tone: 'amber', appear: 18950 },
];
const mobileNodes: DiagramNode[] = [
  { x: 96, y: 4, width: 160, height: 44, appear: 16000 },
  { x: 96, y: 72, width: 160, height: 44, appear: 16400 },
  { x: 16, y: 146, width: 140, height: 44, appear: 16900 },
  { x: 196, y: 146, width: 140, height: 44, appear: 17300 },
  { x: 16, y: 216, width: 140, height: 44, appear: 17700 },
  { x: 196, y: 216, width: 140, height: 44, appear: 18100 },
  { x: 196, y: 286, width: 140, height: 44, appear: 19000 },
];
const mobileEdges: DiagramEdge[] = [
  { source: 0, target: 1, from: [176, 48], to: [176, 72], path: 'M176 48V72', tone: 'violet', appear: 16400 },
  { source: 1, target: 2, from: [136, 116], to: [86, 146], path: 'M136 116C136 135 86 127 86 146', tone: 'violet', appear: 17000 },
  { source: 1, target: 3, from: [216, 116], to: [266, 146], path: 'M216 116C216 135 266 127 266 146', tone: 'amber', appear: 17450 },
  { source: 1, target: 4, from: [96, 94], to: [16, 238], path: 'M96 94H28Q8 94 8 114V222Q8 238 16 238', tone: 'teal', appear: 17900 },
  { source: 1, target: 5, from: [256, 94], to: [336, 238], path: 'M256 94H324Q344 94 344 114V222Q344 238 336 238', tone: 'amber', appear: 18350 },
  { source: 5, target: 6, from: [266, 260], to: [266, 286], path: 'M266 260V286', tone: 'amber', appear: 18950 },
];

function SiteEdge({ edge, time, staticView }: { edge: DiagramEdge; time: MotionValue<number>; staticView: boolean }) {
  const offset = useTransform(time, [edge.appear, edge.appear + 650], [1, 0]);
  const opacity = useTransform(time, [edge.appear, edge.appear + 100], [0, 1]);
  return <motion.path className={styles.edge} data-tone={edge.tone} d={edge.path} fill="none"
    pathLength={1} strokeDasharray="1 1" strokeDashoffset={staticView ? 0 : offset}
    style={{ opacity: staticView ? 1 : opacity }} />;
}

function SiteNode({ node, index, edges, label, time, staticView, compact }: {
  node: DiagramNode; index: number; edges: DiagramEdge[]; label: string;
  time: MotionValue<number>; staticView: boolean; compact: boolean;
}) {
  const opacity = useTransform(time, [node.appear, node.appear + 500], [0, 1]);
  const filter = useTransform(time, [node.appear, node.appear + 500], ['blur(3px)', 'blur(0px)']);
  const Icon = icons[index];
  const iconSize = compact ? 16 : 18;
  const ports = edges.flatMap(edge => edge.source === index ? [{ point: edge.from, tone: edge.tone }] : edge.target === index ? [{ point: edge.to, tone: edge.tone }] : []);
  return <motion.g className={styles.node} transform={`translate(${node.x} ${node.y})`}
    style={staticView ? undefined : { opacity, filter }}>
    <rect className={styles.nodeBody} width={node.width} height={node.height} rx={24} />
    <Icon className={styles.nodeIcon} x={compact ? 14 : 16} y={(node.height - iconSize) / 2} width={iconSize} height={iconSize} strokeWidth={1.65} />
    <text x={compact ? 37 : 43} y={node.height / 2} dy=".35em">{label}</text>
    {ports.map(({ point, tone }, portIndex) => <circle key={portIndex} className={styles.port} data-tone={tone}
      cx={point[0] - node.x} cy={point[1] - node.y} r={compact ? 3.5 : 4} />)}
  </motion.g>;
}

/** Nodes, ports and connections use the same SVG coordinates at every camera scale. */
function SiteDiagram({ c, time, staticView, compact }: ArtifactProps & { compact: boolean }) {
  const nodes = compact ? mobileNodes : desktopNodes;
  const edges = compact ? mobileEdges : desktopEdges;
  return <svg className={compact ? styles.mobileDiagram : styles.desktopDiagram}
    viewBox={compact ? '0 0 352 342' : '0 0 790 300'} preserveAspectRatio="xMinYMid meet" aria-hidden="true">
    {edges.map((edge, index) => <SiteEdge key={index} edge={edge} time={time} staticView={staticView} />)}
    {nodes.map((node, index) => <SiteNode key={index} node={node} index={index} edges={edges}
      label={c.diagram[index] ?? ''} time={time} staticView={staticView} compact={compact} />)}
  </svg>;
}

export function GuideArtifact({ c, time, staticView }: ArtifactProps) {
  const titleOpacity = useTransform(time, [15300, 16400], [0, 1]);
  const titleBlur = useTransform(time, [15300, 16400], ['blur(6px)', 'blur(0px)']);
  const checklistOpacity = useTransform(time, [20000, 21200], [0, 1]);
  return <div className={`${shared.guideArtifact} ${styles.guide}`}>
    <article className={shared.guideArticle}>
      <div className={shared.sceneLabel}><BookOpen size={17} /><span>{c.guide}</span><span>→</span><span>Umbrella</span></div>
      <motion.div style={staticView ? undefined : { opacity: titleOpacity, filter: titleBlur }}>
        <h3>{c.guideTitle}</h3><p className={shared.guideLead}>{c.guideLead}</p>
        <div className={shared.linkedCases}><Link2 size={14} />{c.linked}</div>
      </motion.div>
      <div className={styles.diagramSection}>
        <h4>{c.diagramTitle}</h4>
        <div className={styles.diagram} role="img" aria-label={`${c.diagramTitle}: ${c.diagram.join(', ')}`}>
          <SiteDiagram c={c} time={time} staticView={staticView} compact={false} />
          <SiteDiagram c={c} time={time} staticView={staticView} compact />
        </div>
      </div>
      <motion.div className={styles.checklistSection} style={staticView ? undefined : { opacity: checklistOpacity }}>
        <h4>{c.checklistTitle}</h4>
        <ul className={shared.checklist}>{c.checklist.map(label => <li key={label}><Square size={15} />{label}</li>)}</ul>
      </motion.div>
    </article>
    <aside className={`${shared.guideProperties} ${styles.properties}`}>
      <h4>{c.properties}</h4>
      <div><CircleDashed size={16} />{c.draftOne}</div>
      <div><PriorityIcon level="high" />{c.priority}</div>
      <div><CodexMark size={19} />Codex</div>
      <h4>{c.labels}</h4><div className={shared.tags}><span>Web</span><span>{c.source}</span></div>
      <h4>{c.project}</h4><div><Folder size={16} />Umbrella</div>
    </aside>
  </div>;
}
