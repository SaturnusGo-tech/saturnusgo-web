"use client";
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Pause, Play } from 'lucide-react';
import styles from './direction.module.css';
import { INTEGRATIONS } from '../../core-tms/presentation/hooks/catalog/integration-definitions';

const brandImages: Record<string, string> = {
  codex: '/assets/integrations/codex/codex-light.png',
  jira: '/falcon/integrations/jira.svg',
  youtrack: '/falcon/integrations/youtrack.svg',
  confluence: '/falcon/integrations/confluence.svg',
  slack: '/falcon/integrations/slack.png',
};

export function DirectionMarquee({ title, note, pause, resume }: { title: string; note: string; pause: string; resume: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let inViewport = false;
    const updateVisibility = () => setVisible(inViewport && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      updateVisibility();
    }, { threshold: 0.05 });
    observer.observe(section);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  return <section ref={sectionRef} className={styles.integrations} id="connected-tools" aria-labelledby="tools-title">
    <div className={styles.constellation} data-paused={paused || !visible}>
      <div className={styles.integrationCopy}>
        <h2 id="tools-title">{title}</h2>
        <a className={styles.integrationNote} href="#falcon-ai">{note}<ArrowRight size={15} aria-hidden="true" /></a>
      </div>
      <ul id="tools-logos" className={styles.logoConstellation} aria-label={title}>
        {INTEGRATIONS.map(({ id, name, icon: Icon }) => <li key={id} data-brand={id}>
          <span className={styles.logoFloat} role="img" aria-label={name}>
            {brandImages[id] ? <img src={brandImages[id]} width={42} height={42} alt="" /> : Icon ? <Icon size={42} aria-hidden="true" /> : null}
          </span>
        </li>)}
      </ul>
    </div>
    <button type="button" className={styles.motionControl} onClick={() => setPaused(value => !value)} aria-label={paused ? resume : pause} aria-pressed={paused} aria-controls="tools-logos">
      {paused ? <Play size={14} /> : <Pause size={14} />}
    </button>
  </section>;
}
