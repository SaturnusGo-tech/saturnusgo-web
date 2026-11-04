import { ArrowRight } from 'lucide-react';
import type { LandingLocale } from '../../landing/localization/model/locale';
import { achievementStory, featuredAchievementArt } from './achievement-story';
import styles from './achievement-story.module.css';

export function AchievementStory({ locale }: { locale: LandingLocale }) {
  const copy = achievementStory[locale];
  return (
    <section className={styles.chapter} id="achievements" aria-labelledby="achievements-title">
      <div className={styles.copy}>
        <h2 id="achievements-title">{copy.title}</h2>
        <p>{copy.body}</p>
        <a className={styles.action} href={`/cloud-login/?lang=${locale}`}>
          {copy.action}<ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
      <figure className={styles.collection} aria-label={copy.collection}>
        <div className={styles.art}>
          {featuredAchievementArt.map((badge, index) => (
            <img
              className={styles.badge}
              data-position={index}
              key={badge}
              src={`/falcon/achievements/${badge}.webp`}
              alt={copy.badgeNames[index]}
              width={512}
              height={512}
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
        <figcaption>{copy.note}</figcaption>
      </figure>
    </section>
  );
}
