"use client";

import Link from "next/link";

import {
  CORE_INVESTORS_CONTENT_SECTIONS,
  CORE_INVESTORS_MARQUEE_PHRASES,
  CORE_INVESTORS_THESIS_ROWS,
} from "../../../constants";
import type { CoreInvestorsViewProps } from "../../../types";
import ProjectionsSection from "../../sections/projections-section";
import styles from "../styles/styles.module.css";

function TextRows({
  rows,
}: {
  rows: readonly { label: string; text: string }[];
}) {
  return (
    <div className={styles.contentRows}>
      {rows.map((row) => (
        <article key={row.label} className={styles.textRow}>
          <span>{row.label}</span>
          <p>{row.text}</p>
        </article>
      ))}
    </div>
  );
}

export function CoreInvestorsView({
  heroProgress,
  isHeroReady,
  onIntroCtaClick,
  onOpenDeck,
}: CoreInvestorsViewProps) {
  return (
    <div className={styles.root}>
      <section
        className={`${styles.hero} ${isHeroReady ? styles.ready : ""}`}
        aria-labelledby="investor-title"
      >
        <div className={styles.loader} aria-hidden={isHeroReady}>
          <span>{heroProgress}%</span>
        </div>

        <div className={styles.mediaLayer} aria-hidden>
          <img
            src="/mock/hero-main.webp"
            alt=""
            loading="eager"
            decoding="async"
          />
        </div>
        <div className={styles.veil} aria-hidden />

        <div className={styles.heroContent}>
          <div className={styles.heroTopline}>
            <span>SaturnusGo / investors</span>
            <button type="button" onClick={onOpenDeck} aria-haspopup="dialog">
              Open deck
            </button>
          </div>

          <p className={styles.kicker}>Urban mobility thesis</p>
          <h1 id="investor-title">City movement, in one interface.</h1>
          <p className={styles.lead}>
            Trips, delivery, places, routes, and wallet logic connected around
            repeated daily intent — built as one product surface, not a set of
            disconnected utilities.
          </p>

          <div className={styles.heroActions}>
            <button type="button" onClick={onOpenDeck}>
              Review deck
            </button>
            <button type="button" onClick={onIntroCtaClick}>
              Request walkthrough
            </button>
          </div>
        </div>

        <a
          className={styles.scrollHint}
          href="#thesis"
          aria-label="Scroll to investor thesis"
        >
          <span>Scroll down</span>
          <i aria-hidden />
        </a>
      </section>

      <section id="thesis" className={`${styles.thesisSection} reveal`}>
        <div className={styles.thesisHead}>
          <span className={styles.kicker}>Investment case</span>
          <h2>The investment case starts with the operating logic.</h2>
        </div>
        <TextRows rows={CORE_INVESTORS_THESIS_ROWS} />
      </section>

      {CORE_INVESTORS_CONTENT_SECTIONS.slice(0, 1).map((section) => (
        <section
          key={section.id}
          id={section.id}
          className={`${styles.contentSection} reveal`}
          aria-labelledby={`${section.id}-title`}
        >
          <div className={styles.sectionHead}>
            <span className={styles.kicker}>{section.kicker}</span>
            <h2 id={`${section.id}-title`}>{section.title}</h2>
            <p>{section.description}</p>
          </div>
          <TextRows rows={section.rows} />
        </section>
      ))}

      <section className={styles.marquee} aria-label="Investor model surfaces">
        <div className={styles.marqueeRail}>
          {[
            ...CORE_INVESTORS_MARQUEE_PHRASES,
            ...CORE_INVESTORS_MARQUEE_PHRASES,
          ].map((phrase, index) => (
            <span key={`${phrase}-${index}`}>{phrase}</span>
          ))}
        </div>
      </section>

      <section
        className={`${styles.marketIntro} reveal`}
        aria-label="Market model introduction"
      >
        <span className={styles.kicker}>Market model</span>
        <p>
          Switch the horizon, compare assumptions, and keep the 3, 5, and 10
          year growth view visible before opening the deck.
        </p>
      </section>

      <ProjectionsSection />

      {CORE_INVESTORS_CONTENT_SECTIONS.slice(1).map((section) => (
        <section
          key={section.id}
          id={section.id}
          className={`${styles.contentSection} reveal`}
          aria-labelledby={`${section.id}-title`}
        >
          <div className={styles.sectionHead}>
            <span className={styles.kicker}>{section.kicker}</span>
            <h2 id={`${section.id}-title`}>{section.title}</h2>
            <p>{section.description}</p>
          </div>
          <TextRows rows={section.rows} />
        </section>
      ))}

      <section
        id="cta"
        className={`${styles.finalCta} reveal`}
        aria-labelledby="cta-title"
      >
        <span className={styles.kicker}>Next step</span>
        <h2 id="cta-title">If the thesis is interesting, open the deck.</h2>
        <p>Full model, assumptions, rollout logic, and founder context.</p>
        <div className={styles.ctaActions}>
          <button type="button" onClick={onOpenDeck}>
            Open deck
          </button>
          <Link href="/investors/methodology">Methodology</Link>
          <Link href="/founder">Founder</Link>
        </div>
      </section>
    </div>
  );
}
