"use client";

import Link from "next/link";

import { useLanguage } from "../../../../../shared/i18n";
import { PUBLIC_PAGE_COPY } from "../../../../../shared/i18n/page-copy";

export default function Press() {
  const { locale } = useLanguage();
  const copy = PUBLIC_PAGE_COPY[locale].press;

  return (
    <main className="sg-page">
      <section className="sg-hero" aria-labelledby="press-title">
        <div className="sg-hero-media" aria-hidden="true">
          <img src="/mock/hero-main.webp" alt="" />
        </div>
        <div className="sg-hero-inner">
          <span className="sg-kicker">{copy.hero.kicker}</span>
          <h1 id="press-title">{copy.hero.title}</h1>
          <p>{copy.hero.text}</p>
        </div>
      </section>

      <section
        className="sg-section sg-light"
        aria-labelledby="press-facts-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">{copy.head.kicker}</span>
            <div className="sg-section-copy">
              <h2 id="press-facts-title">{copy.head.title}</h2>
              <p>{copy.head.text}</p>
            </div>
          </div>
          <div className="sg-rows">
            {copy.facts.map((item) => (
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
        aria-labelledby="press-next-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">{copy.request.kicker}</span>
            <div className="sg-section-copy">
              <h2 id="press-next-title">{copy.request.title}</h2>
              <p>{copy.request.text}</p>
              <div className="sg-actions">
                <Link className="sg-button" href="mailto:press@saturnusgo.com">
                  press@saturnusgo.com
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
