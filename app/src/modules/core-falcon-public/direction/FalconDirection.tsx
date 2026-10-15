"use client";
import { ArrowRight, BookOpen, Play } from 'lucide-react';
import { useLandingLocale } from '../landing/localization/context/LandingLocaleProvider';
import { LanguageSelector } from '../landing/localization/presentation/LanguageSelector';
import { FalconDemoForm } from '../demo/FalconDemoForm';
import { DirectionMarquee } from './DirectionMarquee';
import { directionCopy } from './content/copy';
import styles from './direction.module.css';

export function FalconDirection({ onWorkflow, onAI, onDemo }: { onWorkflow: () => void; onAI: () => void; onDemo: () => void }) {
  const { locale } = useLandingLocale();
  const c = directionCopy[locale];
  const art = '/falcon/landing/2026-10/';
  return <div className={styles.page} lang={locale}>
    <a href="#repository" className={styles.skipLink}>{c.product}</a>
    <header className={styles.navigation}>
      <a className={styles.brand} href="#top" aria-label="Falcon"><img src="/falcon/falcon-mark-light.png" width={30} height={30} alt="" /><span>FALCON</span></a>
      <nav aria-label={c.resources}><a href="#repository">{c.product}</a><a href="#connected-tools">{c.integrations}</a><a href="#resources">{c.resources}</a></nav>
      <div className={styles.navActions}><button className={styles.primary} onClick={onDemo}>{c.demo}</button><LanguageSelector /></div>
    </header>
    <main id="top">
      <section className={styles.hero} aria-labelledby="direction-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{c.eyebrow}</p>
          <h1 id="direction-title">{c.title[0]}<br />{c.title[1]}</h1>
          <p className={styles.heroLead}>{c.lead[0]}<br />{c.lead[1]}</p>
          <div className={styles.heroActions}><a href="#repository" className={styles.primary}>{c.explore} <ArrowRight size={14} /></a><button className={styles.ghost} onClick={onWorkflow}>{c.workflow}</button></div>
        </div>
        <div className={styles.heroStage}>
          <img className={styles.heroPreview} src={`${art}hero-preview.png?v=9a4c27dd`} width={2512} height={1660} alt={c.heroAlt} fetchPriority="high" />
        </div>
      </section>
      <DirectionMarquee title={c.tools} pause={c.pause} resume={c.resume} />
      <section id="repository" className={styles.repository} aria-labelledby="repository-title">
        <p className={styles.eyebrow}>{c.repositoryLabel}</p>
        <h2 id="repository-title">{c.repositoryTitle[0]}<br />{c.repositoryTitle[1]}</h2>
        <p className={styles.body}>{c.repositoryBody[0]}{" "}<br className={styles.desktopBreak} />{c.repositoryBody[1]}</p>
        <img className={styles.repositoryStage} src={`${art}repository-stage.png`} width={1280} height={440} alt={c.repositoryAlt} loading="lazy" />
      </section>
      <section id="execution" className={styles.execution} aria-labelledby="execution-title">
        <p className={styles.eyebrow}>{c.executionLabel}</p>
        <div className={styles.executionHeading}><h2 id="execution-title">{c.executionTitle[0]}<br />{c.executionTitle[1]}</h2><p className={styles.body}>{c.executionBody}</p></div>
        <img className={styles.runStage} src={`${art}run-stage.png`} width={1280} height={690} alt={c.runAlt} loading="lazy" />
        <p className={styles.caption}>{c.executionCaption}</p>
      </section>
      <section id="falcon-ai" className={styles.ai} aria-labelledby="ai-title">
        <div className={styles.aiIntro}><p className={styles.eyebrow}>{c.aiLabel}</p><h2 id="ai-title">{c.aiTitle[0]}<br />{c.aiTitle[1]}</h2><p className={styles.body}>{c.aiBody}</p><p className={styles.aiSource}><BookOpen size={17} />{c.aiSource}</p><button className={styles.secondary} onClick={onAI}>{c.aiAction} <ArrowRight size={14} /></button></div>
        <img src={`${art}ai-stage.png`} width={820} height={630} alt={c.aiAlt} loading="lazy" />
      </section>
      <section className={styles.closing}><p className={styles.eyebrow}>{c.closeLabel}</p><h2>{c.closeTitle[0]}<br />{c.closeTitle[1]}</h2><div className={styles.closingActions}><button className={styles.primary} onClick={onDemo}>{c.demo} <ArrowRight size={14} /></button><button className={styles.secondary} onClick={onWorkflow}><Play size={14} aria-hidden="true" />{c.workflow}</button></div></section>
      <section id="book-demo" className={styles.demoSection} aria-label={c.demo}><FalconDemoForm locale={locale} /></section>
    </main>
    <footer className={styles.footer} id="resources">
      <div className={styles.footerLinks}>
        <div className={styles.footerIdentity}><a className={styles.brand} href="#top"><img src="/falcon/falcon-mark-light.png" width={26} height={26} alt="" /><span>FALCON</span></a><p>{c.brand}</p></div>
        <nav aria-label={c.product}><strong>{c.product}</strong><a href="#repository">{c.cases}</a><a href="#execution">{c.runs}</a><a href="#falcon-ai">Falcon AI</a></nav>
        <nav aria-label={c.resources}><strong>{c.resources}</strong><button onClick={onWorkflow}>{c.guide}</button><button onClick={onDemo}>{c.contact}</button><a href={`/privacy/?lang=${locale}`}>{c.privacy}</a></nav>
      </div>
      <div className={styles.footerMeta}><small>© 2026 Falcon · SaturnusGo. All rights reserved.</small><a href="#top">{c.back} ↑</a></div>
      <div className={styles.wordmark} aria-hidden="true">FALCON</div>
    </footer>
  </div>;
}
