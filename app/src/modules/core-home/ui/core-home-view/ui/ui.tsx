"use client";

import { CORE_HOME_COPY, CORE_HOME_SCREEN_PHRASES } from "../../../constants";
import type { CoreHomeViewProps } from "../../../types";
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
  return (
    <div className={styles.root}>
      <CoreHomeHero />

      <section id="value" className={`${styles.intro} reveal`}>
        <div className={styles.introCopy}>
          <span className={styles.kicker}>{CORE_HOME_COPY.value.kicker}</span>
          <h2>{CORE_HOME_COPY.value.title}</h2>
          <p>{CORE_HOME_COPY.value.subtitle}</p>
          <a href="#trips">More about the flow</a>
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
          <span className={styles.kicker}>{CORE_HOME_COPY.feel.kicker}</span>
          <h2>{CORE_HOME_COPY.feel.title}</h2>
          <p>{CORE_HOME_COPY.feel.subtitle}</p>
        </div>
        {shouldMountExperience ? (
          <CoreHomeFeatureCards />
        ) : (
          <div className={styles.serviceSkeleton} aria-hidden />
        )}
      </section>

      <section id="screens" className={`${styles.flowsSection} reveal`}>
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>{CORE_HOME_COPY.screens.kicker}</span>
          <h2>{CORE_HOME_COPY.screens.title}</h2>
          <p>{CORE_HOME_COPY.screens.subtitle}</p>
        </div>
        <CoreHomeHowItFeels />
      </section>

      <section
        className={styles.marquee}
        aria-label="SaturnusGo product surfaces"
      >
        <div className={styles.marqueeRail}>
          {[...CORE_HOME_SCREEN_PHRASES, ...CORE_HOME_SCREEN_PHRASES].map(
            (phrase, index) => (
              <span key={`${phrase}-${index}`}>{phrase}</span>
            ),
          )}
        </div>
      </section>

      <section id="trust" className={`${styles.presenceSection} reveal`}>
        <div className={styles.sectionHead}>
          <span className={styles.kicker}>{CORE_HOME_COPY.trust.kicker}</span>
          <h2>{CORE_HOME_COPY.trust.title}</h2>
          <p>{CORE_HOME_COPY.trust.subtitle}</p>
        </div>
        <CoreHomeTrustSafetyStrip />
      </section>

      <section id="download-app" className={`${styles.download} reveal`}>
        <div className={styles.downloadCopy}>
          <span className={styles.kicker}>Private access</span>
          <h2>Download the app when the launch flow opens.</h2>
          <p>
            QR, mobile preview and launch action stay at the end of the same
            narrative instead of breaking the product story.
          </p>
          <img src="/mock/app-qr.png" alt="SaturnusGo app QR code" />
        </div>
        <div className={styles.phone} aria-hidden>
          <img src="/mock/device-preview.jpg" alt="" />
        </div>
      </section>
    </div>
  );
}
