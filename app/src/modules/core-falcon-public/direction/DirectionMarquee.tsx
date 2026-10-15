"use client";
import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import styles from './direction.module.css';
import { INTEGRATIONS } from '../../core-tms/presentation/hooks/catalog/integration-definitions';
const brandImages: Record<string, string> = { jira: 'jira.svg', youtrack: 'youtrack.svg', confluence: 'confluence.svg', slack: 'slack.png' };
const midpoint = Math.ceil(INTEGRATIONS.length / 2);
const rows = [INTEGRATIONS.slice(0, midpoint), INTEGRATIONS.slice(midpoint)];
export function DirectionMarquee({ title, pause, resume }: { title: string; pause: string; resume: string }) {
  const [paused, setPaused] = useState(false);
  return <section className={styles.integrations} id="connected-tools" aria-labelledby="tools-title">
    <h2 id="tools-title">{title}</h2>
    <div className={styles.marqueeWindow} data-paused={paused}>
      {rows.map((row, i) => <div className={styles.marqueeTrack} data-reverse={i === 1} key={i}>
        {[false, true].map(duplicate => <ul className={styles.logoRow} aria-hidden={duplicate || undefined} key={String(duplicate)}>
          {row.map(({ id, name, icon: Icon }) => <li key={id}>
            {brandImages[id] ? <img src={`/falcon/integrations/${brandImages[id]}`} width={24} height={24} alt="" /> : Icon ? <Icon size={24} aria-hidden="true" /> : null}{name}
          </li>)}
        </ul>)}
      </div>)}
    </div>
    <button type="button" className={styles.motionControl} onClick={() => setPaused(value => !value)} aria-label={paused ? resume : pause} aria-pressed={paused}>
      {paused ? <Play size={14} /> : <Pause size={14} />}
    </button>
  </section>;
}
