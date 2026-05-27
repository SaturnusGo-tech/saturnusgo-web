"use client";

import Link from "next/link";

import { useLanguage } from "../../../../../shared/i18n";
import { PUBLIC_PAGE_COPY } from "../../../../../shared/i18n/page-copy";

export default function SupportPage() {
  const { locale } = useLanguage();
  const copy = PUBLIC_PAGE_COPY[locale].support;

  return (
    <main className="sg-page">
      <section className="sg-hero" aria-labelledby="support-title">
        <div className="sg-hero-media" aria-hidden="true">
          <img src="/mock/module-transport.jpg" alt="" />
        </div>
        <div className="sg-hero-inner">
          <span className="sg-kicker">{copy.hero.kicker}</span>
          <h1 id="support-title">{copy.hero.title}</h1>
          <p>{copy.hero.text}</p>
          <div className="sg-actions">
            <Link className="sg-button" href="/faq">
              {copy.hero.primary}
            </Link>
            <Link
              className="sg-button-ghost"
              href="mailto:support@saturnusgo.com"
            >
              {copy.hero.secondary}
            </Link>
          </div>
        </div>
      </section>

      <section
        className="sg-section sg-light"
        aria-labelledby="support-paths-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">{copy.pathsHead.kicker}</span>
            <div className="sg-section-copy">
              <h2 id="support-paths-title">{copy.pathsHead.title}</h2>
              <p>{copy.pathsHead.text}</p>
            </div>
          </div>
          <div className="sg-rows">
            {copy.paths.map((item) => (
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
        aria-labelledby="support-process-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">{copy.processHead.kicker}</span>
            <div className="sg-section-copy">
              <h2 id="support-process-title">{copy.processHead.title}</h2>
              <p>{copy.processHead.text}</p>
            </div>
          </div>
          <div className="sg-panel-grid">
            {copy.process.map((item) => (
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
        aria-labelledby="support-contact-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">{copy.contact.kicker}</span>
            <div className="sg-section-copy">
              <h2 id="support-contact-title">{copy.contact.title}</h2>
              <p>{copy.contact.text}</p>
              <div className="sg-actions">
                <Link
                  className="sg-button"
                  href="mailto:support@saturnusgo.com"
                >
                  support@saturnusgo.com
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
