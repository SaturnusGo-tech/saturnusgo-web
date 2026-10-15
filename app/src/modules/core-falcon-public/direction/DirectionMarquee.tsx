"use client";
import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import styles from './direction.module.css';
const icons = { Jira: 'jira.svg', YouTrack: 'youtrack.svg', Confluence: 'confluence.svg', Slack: 'slack.png' };
const rows: (keyof typeof icons)[][] = [
  ['Jira', 'YouTrack', 'Confluence', 'Slack', 'Jira', 'YouTrack'],
  ['Slack', 'Confluence', 'YouTrack', 'Jira', 'Slack', 'Confluence'],
];
export function DirectionMarquee({ title, pause, resume }: { title: string; pause: string; resume: string }) {
  const [paused, setPaused] = useState(false);
  return <section className={styles.integrations} id="connected-tools" aria-labelledby="tools-title">
    <h2 id="tools-title">{title}</h2>
    <div className={styles.marqueeWindow} data-paused={paused}>
      {rows.map((row, i) => <div className={styles.marqueeTrack} data-reverse={i === 1} key={i}>
        {[false, true].map(duplicate => <ul className={styles.logoRow} aria-hidden={duplicate || undefined} key={String(duplicate)}>
          {row.map((name, index) => <li key={`${name}-${index}`}>
            <img src={`/falcon/integrations/${icons[name]}`} width={24} height={24} alt="" />{name}
          </li>)}
        </ul>)}
      </div>)}
    </div>
    <button type="button" className={styles.motionControl} onClick={() => setPaused(value => !value)} aria-label={paused ? resume : pause} aria-pressed={paused}>
      {paused ? <Play size={14} /> : <Pause size={14} />}
    </button>
  </section>;
}
