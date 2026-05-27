"use client";

import { useLanguage } from "../../../../../shared/i18n";
import { PUBLIC_PAGE_COPY } from "../../../../../shared/i18n/page-copy";

export default function Changelog() {
  const { locale } = useLanguage();
  const copy = PUBLIC_PAGE_COPY[locale].changelog;

  return (
    <main className="sg-page">
      <section className="sg-hero" aria-labelledby="changelog-title">
        <div className="sg-hero-media" aria-hidden="true">
          <img src="/mock/device-preview.jpg" alt="" />
        </div>
        <div className="sg-hero-inner">
          <span className="sg-kicker">{copy.hero.kicker}</span>
          <h1 id="changelog-title">{copy.hero.title}</h1>
          <p>{copy.hero.text}</p>
        </div>
      </section>

      <section className="sg-section sg-light" aria-labelledby="timeline-title">
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">{copy.head.kicker}</span>
            <div className="sg-section-copy">
              <h2 id="timeline-title">{copy.head.title}</h2>
              <p>{copy.head.text}</p>
            </div>
          </div>
          <div className="sg-rows">
            {copy.items.map((item) => (
              <article className="sg-row" key={item.title}>
                <span className="sg-row-index">{item.date}</span>
                <h3 className="sg-row-title">{item.title}</h3>
                <p className="sg-row-text">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sg-marquee" aria-label={copy.marqueeLabel}>
        <div className="sg-marquee-rail">
          {[...copy.marquee, ...copy.marquee].map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </section>
    </main>
  );
}
