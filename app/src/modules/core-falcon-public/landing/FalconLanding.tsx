"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { FalconBrand } from "../shared/FalconBrand";
import { FalconHeader } from "./FalconHeader";
import { FalconHeroCinema } from "./FalconHeroCinema";
import { FalconIntegrations } from "./FalconIntegrations";
import { ProductVideo } from "./media/ProductVideo";
import * as russian from "./content/demos";
import * as english from "./content/demos.en";
import { LandingLocaleProvider, useLandingLocale } from "./localization/context/LandingLocaleProvider";
import { PilotSection } from "./pilot/PilotSection";
import { Reveal } from "./motion/Reveal";
import { ProductStory } from "./ProductStory";
import styles from "./landing.module.css";

export function FalconLanding() {
  return <LandingLocaleProvider><LandingContent /></LandingLocaleProvider>;
}
function LandingContent() {
  const { locale, copy } = useLandingLocale();
  const { demos, workflow, projectStory, resultsStory } = locale === "ru" ? russian : english;
  return (
    <div className={styles.page} data-landing-locale={locale} lang={locale}>
      <a className={styles.skipLink} href="#product">
        {copy.skip}
      </a>
      <FalconHeader />
      <main>
        <FalconHeroCinema />
        <section
          className={styles.overview}
          id="product"
          aria-labelledby="projects-title"
        >
          <ProductStory story={projectStory} headingId="projects-title" />
          <Reveal className={styles.videoReveal} variant="media">
            <ProductVideo key={locale} demo={demos.projects} priority />
          </Reveal>
        </section>
        <nav className={styles.chapterNav} aria-label={copy.chapters}>
          <a href="#product">{copy.projects}</a>
          {workflow.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
        </nav>
        {workflow.map((item) => (
          <section
            key={item.id}
            className={styles.workflowSection}
            id={item.id}
            aria-labelledby={`${item.id}-title`}
          >
            <ProductStory story={item} headingId={`${item.id}-title`} />
            <Reveal className={styles.videoReveal} variant="media">
              <ProductVideo key={locale} demo={demos[item.id]} />
            </Reveal>
          </section>
        ))}
        <section className={styles.workflowSection} id="results" aria-labelledby="results-title">
          <ProductStory story={resultsStory} headingId="results-title" />
          <Reveal className={styles.videoReveal} variant="media">
            <ProductVideo key={locale} demo={demos.dashboard} />
          </Reveal>
        </section>
        <FalconIntegrations />
        <PilotSection />
        <section className={styles.faq} aria-labelledby="faq-title">
          <h2 id="faq-title">{copy.faqTitle}</h2>
          <div>{copy.faq.map(item => <details key={item.question}>
            <summary>{item.question}</summary><p>{item.answer}</p>
          </details>)}</div>
        </section>
      </main>
      <footer className={styles.footer} id="contact">
        <img
          className={styles.footerWing}
          src="/falcon/landing/2026-09/falcon-wing.webp"
          alt=""
          aria-hidden="true"
          width={1672}
          height={941}
          loading="lazy"
        />
        <Reveal className={styles.footerCta}>
          <h2>{copy.footerTitle[0]}<br />{copy.footerTitle[1]}</h2>
          <p className={styles.pilotLead}>{copy.footerLead}</p>
          <a className={styles.primaryButton} href="https://t.me/falcon_tms" target="_blank" rel="noopener noreferrer">
            <SiTelegram size={18} aria-hidden="true" /> {copy.contact}
          </a>
          <p className={styles.telegramHandle}>Telegram · @falcon_tms</p>
        </Reveal>
        <div className={styles.footerMeta}>
          <FalconBrand inverse label={copy.home} />
          <span>{copy.category}</span>
          <Link href="/cloud-login/">
            {copy.companyLogin} <ArrowRight size={14} aria-hidden="true" />
          </Link>
          <small>© {new Date().getFullYear()} Falcon</small>
        </div>
      </footer>
    </div>
  );
}
