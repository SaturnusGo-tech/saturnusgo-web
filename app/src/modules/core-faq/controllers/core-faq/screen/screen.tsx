"use client";

import { useLanguage } from "../../../../../shared/i18n";
import { PUBLIC_PAGE_COPY } from "../../../../../shared/i18n/page-copy";

export default function FaqPage() {
  const { locale } = useLanguage();
  const copy = PUBLIC_PAGE_COPY[locale].faq;

  return (
    <main className="sg-page">
      <section className="sg-hero" aria-labelledby="faq-title">
        <div className="sg-hero-media" aria-hidden="true">
          <img src="/mock/module-places.jpg" alt="" />
        </div>
        <div className="sg-hero-inner">
          <span className="sg-kicker">{copy.hero.kicker}</span>
          <h1 id="faq-title">{copy.hero.title}</h1>
          <p>{copy.hero.text}</p>
        </div>
      </section>

      <section className="sg-section sg-light" aria-labelledby="faq-list-title">
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">{copy.head.kicker}</span>
            <div className="sg-section-copy">
              <h2 id="faq-list-title">{copy.head.title}</h2>
              <p>{copy.head.text}</p>
            </div>
          </div>
          <div className="sg-rows">
            {copy.questions.map((item) => (
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
        aria-labelledby="faq-support-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">{copy.support.kicker}</span>
            <div className="sg-section-copy">
              <h2 id="faq-support-title">{copy.support.title}</h2>
              <p>{copy.support.text}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
