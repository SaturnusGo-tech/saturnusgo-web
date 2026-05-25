"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import Footer from "../../blocks/footer";
import SocialLinks from "../../blocks/social-links";
import FeatureCards from "../../blocks/feature-cards";
import Hero from "../../blocks/hero";
import Section from "../../blocks/section";
import ScreensMarquee from "../../blocks/screens-marquee";
import TrustSafetyStrip from "../../blocks/trust-safety-strip";
import MiniFAQ from "../../blocks/mini-faq";
import WaitlistCounter from "../../blocks/waitlist-counter";
import WaitList, { API_BASE } from "../../blocks/wait-list";
import {
  CORE_HOME_COPY,
  CORE_HOME_INVESTORS_LABEL,
  CORE_HOME_INVESTORS_PATHNAME,
} from "../../../constants";
import type { CoreHomeViewProps } from "../../../types";
import styles from "../styles/styles.module.css";

const HowItFeels = dynamic(() => import("../../blocks/how-it-feels"), { ssr: false });

export function CoreHomeView({
  pathname,
  shouldMountExperience,
  experienceMountRef,
}: CoreHomeViewProps) {
  const shouldShowInvestorsLink = pathname !== CORE_HOME_INVESTORS_PATHNAME;

  return (
    <div className={styles.root}>
      <Hero />

      <Section {...CORE_HOME_COPY.value}>
        <FeatureCards />
      </Section>

      <Section {...CORE_HOME_COPY.feel}>
        <span id="experience" aria-hidden className={styles.anchorAlias} />
        <div ref={experienceMountRef} className={styles.experienceMountHost}>
          {shouldMountExperience ? <HowItFeels /> : null}
        </div>
      </Section>

      <Section {...CORE_HOME_COPY.screens}>
        <ScreensMarquee />
      </Section>

      <Section {...CORE_HOME_COPY.trust}>
        <TrustSafetyStrip />
      </Section>

      <Section {...CORE_HOME_COPY.faq}>
        <MiniFAQ />
      </Section>

      <Section
        {...CORE_HOME_COPY.waitlist}
        titleAside={<WaitlistCounter apiBase={API_BASE} />}
      >
        <WaitList />
      </Section>

      <Section {...CORE_HOME_COPY.follow}>
        <div className={styles.followCard}>
          <p className={styles.followText}>
            Follow the product build, investor notes and launch progress without the noise.
          </p>
          <SocialLinks size="lg" scroll>
            {shouldShowInvestorsLink ? (
              <Link
                href={CORE_HOME_INVESTORS_PATHNAME}
                className={styles.investorsLink}
                aria-label={CORE_HOME_INVESTORS_LABEL}
              >
                {CORE_HOME_INVESTORS_LABEL}
              </Link>
            ) : null}
          </SocialLinks>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
