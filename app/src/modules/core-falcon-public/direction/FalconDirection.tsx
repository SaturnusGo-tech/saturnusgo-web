"use client";
import { ArrowRight, ArrowUp, BookOpen, Layers3, ListChecks, Menu, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLandingLocale } from '../landing/localization/context/LandingLocaleProvider';
import { LanguageSelector } from '../landing/localization/presentation/LanguageSelector';
import { DirectionMarquee } from './DirectionMarquee';
import { ProductScene } from './scenes/ProductScene';
import { directionCopy } from './content/copy';
import { AchievementStory } from './achievements/AchievementStory';
import { FalconPricing } from './pricing/FalconPricing';
import styles from './direction.module.css';

function ResponsiveCopy({ desktop, phone }: { desktop: ReactNode; phone: string }) {
  return <><span className={styles.desktopCopy}>{desktop}</span><span className={styles.phoneCopy}>{phone}</span></>;
}

export function FalconDirection() {
  const { locale } = useLandingLocale();
  const [menu, setMenu] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const c = directionCopy[locale];
  const phone = c.phone;
  const docs = locale === 'ru' ? '/ru/docs/' : '/docs/';
  const ru = locale === 'ru';
  const plansLabel = ru ? 'Тарифы' : 'Plans';
  const open = `/cloud-login/?lang=${locale}`;
  const navigation = [
    [c.product, '#repository'],
    [c.integrations, '#falcon-ai'],
    [plansLabel, '#plans'],
    [c.resources, '#resources'],
    [c.contact, '#contact'],
  ] as const;
  return <div className={styles.page} lang={locale}>
    <a href="#main-content" className={styles.skipLink}>{c.skip}</a>
    <header className={styles.navigation} onKeyDown={event => {
      if (menu && event.key === 'Escape' && !event.defaultPrevented) {
        setMenu(false);
        menuTrigger.current?.focus();
      }
    }}>
      <div className={styles.navigationInner}>
        <a className={styles.brand} href="#top" aria-label="Falcon"><img src="/falcon/landing/2026-11/falcon-line-mark.svg" width={30} height={30} alt="" /><span>Falcon</span></a>
        <nav className={styles.desktopNav} aria-label={c.product}>
          {navigation.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <div className={styles.navActions}>
          <LanguageSelector />
          <a className={styles.docsLink} href={docs}>{c.docs}</a>
          <a className={styles.primary} href={open}>{c.open}</a>
          <button type="button" ref={menuTrigger} className={styles.menuButton} onClick={() => setMenu(value => !value)} aria-label={menu ? c.closeMenu : c.menu} aria-expanded={menu} aria-controls="landing-menu">
            {menu ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
        <nav id="landing-menu" className={styles.mobileNav} aria-label={c.menu} data-open={menu} inert={!menu}>
          {navigation.map(([label, href]) => <a key={href} href={href} onClick={() => setMenu(false)}>{label}</a>)}
          <a href={docs} onClick={() => setMenu(false)}>{c.docs}</a>
        </nav>
      </div>
    </header>
    <main id="main-content">
      <section className={styles.hero} id="top" aria-labelledby="direction-title">
        <div className={styles.heroCopy}>
          <h1 id="direction-title"><ResponsiveCopy desktop={<>{c.title[0]}<br />{c.title[1]}</>} phone={phone.title} /></h1>
          <div className={styles.heroSubline}><p><ResponsiveCopy desktop={c.lead} phone={phone.lead} /></p></div>
        </div>
        <ProductScene kind="hero" locale={locale} />
      </section>
      <DirectionMarquee title={c.tools} note={c.toolsNote} pause={c.pause} resume={c.resume} />
      <section className={styles.principles} aria-labelledby="principles-title">
        <h2 id="principles-title"><ResponsiveCopy desktop={<>{c.statement[0]} <span>{c.statement[1]}</span></>} phone={phone.statement} /></h2>
        <p className={`${styles.phoneCopy} ${styles.principlesLead}`}>{phone.statementLead}</p>
        <div className={styles.principleGrid}>
          {c.principles.map((item, i) => <article key={item.image}>
            <img src={`/falcon/landing/2026-11/concept-${item.image}.webp`} alt="" width={1448} height={1086} loading="lazy" />
            <h3><ResponsiveCopy desktop={item.title} phone={phone.principles[i].title} /></h3>
            <p><ResponsiveCopy desktop={item.body} phone={phone.principles[i].body} /></p>
          </article>)}
        </div>
      </section>
      <section id="repository" className={styles.chapter} aria-labelledby="repository-title">
        <div className={styles.chapterHeading}>
          <div><h2 id="repository-title"><ResponsiveCopy desktop={c.repositoryTitle} phone={phone.repository.title} /></h2></div>
          <div>
            <p><ResponsiveCopy desktop={c.repositoryBody} phone={phone.repository.body} /></p>
            <a className={styles.textLink} href={`${docs}?article=create-test-case`}><ResponsiveCopy desktop={c.repositoryLink} phone={phone.repository.link} /><ArrowRight size={16} aria-hidden="true" /></a>
          </div>
        </div>
        <ProductScene kind="coverage" locale={locale} />
        <div className={styles.details}>
          {c.details.map(([title, body], i) => <div key={title}>
            {i === 0 ? <ListChecks size={17} aria-hidden="true" /> : i === 1 ? <Layers3 size={17} aria-hidden="true" /> : <BookOpen size={17} aria-hidden="true" />}
            <h3><ResponsiveCopy desktop={title} phone={phone.details[i]} /></h3>
            <p className={styles.desktopCopy}>{body}</p>
          </div>)}
        </div>
      </section>
      <section id="execution" className={styles.chapter} aria-labelledby="execution-title">
        <div className={styles.chapterHeading}>
          <div><h2 id="execution-title"><ResponsiveCopy desktop={c.executionTitle} phone={phone.execution.title} /></h2></div>
          <div>
            <p><ResponsiveCopy desktop={c.executionBody} phone={phone.execution.body} /></p>
            <a className={styles.textLink} href={`${docs}?article=create-run`}><ResponsiveCopy desktop={c.executionLink} phone={phone.execution.link} /><ArrowRight size={16} aria-hidden="true" /></a>
          </div>
        </div>
        <ProductScene kind="execution" locale={locale} />
      </section>
      <AchievementStory locale={locale} />
      <section id="falcon-ai" className={styles.chapter} aria-labelledby="ai-title">
        <div className={styles.chapterHeading}>
          <div><h2 id="ai-title"><ResponsiveCopy desktop={c.aiTitle} phone={phone.ai.title} /></h2></div>
          <div>
            <p><ResponsiveCopy desktop={c.aiBody} phone={phone.ai.body} /></p>
            <a className={styles.textLink} href={`${docs}?article=codex-web-qa`}><ResponsiveCopy desktop={c.aiLink} phone={phone.ai.link} /><ArrowRight size={16} aria-hidden="true" /></a>
          </div>
        </div>
        <ProductScene kind="integrations" locale={locale} />
      </section>
      <FalconPricing locale={locale} />
      <section className={styles.closing}>
        <h2><ResponsiveCopy desktop={c.closeTitle} phone={phone.closeTitle} /></h2>
        <p className={styles.desktopCopy}>{c.closeBody}</p>
        <a className={styles.primary} href={open}>{c.open}<ArrowRight size={16} aria-hidden="true" /></a>
      </section>
    </main>
    <footer id="resources" className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerMain}>
          <div className={styles.footerIdentity}>
            <a className={styles.brand} href="#top">
              <img src="/falcon/landing/2026-11/falcon-line-mark.svg" width={28} height={28} alt="" />
              <span>Falcon</span>
            </a>
            <p>{c.brand}</p>
          </div>
          <nav className={styles.footerGroup} aria-labelledby="footer-product">
            <h2 id="footer-product">{c.product}</h2>
            <ul>
              <li><a href="#repository">{c.cases}</a></li>
              <li><a href="#execution">{c.runs}</a></li>
              <li><a href="#falcon-ai">{c.integrations}</a></li>
              <li><a href="#plans">{plansLabel}</a></li>
            </ul>
          </nav>
          <nav id="contact" className={styles.footerGroup} aria-labelledby="footer-resources">
            <h2 id="footer-resources">{c.resources}</h2>
            <ul>
              <li><a href={docs}>{c.docs}</a></li>
              <li><a href="mailto:falcon@saturnusgo.com">{c.contact}</a></li>
              <li><a href="https://t.me/falcon_tms">Telegram</a></li>
            </ul>
          </nav>
        </div>
        <div className={styles.footerBase}>
          <small>© 2026 Falcon · SaturnusGo</small>
          <nav aria-label={c.legal}>
            <a href={`/privacy/?lang=${locale}`}>{c.privacy}</a>
            <a href={`/trial-terms/?lang=${locale}`}>{c.terms}</a>
          </nav>
          <a className={styles.backToTop} href="#top"><ArrowUp size={15} aria-hidden="true" />{c.back}</a>
        </div>
      </div>
    </footer>
  </div>;
}
