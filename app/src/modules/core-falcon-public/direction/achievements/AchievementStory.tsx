'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Pause, Play } from 'lucide-react';
import type { LandingLocale } from '../../landing/localization/model/locale';
import { achievementStory, featuredAchievementArt } from './achievement-story';
import { animateAchievementOrbits } from './achievement-motion';
import styles from './achievement-story.module.css';

export function AchievementStory({ locale }: { locale: LandingLocale }) {
  const copy = achievementStory[locale];
  const artRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<ReturnType<typeof animateAchievementOrbits> | undefined>(undefined);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!artRef.current) return;
    const motion = animateAchievementOrbits(artRef.current);
    motionRef.current = motion;
    return () => { motion.dispose(); motionRef.current = undefined; };
  }, []);

  useEffect(() => { motionRef.current?.setPaused(paused); }, [paused]);

  return (
    <section className={styles.chapter} id="achievements" aria-labelledby="achievements-title">
      <div className={styles.copy}>
        <h2 id="achievements-title">
          <span className={styles.fullCopy}>{copy.title}</span>
          <span className={styles.compactCopy}>{copy.compact.title}</span>
        </h2>
        <p>
          <span className={styles.fullCopy}>{copy.body}</span>
          <span className={styles.compactCopy}>{copy.compact.body}</span>
        </p>
        <a className={styles.action} href={`/cloud-login/?lang=${locale}`}>
          <span className={styles.fullCopy}>{copy.action}</span>
          <span className={styles.compactCopy}>{copy.compact.action}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
      <figure className={styles.collection} aria-label={copy.collection}>
        <div className={styles.art} ref={artRef}>
          {featuredAchievementArt.map((badge, index) => {
            const artwork = <img
              className={styles.badge}
              data-position={index}
              src={`/falcon/achievements/${badge}.webp`}
              alt={copy.badgeNames[index]}
              width={512}
              height={512}
              loading="lazy"
              decoding="async"
            />;
            return index === 6
              ? <div className={styles.anchor} data-anchor key={badge}>{artwork}</div>
              : <div className={styles.orbit} data-orbit data-position={index} key={badge}>{artwork}</div>;
          })}
        </div>
        <figcaption>
          <span className={styles.fullCopy}>{copy.note}</span>
          <button
            className={styles.motionControl}
            type="button"
            onClick={() => setPaused(value => !value)}
            aria-label={paused ? copy.resume : copy.pause}
            aria-pressed={paused}
            title={paused ? copy.resume : copy.pause}
          >
            {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
          </button>
        </figcaption>
      </figure>
    </section>
  );
}
