"use client";
import { ArrowRight, ArrowUp, BookOpen, Layers3, ListChecks, Menu, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { FalconBrandMark } from '../../../shared/components/brand/FalconBrandMark';
import { useLandingLocale } from '../landing/localization/context/LandingLocaleProvider';
import { LandingHeaderLabel } from '../landing/localization/presentation/LandingHeaderLabel';
import { LanguageSelector } from '../landing/localization/presentation/LanguageSelector';
import { LandingThemeToggle } from '../landing/theme/LandingThemeToggle';
import { useLandingTheme } from '../landing/theme/LandingTheme';
import { DirectionMarquee } from './DirectionMarquee';
import { CommandCenterFilm } from './command-center-film/CommandCenterFilm';
import { ProductScene } from './scenes/ProductScene';
import { directionCopy } from './content/copy';
import { AchievementStory } from './achievements/AchievementStory';
import { FalconPricing } from './pricing/FalconPricing';
import styles from './direction.module.css';

const { en, ru } = directionCopy;
const navigation = [
  { href: '#repository', en: en.product, ru: ru.product },
  { href: '#falcon-ai', en: en.integrations, ru: ru.integrations },
  { href: '#plans', en: 'Plans', ru: 'Тарифы' },
  { href: '#resources', en: en.resources, ru: ru.resources },
];

function ResponsiveCopy({ desktop, phone }: { desktop: ReactNode; phone: string }) {
  return <><span className={styles.desktopCopy}>{desktop}</span><span className={styles.phoneCopy}>{phone}</span></>;
}

export function FalconDirection() {
  const { locale } = useLandingLocale();
  const { theme, ready } = useLandingTheme();
  const [menu, setMenu] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const c = directionCopy[locale];
  const phone = c.phone;
  const docs = locale === 'ru' ? '/ru/docs/' : '/docs/';
  const plansLabel = locale === 'ru' ? 'Тарифы' : 'Plans';
  const open = `/cloud-login/?lang=${locale}`;
  return <div className={styles.page} lang={locale} data-theme={ready ? theme : undefined}>
    <a href="#main-content" className={styles.skipLink}>{c.skip}</a>
    <header className={styles.navigation} onKeyDown={event => {
      if (menu && event.key === 'Escape' && !event.defaultPrevented) {
        setMenu(false);
        menuTrigger.current?.focus();
      }
    }}>
      <div className={styles.navigationInner}>
        <a className={styles.brand} href="#top" aria-label="Falcon">
          <FalconBrandMark className={styles.brandMark} />
          <span>Falcon</span>
        </a>
        <nav className={styles.desktopNav} aria-label={c.product}>
          {navigation.map(({ href, ...labels }) => <a key={href} href={href}><LandingHeaderLabel {...labels} /></a>)}
        </nav>
        <div className={styles.navActions}>
          <LanguageSelector />
          <LandingThemeToggle locale={locale} />
          <a className={styles.docsLink} href={docs}><LandingHeaderLabel en={en.docs} ru={ru.docs} /></a>
          <a className={styles.primary} href={open}><LandingHeaderLabel en={en.open} ru={ru.open} /></a>
          <button type="button" ref={menuTrigger} className={styles.menuButton} onClick={() => setMenu(value => !value)} aria-label={menu ? c.closeMenu : c.menu} aria-expanded={menu} aria-controls="landing-menu">
            {menu ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
        <nav id="landing-menu" className={styles.mobileNav} aria-label={c.menu} data-open={menu} {...(menu ? {} : { inert: '' }) as Record<string, string>}>
          {navigation.map(({ href, ...labels }) => <a key={href} href={href} onClick={() => setMenu(false)}><LandingHeaderLabel {...labels} /></a>)}
          <a href={docs} onClick={() => setMenu(false)}><LandingHeaderLabel en={en.docs} ru={ru.docs} /></a>
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
      <CommandCenterFilm locale={locale} theme={theme} ready={ready} />
      <section id="documentation" className={styles.chapter} aria-labelledby="documentation-title">
        <div className={styles.chapterHeading}>
          <h2 id="documentation-title">{c.documentation.title}</h2>
          <p>{c.documentation.body}</p>
        </div>
        <ProductScene kind="documentation" locale={locale} descriptionId="documentation-caption" />
        <p className={styles.documentationCaption} id="documentation-caption">{c.documentation.caption}</p>
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
              <FalconBrandMark className={styles.footerMark} />
              <span>Falcon</span>
            </a>
            <p>{c.brand}</p>
          </div>
          <nav className={styles.footerGroup} aria-labelledby="footer-product">
            <h2 id="footer-product">{c.product}</h2>
            <ul>
              <li><a href="#documentation">{c.documentation.nav}</a></li>
              <li><a href="#repository">{c.cases}</a></li>
              <li><a href="#execution">{c.runs}</a></li>
              <li><a href="#falcon-ai">{c.integrations}</a></li>
              <li><a href="#plans">{plansLabel}</a></li>
            </ul>
          </nav>
          <nav className={styles.footerGroup} aria-labelledby="footer-resources">
            <h2 id="footer-resources">{c.resources}</h2>
            <ul>
              <li><a href={docs}>{c.footerDocs}</a></li>
              <li><a href="https://t.me/falcon_tms">Telegram</a></li>
            </ul>
          </nav>
        </div>
        <div className={styles.footerBase}>
          <small>© 2026 Falcon · SaturnusGo</small>
          <nav aria-label={c.legal}>
            <a href={`/privacy/?lang=${locale}`}>{c.privacy}</a>
            <a href={`/terms/?lang=${locale}`}>{c.terms}</a>
            <a href={`/billing-terms/?lang=${locale}`}>{c.billing}</a>
            <a href={`/data-deletion/?lang=${locale}`}>{c.deletion}</a>
          </nav>
          <a className={styles.backToTop} href="#top"><ArrowUp size={15} aria-hidden="true" />{c.back}</a>
        </div>
      </div>
    </footer>
  </div>;
}
