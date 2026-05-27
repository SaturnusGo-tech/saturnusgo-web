"use client";

import type { CoreHomeViewProps } from "../../../types";
import { useLanguage } from "../../../../../shared/i18n";
import {
  CoreHomeFeatureCards,
  CoreHomeHero,
  CoreHomeHowItFeels,
  CoreHomeTrustSafetyStrip,
} from "../../blocks";
import styles from "../styles/styles.module.css";

export function CoreHomeView({
  experienceMountRef,
  shouldMountExperience,
}: CoreHomeViewProps) {
  const { dictionary } = useLanguage();
  const copy = dictionary.home;

  return (
    <div className={styles.root}>
      <CoreHomeHero />

      <section id="value" className={`${styles.intro} reveal`}>
        <div className={styles.introCopy}>
          <span className={styles.kicker}>{copy.value.kicker}</span>
          <h2>{copy.value.title}</h2>
          <p>{copy.value.subtitle}</p>
          <a href="#trips">{copy.introLink}</a>
        </div>
        <div className={styles.introVisual} aria-hidden>
          <img src="/mock/device-preview.jpg" alt="" />
        </div>
      </section>

      <section id="experience" className={styles.workSection}>
        <div
          id="feel"
          ref={experienceMountRef}
          className={styles.mountAnchor}
        />
        <div className={`${styles.sectionHead} reveal`}>
          <span className={styles.kicker}>{copy.feel.kicker}</span>
          <h2>{copy.feel.title}</h2>
          <p>{copy.feel.subtitle}</p>
        </div>
        {shouldMountExperience ? (
          <CoreHomeFeatureCards />
        ) : (
          <div className={styles.serviceSkeleton} aria-hidden />
        )}
      </section>

      <section id="screens" className={`${styles.flowsSection} reveal`}>
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>{copy.screens.kicker}</span>
          <h2>{copy.screens.title}</h2>
          <p>{copy.screens.subtitle}</p>
        </div>
        <CoreHomeHowItFeels />
      </section>

      <section
        className={styles.marquee}
        aria-label={copy.marqueeLabel}
      >
        <div className={styles.marqueeRail}>
          {[...copy.screenPhrases, ...copy.screenPhrases].map(
            (phrase, index) => (
              <span key={`${phrase}-${index}`}>{phrase}</span>
            ),
          )}
        </div>
      </section>

      <section id="trust" className={`${styles.presenceSection} reveal`}>
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>{copy.trust.kicker}</span>
          <h2>{copy.trust.title}</h2>
          <p>{copy.trust.subtitle}</p>
        </div>
        <CoreHomeTrustSafetyStrip />
      </section>

      <section id="download-app" className={`${styles.download} reveal`}>
        <div className={styles.downloadCopy}>
          <span className={styles.kicker}>{copy.download.kicker}</span>
          <h2>{copy.download.title}</h2>
          <p>{copy.download.text}</p>
          <img src="/mock/app-qr.png" alt={copy.download.qrAlt} />
        </div>
        <div className={styles.phone} aria-hidden>
          <img src="/mock/device-preview.jpg" alt="" />
        </div>
      </section>
    </div>
  );
}
