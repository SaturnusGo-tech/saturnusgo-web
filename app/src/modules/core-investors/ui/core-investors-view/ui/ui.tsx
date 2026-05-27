"use client";

import Link from "next/link";

import type { CoreInvestorsViewProps } from "../../../types";
import { useLanguage } from "../../../../../shared/i18n";
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
  const { dictionary } = useLanguage();
  const copy = dictionary.investors;

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
            <span>{copy.hero.topLine}</span>
            <button type="button" onClick={onOpenDeck} aria-haspopup="dialog">
              {copy.hero.openDeck}
            </button>
          </div>

          <p className={styles.kicker}>{copy.hero.kicker}</p>
          <h1 id="investor-title">{copy.hero.title}</h1>
          <p className={styles.lead}>{copy.hero.lead}</p>

          <div className={styles.heroActions}>
            <button type="button" onClick={onOpenDeck}>
              {copy.hero.reviewDeck}
            </button>
            <button type="button" onClick={onIntroCtaClick}>
              {copy.hero.requestWalkthrough}
            </button>
          </div>
        </div>

        <a
          className={styles.scrollHint}
          href="#thesis"
          aria-label={copy.hero.scrollLabel}
        >
          <span>{copy.hero.scrollText}</span>
          <i aria-hidden />
        </a>
      </section>

      <section id="thesis" className={`${styles.thesisSection} reveal`}>
        <div className={styles.thesisHead}>
          <span className={styles.kicker}>{copy.thesis.kicker}</span>
          <h2>{copy.thesis.title}</h2>
        </div>
        <TextRows rows={copy.thesis.rows} />
      </section>

      {copy.contentSections.slice(0, 1).map((section) => (
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

      <section className={styles.marquee} aria-label={copy.marqueeLabel}>
        <div className={styles.marqueeRail}>
          {[
            ...copy.marqueePhrases,
            ...copy.marqueePhrases,
          ].map((phrase, index) => (
            <span key={`${phrase}-${index}`}>{phrase}</span>
          ))}
        </div>
      </section>

      <section
        className={`${styles.marketIntro} reveal`}
        aria-label={copy.marketIntro.label}
      >
        <span className={styles.kicker}>{copy.marketIntro.label}</span>
        <p>{copy.marketIntro.text}</p>
      </section>

      <ProjectionsSection />

      {copy.contentSections.slice(1).map((section) => (
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
        <span className={styles.kicker}>{copy.finalCta.kicker}</span>
        <h2 id="cta-title">{copy.finalCta.title}</h2>
        <p>{copy.finalCta.text}</p>
        <div className={styles.ctaActions}>
          <button type="button" onClick={onOpenDeck}>
            {copy.finalCta.openDeck}
          </button>
          <Link href="/investors/methodology">{copy.finalCta.methodology}</Link>
          <Link href="/founder">{copy.finalCta.founder}</Link>
        </div>
      </section>
    </div>
  );
}
