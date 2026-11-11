'use client';

import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ArrowUp, BookOpen, Check, CheckCheck, FileText, GitPullRequest, ListChecks, ScanLine, SquareTerminal } from 'lucide-react';
import type { LandingLocale } from '../../landing/localization/model/locale';
import { workflowFrame, workflowStory } from './workflow-story';
import { useWorkflowClock } from './useWorkflowClock';
import styles from './workflow-story.module.css';

// Keep HeroUI overlay code out of the landing prerender.
const WorkflowControls = dynamic(() => import('./WorkflowControls').then(module => module.WorkflowControls), { ssr: false });

const icons = [FileText, ScanLine, ListChecks, BookOpen, GitPullRequest];
type Copy = typeof workflowStory.en | typeof workflowStory.ru;

function Artifact({ stage, copy }: { stage: number; copy: Copy }) {
  if (stage === 0) return <>
    <h3>{copy.requirements.title}</h3>
    <p className={styles.artifactLead}>{copy.requirements.lead}</p>
    <blockquote>{copy.requirements.quote}</blockquote>
    <ul className={styles.requirements}>{copy.requirements.items.map(item => <li key={item}><span className={styles.listDot} />{item}</li>)}</ul>
  </>;
  if (stage === 1) return <>
    <h3>{copy.coverage.title}</h3>
    <p className={styles.artifactLead}>{copy.coverage.lead}</p>
    <div className={styles.coverageTable}>
      <div className={styles.tableHeading}>{copy.coverage.columns.map(column => <span key={column}>{column}</span>)}</div>
      {copy.coverage.rows.map(([scenario, result]) => <div key={scenario}><strong>{scenario}</strong><span>{result}</span></div>)}
    </div>
  </>;
  if (stage === 2) return <>
    <h3>{copy.cases.title}</h3>
    <p className={styles.casePrecondition}><strong>{copy.cases.before}</strong> · {copy.cases.beforeText}</p>
    <ol className={styles.caseSteps}>{copy.cases.steps.map(step => <li key={step}>{step}</li>)}</ol>
    <p className={styles.expected}><CheckCheck size={17} aria-hidden="true" /><span>{copy.cases.result}</span></p>
  </>;
  if (stage === 3) return <>
    <h3>{copy.docs.title}</h3>
    <p className={styles.artifactLead}>{copy.docs.lead}</p>
    <h4>{copy.docs.heading}</h4>
    <p className={styles.docBody}>{copy.docs.paragraph}</p>
    <p className={styles.highlight}><mark>{copy.docs.highlight}</mark></p>
    <ul className={styles.documentList}>{copy.docs.items.map(item => <li key={item}>{item}</li>)}</ul>
  </>;
  return <>
    <h3>{copy.evidence.title}</h3>
    <p className={styles.artifactLead}>{copy.evidence.lead}</p>
    <div className={styles.evidenceRows}>{copy.evidence.rows.map(([label, status], index) => <div key={label}>
      {index === 3 ? <GitPullRequest size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
      <span>{label}</span><small>{status}</small>
    </div>)}</div>
    <p className={styles.evidenceNote}>{copy.evidence.note}</p>
  </>;
}

export function WorkflowStory({ locale }: { locale: LandingLocale }) {
  const copy = workflowStory[locale];
  const { ref, elapsed, paused, reducedMotion, togglePause, replay } = useWorkflowClock();
  const frame = workflowFrame(elapsed, copy.prompt);
  const stage = Math.max(0, frame.stage);
  const stageReady = frame.stage >= 0;

  return <section className={styles.section} ref={ref} id="workflow" aria-labelledby="workflow-title">
    <h2 id="workflow-title" className={styles.accessibleSummary}>{copy.title}</h2>
    <figure className={styles.story} data-sent={frame.sent} data-paused={paused} data-reduced-motion={reducedMotion}>
      <div className={styles.scene} aria-hidden="true">
        <motion.div className={styles.composer} data-sent={frame.sent} layout={!reducedMotion} layoutDependency={frame.sent} style={{ borderRadius: 16 }} transition={{ layout: { duration: .85, ease: [.16, 1, .3, 1] } }}>
          <motion.div className={styles.composerIdentity} layout={reducedMotion ? false : 'position'} layoutDependency={frame.sent}><SquareTerminal size={19} strokeWidth={1.6} /><span>Codex<span className={styles.identityDivider}>/</span>Falcon</span></motion.div>
          <motion.p className={styles.prompt} layout={reducedMotion ? false : 'position'} layoutDependency={frame.sent}>{frame.sent ? copy.sent : frame.prompt || <span className={styles.placeholder}>{copy.placeholder}</span>}{!frame.sent && <span className={styles.caret} />}</motion.p>
          <motion.span className={styles.send} data-ready={frame.prompt === copy.prompt} layout={reducedMotion ? false : 'position'} layoutDependency={frame.sent}>{frame.sent ? <Check size={16} /> : <ArrowUp size={18} />}</motion.span>
        </motion.div>
        <div className={styles.process} data-visible={stageReady}>
          <div className={styles.rail}>
            <div className={styles.connection}><motion.span animate={{ scaleX: stage / 4 }} transition={{ duration: reducedMotion ? 0 : .7, ease: [.16, 1, .3, 1] }} /></div>
            {copy.stages.map((label, index) => {
              const Icon = icons[index];
              return <div className={styles.step} data-active={stage === index} data-done={stage > index} key={label}>
                <span className={styles.stepIcon}><Icon size={20} strokeWidth={1.65} /></span>
                <strong>{label}</strong><small>{copy.stageDetail[index]}</small>
              </div>;
            })}
          </div>
          <p className={styles.mobileStageLabel}>{copy.stages[stage]}<span> · {copy.stageDetail[stage]}</span></p>
          <div className={styles.workspace}>
            <aside className={styles.artifactNav}>
              <span className={styles.workspaceName}>Falcon</span>
              {copy.files.map((file, index) => {
                const Icon = icons[index];
                return <div data-active={stage === index} key={file}><Icon size={15} strokeWidth={1.6} /><span>{file}</span>{stage > index && <Check size={13} className={styles.fileCheck} />}</div>;
              })}
            </aside>
            <div className={styles.document}>
              <div className={styles.documentHeader}><span>{copy.files[stage]}</span><span className={styles.documentStatus}>{frame.complete ? copy.complete : copy.working}<span className={styles.statusDot} /></span></div>
              <AnimatePresence initial={false} mode="wait">
                <motion.div className={styles.artifact} key={`${locale}-${stage}`} initial={{ opacity: 0, y: 7, filter: 'blur(3px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -3, filter: 'blur(2px)' }} transition={{ duration: reducedMotion ? 0 : .3, ease: [.16, 1, .3, 1] }}>
                  <Artifact stage={stage} copy={copy} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <figcaption className={styles.caption}>
        <span>{copy.example}</span>
        <WorkflowControls reducedMotion={reducedMotion} complete={frame.complete} paused={paused} pauseLabel={copy.pause} resumeLabel={copy.resume} replayLabel={copy.replay} onTogglePause={togglePause} onReplay={replay} />
      </figcaption>
      <ol className={styles.accessibleSummary}>{copy.stages.map((label, index) => <li key={label}>{label}: {copy.stageDetail[index]}</li>)}</ol>
    </figure>
  </section>;
}
