'use client';

import { Handle, Position, ReactFlow, type Edge, type EdgeProps, type Node, type NodeProps } from '@xyflow/react';
import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'framer-motion';
import { ArrowUpRight, Check, CheckCheck, Circle, FileText, Globe2, Link2, ListChecks, MousePointer2, UserRound, ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { memo, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { LandingLocale } from '../../landing/localization/model/locale';
import type { StoryCopy } from './story-copy';
import '@xyflow/react/dist/style.css';
import styles from './browser-qa.module.css';

const copy = {
  en: { contact: 'Early access', email: 'Your email', consent: 'I agree to receive updates', send: 'Request access', confirmed: 'Request confirmed', checks: 'QA checks', check: 'Check', state: 'Status', rows: ['Navigation', 'Page sections', 'Required email', 'Email format', 'Consent', 'Form submission'], todo: 'To do', done: 'Done', report: 'Umbrella · Web QA', linked: '6 linked checks', evidence: 'Form confirmation', attached: 'Linked to the check', note: 'Marketing illustration · No test execution is implied.', accessible: 'Illustration: Codex checks navigation, fills an example form, and connects six checks to a QA report.' },
  ru: { contact: 'Ранний доступ', email: 'Ваша почта', consent: 'Согласие на уведомления', send: 'Оставить заявку', confirmed: 'Заявка подтверждена', checks: 'Проверки QA', check: 'Проверка', state: 'Статус', rows: ['Навигация', 'Разделы страницы', 'Обязательная почта', 'Формат почты', 'Согласие', 'Отправка заявки'], todo: 'В плане', done: 'Готово', report: 'Umbrella · Web QA', linked: '6 связанных проверок', evidence: 'Подтверждение формы', attached: 'Связано с проверкой', note: 'Иллюстрация процесса · Выполнение тестов не подразумевается.', accessible: 'Иллюстрация: Codex проверяет навигацию, заполняет пример формы и связывает шесть проверок с QA-отчётом.' },
};
const boxes = {
  browser: { x: 72, y: 136, width: 440, height: 340 },
  checks: { x: 620, y: 40, width: 330, height: 282 },
  report: { x: 650, y: 344, width: 302, height: 196 },
};
const viewport = { x: 0, y: 0, zoom: 1 };
const focusTimes = [22000, 22800, 23600, 31500, 32300, 33200, 34900, 35600, 36500, 39100, 40200, 44000];
const checkStops = [24000, 26000, 28200, 30500, 32400, 34600];
function focusAt(time: number, values: number[]) {
  const end = focusTimes.findIndex(stop => stop > time);
  if (end < 0) return values[values.length - 1];
  if (end === 0) return values[0];
  const progress = (time - focusTimes[end - 1]) / (focusTimes[end] - focusTimes[end - 1]);
  const eased = progress * progress * (3 - 2 * progress);
  return values[end - 1] + (values[end] - values[end - 1]) * eased;
}
type ArtifactKind = keyof typeof boxes;
type ArtifactData = { kind: ArtifactKind; c: StoryCopy; locale: LandingLocale; time: MotionValue<number>; staticView: boolean };
type ArtifactNode = Node<ArtifactData, 'webqa-artifact'>;
type WireEdge = Edge<{ path: string; tone: 'purple' | 'mint'; start: number; time: MotionValue<number>; staticView: boolean }, 'webqa-wire'>;
type ArtifactProps = Omit<ArtifactData, 'kind'>;

function Port({ id, type, position, tone = 'purple', top }: { id: string; type: 'source' | 'target'; position: Position; tone?: 'purple' | 'mint'; top?: string }) {
  return <Handle id={id} type={type} position={position} isConnectable={false} className={styles.port} data-tone={tone} style={top ? { top } : undefined}/>;
}

function IllustratedBrowser({ c, locale, time, staticView }: ArtifactProps) {
  const t = copy[locale];
  const opacity = useTransform(time, [22000, 22500], [0, 1]);
  const select = useTransform(time, [23300, 23600, 24200], ['#a993df00', '#a993df55', '#a993df18']);
  const scroll = useTransform(time, [24300, 25200, 25800, 27000], [0, -105, -105, -248]);
  const pageOpacity = useTransform(time, [33700, 34200], [1, 0]);
  const pageScale = useTransform(time, [33700, 34400], [1, .96]);
  const pageBlur = useTransform(time, [33700, 34200], ['blur(0px)', 'blur(5px)']);
  const consent = useTransform(time, [31900, 32200], [0, 1]);
  const submit = useTransform(time, [27500, 27700, 27900, 33400, 33600, 33800], [1, .96, 1, 1, .96, 1]);
  const invalid = useTransform(time, [27800, 28100, 28600, 28900, 29700, 30200, 30600], [0, 1, 0, 1, 1, 0, 0]);
  const entered = useTransform(time, [28600, 28800], [0, 1]);
  const suffix = useTransform(time, [29800, 30300], [0, 1]);
  const valid = useTransform(time, [30300, 30600], [0, 1]);
  const confirmed = useTransform(time, [33900, 34600], [0, 1]);
  const confirmedY = useTransform(time, [33900, 34600], [12, 0]);
  const confirmScale = useTransform(time, [33900, 34600], [.92, 1]);
  const confirmationRing = useTransform(time, [34000, 34700], [0, 1]);
  return <motion.div className={`${styles.artifact} ${styles.browser}`} style={{ opacity: staticView ? 1 : opacity }}>
    <Port id="navigation" type="source" position={Position.Right} top="20%"/>
    <Port id="form" type="source" position={Position.Right} top="74%" tone="mint"/>
    <div className={styles.browserChrome}><span><Globe2 size={15}/>{c.scope}</span><motion.span className={styles.contact} style={{ backgroundColor: staticView ? '#a993df18' : select }}>{t.contact}<ArrowUpRight size={12}/></motion.span></div>
    <div className={styles.browserViewport}>
      <motion.div className={styles.page} style={{ opacity: staticView ? 0 : pageOpacity, scale: staticView ? 1 : pageScale, filter: staticView ? undefined : pageBlur }}>
        <motion.div className={styles.pageScroll} style={{ y: staticView ? -248 : scroll }}>
          <img className={styles.hero} src="/assets/direction/web-qa/hero.webp" width={1280} height={720} alt="" draggable={false}/>
          <div className={styles.pageSections}>
            <div className={styles.sectionHeading}><span>{locale === 'ru' ? 'Всё для вашего дома' : 'A home, taken care of'}</span><ArrowRight size={14}/></div>
            <div className={styles.sectionTiles}>{[0, 1].map(index => <div key={index}><span className={styles.sectionArt} data-position={index}><i/><i/><i/></span><span className={styles.sectionLine}/><span className={styles.sectionLine}/></div>)}</div>
          </div>
          <div className={styles.formBody}>
            <div className={styles.formTitle}>{t.contact}</div>
            <div className={styles.emailField}><motion.i className={styles.fieldFeedback} data-tone="invalid" style={{ opacity: invalid }}/><motion.i className={styles.fieldFeedback} data-tone="valid" style={{ opacity: valid }}/><span className={styles.emailLabel}>{t.email}</span><motion.span className={styles.emailValue} style={{ opacity: entered }}>qa@<motion.span style={{ opacity: suffix }}>example.com</motion.span></motion.span></div>
            <div className={styles.consent}><span className={styles.checkbox}><motion.span style={{ opacity: consent }}><Check size={12}/></motion.span></span><span>{t.consent}</span></div>
            <motion.div className={styles.submit} style={{ scale: submit }}>{t.send}<ArrowUpRight size={14}/></motion.div>
          </div>
        </motion.div>
      </motion.div>
      <motion.div className={styles.confirmationPage} style={{ opacity: staticView ? 1 : confirmed, y: staticView ? 0 : confirmedY, scale: staticView ? 1 : confirmScale }}>
        <motion.span className={styles.confirmationSeal} style={{ scale: staticView ? 1 : confirmationRing }}><Check size={28} strokeWidth={1.8}/></motion.span>
        <strong>{t.confirmed}</strong>
        <span className={styles.receiptEmail}><Mail size={12}/>qa@example.com</span>
        <div className={styles.receiptLines}><i/><i/></div>
        <span className={styles.receiptLink}><ShieldCheck size={13}/>{locale === 'ru' ? 'Подтверждение сохранено' : 'Confirmation saved'}</span>
      </motion.div>
    </div>
  </motion.div>;
}
function CheckTable({ locale, time, staticView }: ArtifactProps) {
  const t = copy[locale];
  const opacity = useTransform(time, [22500, 23300], [0, 1]);
  return <motion.div className={`${styles.artifact} ${styles.checkTable}`} style={{ opacity: staticView ? 1 : opacity }}>
    <Port id="in" type="target" position={Position.Left}/><Port id="report" type="source" position={Position.Bottom}/>
    <div className={styles.tableTitle}><ListChecks size={18}/><strong>{t.checks}</strong><span>6</span></div>
    <div className={styles.tableColumns}><span>{t.check}</span><span>{t.state}</span></div>
    {t.rows.map((label, index) => <CheckRow key={label} label={label} index={index} time={time} staticView={staticView} locale={locale}/>)}
  </motion.div>;
}
function CheckRow({ label, index, time, staticView, locale }: { label: string; index: number; time: MotionValue<number>; staticView: boolean; locale: LandingLocale }) {
  const start = checkStops[index];
  const done = useTransform(time, [start, start + 220], [0, 1]);
  const active = useTransform(time, [start - 650, start - 480, start, start + 220], [0, 1, 1, 0]);
  const pending = useTransform(time, [start - 650, start - 480], [1, 0]);
  return <div className={styles.checkRow}><motion.i className={styles.activeRow} style={{ opacity: staticView ? 0 : active }}/><span>{label}</span><span className={styles.rowState}>
    <motion.span className={styles.pending} style={{ opacity: staticView ? 0 : pending }}><Circle size={11}/>{copy[locale].todo}</motion.span>
    <motion.span className={styles.checking} style={{ opacity: staticView ? 0 : active }}><motion.i style={{ scaleX: useTransform(time, [start - 650, start], [0, 1]) }}/></motion.span>
    <motion.span className={styles.passed} style={{ opacity: staticView ? 1 : done }}><Check size={12}/>{copy[locale].done}</motion.span>
  </span></div>;
}
function EvidenceReport({ locale, time, staticView }: ArtifactProps) {
  const t = copy[locale];
  const opacity = useTransform(time, [32200, 32600], [0, 1]);
  const paperScale = useTransform(time, [34800, 35700], [.265, 1]);
  const contentOpacity = useTransform(time, [35100, 35700], [0, 1]);
  const attachment = useTransform(time, [36300, 36800], [0, 1]);
  const linked = useTransform(time, [37600, 38100], [0, 1]);
  return <motion.div className={`${styles.artifact} ${styles.report}`} style={{ opacity: staticView ? 1 : opacity }}>
    <Port id="form" type="target" position={Position.Left} tone="mint"/><Port id="checks" type="target" position={Position.Top}/>
    <motion.div className={styles.reportPaper} style={{ scaleY: staticView ? 1 : paperScale }}/><div className={styles.reportContent}>
    <div className={styles.reportTitle}><FileText size={17}/><strong>{t.report}</strong></div>
    <motion.div style={{ opacity: staticView ? 1 : contentOpacity }}>
    <div className={styles.documentLines}>{[0, 1, 2].map(index => <WrittenLine key={index} index={index} time={time} staticView={staticView}/>)}</div>
    <motion.div className={styles.evidence} style={{ opacity: staticView ? 1 : attachment }}><span className={styles.evidenceThumbnail}><Check size={12}/><i/><i/></span><div><strong>{t.evidence}</strong><span>{t.attached}</span></div></motion.div>
    <motion.div className={styles.linked} style={{ opacity: staticView ? 1 : linked }}><Link2 size={12}/>{t.linked}</motion.div></motion.div></div>
  </motion.div>;
}
function WrittenLine({ index, time, staticView }: { index: number; time: MotionValue<number>; staticView: boolean }) {
  const scaleX = useTransform(time, [35400 + index * 250, 36000 + index * 250], [0, 1]);
  return <motion.i style={{ width: `${[98, 84, 63][index]}%`, scaleX: staticView ? 1 : scaleX }}/>;
}
function Artifact({ data }: NodeProps<ArtifactNode>) {
  if (data.kind === 'browser') return <IllustratedBrowser {...data}/>;
  if (data.kind === 'checks') return <CheckTable {...data}/>;
  return <EvidenceReport {...data}/>;
}
function Wire({ data }: EdgeProps<WireEdge>) {
  const offset = useTransform(data!.time, [data!.start, data!.start + 850], [1, 0]);
  const opacity = useTransform(data!.time, [data!.start, data!.start + 100], [0, 1]);
  return <motion.path className={styles.wire} data-tone={data!.tone} d={data!.path} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={data!.staticView ? 0 : offset} style={{ opacity: data!.staticView ? 1 : opacity }}/>;
}
const nodeTypes = { 'webqa-artifact': Artifact };
const edgeTypes = { 'webqa-wire': Wire };

function Pointer({ tone, label, time, staticView }: { tone: 'purple' | 'mint'; label: string; time: MotionValue<number>; staticView: boolean }) {
  const stops = [22800, 23500, 24200, 25300, 26700, 27600, 28600, 30000, 31900, 33500, 34700, 36500, 38600];
  const x = useTransform(time, stops, tone === 'purple' ? [536, 458, 400, 353, 284, 412, 263, 341, 95, 411, 432, 900, 900] : [908, 918, 902, 899, 897, 899, 896, 910, 896, 899, 896, 812, 812]);
  const y = useTransform(time, stops, tone === 'purple' ? [280, 154, 270, 297, 241, 306, 239, 239, 275, 307, 332, 555, 555] : [102, 110, 110, 143, 143, 176, 176, 209, 242, 275, 275, 555, 555]);
  const opacity = useTransform(time, [22600, 23000, 42600, 43400], [0, 1, 1, 0]);
  const tap = useTransform(time, value => {
    if (staticView) return 0;
    const tapAt = (tone === 'purple' ? [23500, 27600, 31900, 33500] : checkStops).find(stop => value >= stop && value < stop + 380);
    return tapAt === undefined ? 0 : Math.sin((value - tapAt) / 380 * Math.PI);
  });
  return <motion.div className={styles.pointer} data-tone={tone} style={{ x: staticView ? tone === 'purple' ? 900 : 812 : x, y: staticView ? tone === 'purple' ? 555 : 555 : y, opacity: staticView ? 1 : opacity }}>
    <motion.i className={styles.tap} style={{ opacity: tap, scale: useTransform(tap, [0, 1], [.5, 1.8]) }}/><MousePointer2 className={styles.pointerIcon} size={25} strokeWidth={1.6}/><span className={styles.pointerLabel}>{tone === 'purple' ? <img src="/assets/integrations/codex/codex-light.png" width={17} height={17} alt=""/> : <UserRound size={14}/>}<span>{label}</span></span>
  </motion.div>;
}

/** A marketing illustration, driven only by the shared presentation clock. */
export const BrowserQA = memo(function BrowserQA({ c, time, locale = 'en', staticView = false }: { c: StoryCopy; time: MotionValue<number>; locale?: LandingLocale; staticView?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1000);
  const [complete, setComplete] = useState(staticView || time.get() >= 38100);
  const completeRef = useRef(complete);
  useMotionValueEvent(time, 'change', value => {
    const next = staticView || value >= 38100;
    if (next !== completeRef.current) {
      completeRef.current = next;
      setComplete(next);
    }
  });
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth || 1000);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const scale = Math.min(1, width / 1000);
  const focusOnPhone = width < 760 && !staticView;
  const cameraScales = focusOnPhone
    ? [.78, .78, .78, .78, .52, .95, .95, .6, 1, 1, scale, scale]
    : [scale, scale, scale * 1.24, scale * 1.24, scale * .86, scale * 1.15, scale * 1.15, scale * .9, scale * 1.3, scale * 1.3, scale, scale];
  const cameraScale = useTransform(time, value => staticView ? scale : focusAt(value, cameraScales));
  const cameraX = useTransform(time, value => staticView ? 0 : width / 2 - focusAt(value, [focusOnPhone ? 292 : 500, focusOnPhone ? 292 : 500, 292, 292, 500, 785, 785, 700, 801, 801, 500, 500]) * cameraScale.get());
  const cameraY = useTransform(time, value => staticView ? 0 : (focusOnPhone ? 300 : 280 * scale) - focusAt(value, [focusOnPhone ? 306 : 280, focusOnPhone ? 306 : 280, 306, 306, 280, 181, 181, 300, 442, 442, 280, 280]) * cameraScale.get());
  const actionTime = useTransform(time, value => value <= 22000 ? value : 22000 + (value - 22000) * 1.25);
  const nodes = useMemo((): ArtifactNode[] => Object.entries(boxes).map(([kind, box]) => ({
    id: kind, type: 'webqa-artifact', position: { x: box.x, y: box.y }, width: box.width, height: box.height,
    style: { width: box.width, height: box.height }, data: { kind: kind as ArtifactKind, c, locale, time: kind === 'report' ? time : actionTime, staticView },
    draggable: false, selectable: false, focusable: false, zIndex: 2,
  })), [actionTime, c, locale, staticView, time]);
  const edges = useMemo((): WireEdge[] => [
    { id: 'navigation-check', source: 'browser', target: 'checks', sourceHandle: 'navigation', targetHandle: 'in', type: 'webqa-wire', data: { path: 'M511 204.6 C558 204.6 562 181 621 181', tone: 'purple', start: 23900, time: actionTime, staticView } },
    { id: 'form-evidence', source: 'browser', target: 'report', sourceHandle: 'form', targetHandle: 'form', type: 'webqa-wire', data: { path: 'M511 387.12 C573 387.12 586 442 651 442', tone: 'mint', start: 34200, time: actionTime, staticView } },
    { id: 'checks-report', source: 'checks', target: 'report', sourceHandle: 'report', targetHandle: 'checks', type: 'webqa-wire', data: { path: 'M785 321 C785 331 801 335 801 345', tone: 'purple', start: 37000, time, staticView } },
  ], [actionTime, staticView, time]);
  return <div className={styles.scene} role="img" aria-label={copy[locale].accessible} data-webqa-complete={complete}>
    <div ref={host} className={styles.boardViewport} style={{ height: focusOnPhone ? 600 : 560 * scale }}>
      <motion.div className={styles.board} style={{ x: cameraX, y: cameraY, scale: cameraScale }}>
        <ReactFlow<ArtifactNode, WireEdge> id={`webqa-${id}`} nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} defaultViewport={viewport}
          minZoom={1} maxZoom={1} nodesDraggable={false} nodesConnectable={false} nodesFocusable={false} edgesFocusable={false} elementsSelectable={false}
          panOnDrag={false} panOnScroll={false} zoomOnScroll={false} zoomOnPinch={false} zoomOnDoubleClick={false} preventScrolling={false} selectionOnDrag={false} deleteKeyCode={null} disableKeyboardA11y/>
        <Pointer tone="purple" label="Codex" time={actionTime} staticView={staticView}/><Pointer tone="mint" label="QA" time={actionTime} staticView={staticView}/>
      </motion.div>
    </div>
  </div>;
});
