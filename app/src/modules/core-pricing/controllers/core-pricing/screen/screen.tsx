"use client";

import Link from "next/link";

import { useLanguage } from "../../../../../shared/i18n";
import { PUBLIC_PAGE_COPY } from "../../../../../shared/i18n/page-copy";

export default function PricingPage() {
  const { locale } = useLanguage();
  const copy = PUBLIC_PAGE_COPY[locale].pricing;

  return (
    <main className="sg-page">
      <section className="sg-hero" aria-labelledby="pricing-title">
        <div className="sg-hero-media" aria-hidden="true">
          <img src="/mock/module-trips.webp" alt="" />
        </div>
        <div className="sg-hero-inner">
          <span className="sg-kicker">{copy.hero.kicker}</span>
          <h1 id="pricing-title">{copy.hero.title}</h1>
          <p>{copy.hero.text}</p>
          <div className="sg-actions">
            <Link className="sg-button" href="/#download-app">
              {copy.hero.primary}
            </Link>
            <Link className="sg-button-ghost" href="/features">
              {copy.hero.secondary}
            </Link>
          </div>
        </div>
      </section>

      <section className="sg-section sg-light" aria-labelledby="plans-title">
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">{copy.plansHead.kicker}</span>
            <div className="sg-section-copy">
              <h2 id="plans-title">{copy.plansHead.title}</h2>
              <p>{copy.plansHead.text}</p>
            </div>
          </div>
          <div className="sg-rows">
            {copy.tiers.map((tier) => (
              <article className="sg-row" key={tier.title}>
                <span className="sg-row-index">{tier.index}</span>
                <h3 className="sg-row-title">{tier.title}</h3>
                <p className="sg-row-text">
                  <strong>{tier.value}</strong>
                  <br />
                  {tier.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="sg-section sg-dark"
        aria-labelledby="pricing-principles-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">{copy.logicHead.kicker}</span>
            <div className="sg-section-copy">
              <h2 id="pricing-principles-title">{copy.logicHead.title}</h2>
              <p>{copy.logicHead.text}</p>
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

      <section
        className="sg-section sg-light"
        aria-labelledby="pricing-next-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">{copy.next.kicker}</span>
            <div className="sg-section-copy">
              <h2 id="pricing-next-title">{copy.next.title}</h2>
              <p>{copy.next.text}</p>
              <div className="sg-actions">
                <Link className="sg-button" href="/partners">
                  {copy.next.cta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
