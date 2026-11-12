'use client';
import dynamic from 'next/dynamic';
import { motion, useTransform, type MotionValue } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Paperclip } from 'lucide-react';
import type { LandingLocale } from '../../landing/localization/model/locale';
import { FalconBrandMark } from '../../../../shared/components/brand/FalconBrandMark';
import { CasesArtifact, GuideArtifact } from './StoryArtifacts';
import { getStoryCopy, type StoryCopy } from './story-copy';
import { useChangeStory } from './useChangeStory';
import { BrandFinale } from './BrandFinale';
import { BrowserQA } from './BrowserQA';
import styles from './change-story.module.css';

const ContextFlow = dynamic(() => import('./ContextFlow').then(module => module.ContextFlow), { ssr: false });
const cameraTimes = [0, 7800, 8400, 9300, 10000, 14000, 14700, 15600, 16300, 20400, 21100, 22000, 22700, 43200, 44000];
const zooms = [1, 1, .68, .68, 1, 1, .7, .7, 1, 1, .7, .7, 1, 1, 1.035];
// One continuous canvas: pull back, travel across the work, then move in to read it.
function cameraPosition(t: number, values: number[]) {
  const end = cameraTimes.findIndex(stop => stop > t);
  if (end < 0) return values[values.length - 1];
  if (end === 0) return values[0];
  const u = (t - cameraTimes[end - 1]) / (cameraTimes[end] - cameraTimes[end - 1]);
  const eased = u * u * (3 - 2 * u);
  return values[end - 1] + (values[end] - values[end - 1]) * eased;
}

