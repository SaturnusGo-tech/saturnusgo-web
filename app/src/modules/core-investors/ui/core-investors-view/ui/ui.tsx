"use client";

import Footer from "../../items/footer";
import CtaSection from "../../sections/cta-section";
import GtmSection from "../../sections/gtm-section";
import IntroSection from "../../sections/intro-section";
import ModelSection from "../../sections/model-section";
import ProblemSolutionSection from "../../sections/problem-solution-section";
import ProjectionsSection from "../../sections/projections-section";
import RoadmapSection from "../../sections/roadmap-section";
import type { CoreInvestorsViewProps } from "../../../types";
import styles from "../styles/styles.module.css";

export function CoreInvestorsView({
  onIntroCtaClick,
  onOpenDeck,
}: CoreInvestorsViewProps) {
  return (
    <div className={styles.root}>
      <IntroSection onCtaClick={onIntroCtaClick} />
      <ProblemSolutionSection />
      <ProjectionsSection />
      <ModelSection />
      <GtmSection />
      <RoadmapSection />
      <CtaSection onOpenDeck={onOpenDeck} />
      <Footer />
    </div>
  );
}
