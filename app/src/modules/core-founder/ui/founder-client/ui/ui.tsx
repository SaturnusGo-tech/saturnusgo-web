"use client";

import Link from "next/link";

import { useLanguage } from "../../../../../shared/i18n";
import { PUBLIC_PAGE_COPY } from "../../../../../shared/i18n/page-copy";

export default function FounderClient() {
  const { locale } = useLanguage();
  const copy = PUBLIC_PAGE_COPY[locale].founder;

  return (
    <main className="sg-page">
      <section className="sg-hero" aria-labelledby="founder-title">
        <div className="sg-hero-media" aria-hidden="true">
          <img src="/mock/hero-main.webp" alt="" />
        </div>
        <div className="sg-hero-inner">
          <span className="sg-kicker">{copy.hero.kicker}</span>
          <h1 id="founder-title">{copy.hero.title}</h1>
          <p>{copy.hero.text}</p>
          <div className="sg-actions">
            <Link className="sg-button" href="/investors">
              {copy.hero.primary}
            </Link>
            <Link className="sg-button-ghost" href="/partners">
              {copy.hero.secondary}
            </Link>
          </div>
        </div>
      </section>

      <section
        className="sg-section sg-light"
        aria-labelledby="founder-story-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">{copy.storyHead.kicker}</span>
            <div className="sg-section-copy">
              <h2 id="founder-story-title">{copy.storyHead.title}</h2>
              <p>{copy.storyHead.text}</p>
            </div>
          </div>
          <div className="sg-rows">
            {copy.storyRows.map((item) => (
              <article className="sg-row" key={item.title}>
                <span className="sg-row-index">{item.index}</span>
                <h3 className="sg-row-title">{item.title}</h3>
                <p className="sg-row-text">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="sg-section sg-dark"
        aria-labelledby="founder-principles-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">{copy.principlesHead.kicker}</span>
            <div className="sg-section-copy">
              <h2 id="founder-principles-title">{copy.principlesHead.title}</h2>
              <p>{copy.principlesHead.text}</p>
            </div>
          </div>
          <div className="sg-panel-grid">
            {copy.principles.map((item) => (
              <article className="sg-panel" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