export function ChangeStory({ locale }: { locale: LandingLocale }) {
  const c = getStoryCopy(locale);
  const { ref, time, elapsed, running, reducedMotion } = useChangeStory();
  const promptOpacity = useTransform(time, [0, 450, 2800, 3550], [0, 1, 1, 0]);
  const promptScale = useTransform(time, [0, 650, 2800, 3550], [.97, 1, 1, 1.055]);
  const promptBlur = useTransform(time, [0, 650, 2800, 3550], ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(16px)']);
  const promptY = useTransform(time, [0, 650, 2800, 3550], [22, 0, 0, -28]);
  const headingOpacity = useTransform(time, [43700, 44800], [1, 0]);
  const headingBlur = useTransform(time, [43700, 44800], ['blur(0px)', 'blur(9px)']);
  const promptCursorOpacity = useTransform(time, [1700, 1950, 2800, 3250], [0, 1, 1, 0]);
  const promptCursorX = useTransform(time, [1800, 2510, 2780], [0, 64, 66]);
  const promptCursorY = useTransform(time, [1800, 2510, 2780], [0, -29, -27]);

  return <section id="connected-work" className={styles.section} aria-labelledby="codex-story-title">
    <motion.div className={styles.heading} style={reducedMotion ? undefined : { opacity: headingOpacity, filter: headingBlur }}>
      <h2 id="codex-story-title">{c.title.map(line => <span key={line}>{line}</span>)}</h2><p>{c.intro}</p>
    </motion.div>
    <figure ref={ref} className={styles.figure} data-running={running} data-reduced={reducedMotion} data-story-time={Math.round(elapsed)}>
      {reducedMotion ? <div className={styles.staticOverview}><ContextFlow c={c} time={time} staticView/><CasesArtifact c={c} time={time} staticView/><GuideArtifact c={c} time={time} staticView/><BrowserQA c={c} time={time} locale={locale} staticView/></div> : <div className={styles.stage} aria-hidden="true">
        <motion.div className={styles.prompt} style={{ opacity: promptOpacity, y: promptY, scale: promptScale, filter: promptBlur }}>
          <div className={styles.promptText}><TypedRequest text={c.request} time={time}/></div>
          <div className={styles.promptBottom}><img src="/assets/integrations/codex/codex-light.png" width={24} height={24} alt=""/><strong>Codex</strong><span className={styles.promptDivider}/><FalconBrandMark animated={false}/><span>Falcon</span><Paperclip size={18} className={styles.attachment}/><span className={styles.send} data-ready={elapsed > 2400}><ArrowUp size={21}/></span></div>
          <motion.div className={styles.promptCursor} style={{ opacity: promptCursorOpacity, x: promptCursorX, y: promptCursorY }}><AgentCursor label="QA" tone="amber"/></motion.div>
        </motion.div>
        <CanvasJourney c={c} time={time} elapsed={elapsed} locale={locale}/>
        <BrandFinale time={time} reducedMotion={false}/>
      </div>}
      <figcaption className={styles.caption}><span>{c.note}</span></figcaption>
      <p className={styles.srOnly}>{c.accessible}</p>
    </figure>
  </section>;
}

function CanvasJourney({ c, time, elapsed, locale }: {
  c: StoryCopy; time: MotionValue<number>; elapsed: number; locale: LandingLocale;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1200, height: 680 });
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const measure = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const w = Math.min(size.width, 1200);
  const compact = w < 760;
  const second = w + (compact ? 100 : 180);
  const third = second * 2;
  const fourth = second * 3;
  const caseY = compact ? 30 : 65;
  const guideY = compact ? -25 : -40;
  const centersX = [w/2, w/2, w*.6, second+w/2, second+w/2, second+w/2, second+w*.58, third+w/2, third+w/2, third+w/2, third+w*.6, fourth+w/2, fourth+w/2, fourth+w/2, fourth+w/2];
  const centersY = [size.height/2, size.height/2, size.height/2-20, caseY+size.height/2, caseY+size.height/2, caseY+size.height/2, caseY+size.height/2+20, guideY+size.height/2, guideY+size.height/2, guideY+size.height/2, guideY+size.height/2-10, size.height/2, size.height/2, size.height/2, size.height/2];
  const scale = useTransform(time, t => cameraPosition(t, zooms));
  const x = useTransform(time, t => size.width/2 - cameraPosition(t, centersX)*cameraPosition(t, zooms));
  const y = useTransform(time, t => size.height/2 - cameraPosition(t, centersY)*cameraPosition(t, zooms));
  const rotateY = useTransform(time, cameraTimes, [0,0,-4,-4,0,0,4,4,0,0,-3,-3,0,0,0]);
  const rotateX = useTransform(time, cameraTimes, [0,0,3,3,0,0,3,3,0,0,2,2,0,0,0]);
  const opacity = useTransform(time, [3000,3650,43200,44100], [0,1,1,0]);
  const filter = useTransform(time, [3000,3800,43200,44100], ['blur(12px)','blur(0px)','blur(0px)','blur(15px)']);
  const contextOpacity = useTransform(time, [3000,3650,8800,9500], [0,1,1,0]);
  const caseOpacity = useTransform(time, [8700,9500,15500,16300], [0,1,1,0]);
  const guideOpacity = useTransform(time, [14300,15300,22200,22900], [0,1,1,0]);
  const browserOpacity = useTransform(time, [20800,21900], [0,1]);
  const agentX = useTransform(time, [3300, 4200, 4800, 5500, 6200, 7000, 8800, 9700, 11100, 12500, 14300, 15700, 17200], [w*.28, w*.38, w*.61, w*.57, w*.72, w*.97, second+w*.07, second+w*.3, second+w*.43, second+w*.75, third+w*.2, third+w*.47, third+w*.7]);
  const agentY = useTransform(time, [3300, 4200, 4800, 5500, 6200, 7000, 8800, 9700, 11100, 12500, 14300, 15700, 17200], [size.height*.45, size.height*.25, size.height*.28, size.height*.53, size.height*.62, size.height*.30, caseY+size.height*.3, caseY+size.height*.41, caseY+size.height*.55, caseY+size.height*.7, guideY+size.height*.2, guideY+size.height*.42, guideY+size.height*.61]);
  const partnerX = useTransform(time, [3700, 5500, 7100, 8900, 11000, 12900, 14700, 16500, 17700], [w*.18, w*.45, w*.70, second+w*.64, second+w*.75, second+w*.58, third+w*.78, third+w*.61, third+w*.63]);
  const partnerY = useTransform(time, [3700, 5500, 7100, 8900, 11000, 12900, 14700, 16500, 17700], [size.height*.68, size.height*.71, size.height*.74, caseY+size.height*.49, caseY+size.height*.38, caseY+size.height*.7, guideY+size.height*.28, guideY+size.height*.64, guideY+size.height*.73]);
  const cursorOpacity = useTransform(time, [3200, 3900, 20400, 21600], [0, 1, 1, 0]);

  return <div ref={viewport} className={styles.cameraViewport}>
    <motion.div className={styles.camera} style={{ x, y, scale, rotateX, rotateY, opacity, filter }}>
      <motion.div className={`${styles.artboard} ${styles.contextScene}`} style={{ width: w, height: size.height, opacity: contextOpacity }}>
        <div className={styles.contextHeading}><h3>{c.contextTitle}</h3><p>{c.contextBody}</p></div>
        {elapsed >= 2500 && elapsed < 10800 && <ContextFlow c={c} time={time} staticView={false}/>}
      </motion.div>
      <motion.div className={styles.artboard} style={{ left: second, top: caseY, width: w, height: size.height, opacity: caseOpacity }}><CasesArtifact c={c} time={time} staticView={false}/></motion.div>
      <motion.div className={styles.artboard} style={{ left: third, top: guideY, width: w, height: size.height, opacity: guideOpacity }}><GuideArtifact c={c} time={time} staticView={false}/></motion.div>
      <motion.div className={styles.artboard} style={{ left: fourth, width: w, height: size.height, opacity: browserOpacity }}><BrowserQA c={c} time={time} locale={locale}/></motion.div>
      <motion.div className={styles.agent} style={{ x: agentX, y: agentY, opacity: cursorOpacity }}><AgentCursor label="Codex" tone="purple"/></motion.div>
      <motion.div className={styles.agent} style={{ x: partnerX, y: partnerY, opacity: cursorOpacity }}><AgentCursor label="QA" tone="amber"/></motion.div>
    </motion.div>
  </div>;
}
function AgentCursor({ label, tone }: { label: string; tone: 'purple' | 'amber' }) {
  return <span className={styles.agentCursor} data-tone={tone}><svg width="25" height="30" viewBox="0 0 25 30" fill="none"><path d="M2 2L21.5 15.7L12.5 17.3L8.2 25.9L2 2Z" fill="var(--landing-bg)" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"/></svg><span>{label}</span></span>;
}
function TypedRequest({ text, time }: { text: string; time: MotionValue<number> }) {
  let offset = 0;
  return <>{text.split(' ').map((word, index) => { const start = offset; offset += word.length + 1; return <span className={styles.typedWord} key={`${index}-${word}`}>{Array.from(word).map((char, position) => <TypedGlyph key={position} char={char} start={350 + (start + position) * 25} time={time}/>)}{' '}</span>; })}</>;
}
function TypedGlyph({ char, start, time }: { char: string; start: number; time: MotionValue<number> }) {
  const opacity = useTransform(time, [start, start + 160], [0, 1]);
  const filter = useTransform(time, [start, start + 230], ['blur(4px)', 'blur(0px)']);
  const y = useTransform(time, [start, start + 200], [3, 0]);
  return <motion.span className={styles.typedGlyph} style={{ opacity, filter, y }}>{char}</motion.span>;
}
