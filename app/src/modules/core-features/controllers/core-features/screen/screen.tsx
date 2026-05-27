"use client";

import Link from "next/link";

import { useLanguage } from "../../../../../shared/i18n";
import { PUBLIC_PAGE_COPY } from "../../../../../shared/i18n/page-copy";

export default function FeaturesPage() {
  const { locale } = useLanguage();
  const copy = PUBLIC_PAGE_COPY[locale].features;

  return (
    <main className="sg-page">
      <section className="sg-hero" aria-labelledby="features-title">
        <div className="sg-hero-media" aria-hidden="true">
          <img src="/mock/hero-main.webp" alt="" />
        </div>
        <div className="sg-hero-inner">
          <span className="sg-kicker">{copy.hero.kicker}</span>
          <h1 id="features-title">{copy.hero.title}</h1>
          <p>{copy.hero.text}</p>
          <div className="sg-actions">
            <Link className="sg-button" href="/#experience">
              {copy.hero.primary}
            </Link>
            <Link className="sg-button-ghost" href="/partners">
              {copy.hero.secondary}
            </Link>
          </div>
        </div>
      </section>

      <section className="sg-section sg-light" aria-labelledby="surfaces-title">
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">{copy.surfacesHead.kicker}</span>
            <div className="sg-section-copy">
              <h2 id="surfaces-title">{copy.surfacesHead.title}</h2>
              <p>{copy.surfacesHead.text}</p>
            </div>
          </div>
          <div className="sg-rows">
            {copy.surfaces.map((item) => (
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
        aria-labelledby="guarantees-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">{copy.standardHead.kicker}</span>
            <div className="sg-section-copy">
              <h2 id="guarantees-title">{copy.standardHead.title}</h2>
              <p>{copy.standardHead.text}</p>
            </div>
          </div>
          <div className="sg-panel-grid">
            {copy.guarantees.map((item) => (
              <article className="sg-panel" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sg-section sg-light" aria-labelledby="details-title">
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">{copy.scopeHead.kicker}</span>
            <div className="sg-section-copy">
              <h2 id="details-title">{copy.scopeHead.title}</h2>
              <p>{copy.scopeHead.text}</p>
            </div>
          </div>
          <div className="sg-rows">
            {copy.details.map((detail, index) => (
              <article className="sg-row" key={detail}>
                <span className="sg-row-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="sg-row-title">{detail}</h3>
                <p className="sg-row-text">{copy.detailNote}</p>
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
