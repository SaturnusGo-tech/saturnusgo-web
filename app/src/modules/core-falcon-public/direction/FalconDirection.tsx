"use client";
import { ArrowRight, BookOpen, CreditCard, Layers3, ListChecks, Menu, Workflow, X } from 'lucide-react';
import { useState } from 'react';
import { useLandingLocale } from '../landing/localization/context/LandingLocaleProvider';
import { LanguageSelector } from '../landing/localization/presentation/LanguageSelector';
import { FalconDemoForm } from '../demo/FalconDemoForm';
import { DirectionMarquee } from './DirectionMarquee';
import { ProductScene } from './scenes/ProductScene';
import { directionCopy } from './content/copy';
import { AchievementStory } from './achievements/AchievementStory';
import { publicBillingCatalog } from '../../core-tms/billing/domain/catalog/public-billing-catalog';
import { planNames } from '../../core-tms/billing/requests/domain/plan-request';
import styles from './direction.module.css';

export function FalconDirection({ onDemo }: { onDemo: () => void }) {
  const { locale } = useLandingLocale();
  const [menu, setMenu] = useState(false);
  const c = directionCopy[locale];
  const docs = locale === 'ru' ? '/ru/docs/' : '/docs/';
  const ru = locale === 'ru';
  const plansLabel = ru ? 'Тарифы' : 'Plans';
  const planDescriptions = ru ? {
    individual: 'Личное пространство для тест-кейсов и прогонов.',
    startup: 'Общий репозиторий, свой адрес Falcon и управление командой.',
    enterprise: 'Настройка доступа и условий под вашу компанию.',
  } : {
    individual: 'A personal workspace for test cases and runs.',
    startup: 'A shared repository, your own Falcon address and team administration.',
    enterprise: 'Access and terms tailored to your organization.',
  };
  const open = `/cloud-login/?lang=${locale}`;
  return <div className={styles.page} lang={locale}>
    <a href="#main-content" className={styles.skipLink}>{c.skip}</a>
    <header className={styles.navigation}>
      <div className={styles.navigationInner}>
        <a className={styles.brand} href="#top" aria-label="Falcon"><img src="/falcon/landing/2026-11/falcon-line-mark.svg" width={30} height={30} alt="" /><span>Falcon</span></a>
        <nav className={styles.desktopNav} aria-label={c.product}><a href="#repository">{c.product}</a><a href="#falcon-ai">{c.integrations}</a><a href="#plans">{plansLabel}</a><a href="#resources">{c.resources}</a><button onClick={onDemo}>{c.contact}</button></nav>
        <div className={styles.navActions}><LanguageSelector /><a className={styles.docsLink} href={docs}>{c.docs}</a><a className={styles.primary} href={open}>{c.open}</a><button className={styles.menuButton} onClick={() => setMenu(!menu)} aria-label={menu ? c.closeMenu : c.menu} aria-expanded={menu} aria-controls="landing-menu">{menu ? <X size={20} /> : <Menu size={20} />}</button></div>
        {menu && <nav id="landing-menu" className={styles.mobileNav} aria-label={c.menu} onKeyDown={event => { if (event.key === 'Escape') setMenu(false); }} onClick={() => setMenu(false)}><a href="#repository">{c.product}</a><a href="#falcon-ai">{c.integrations}</a><a href="#plans">{plansLabel}</a><a href={docs}>{c.docs}</a><button onClick={onDemo}>{c.contact}</button></nav>}
      </div>
    </header>
    <main id="main-content">
      <section className={styles.hero} id="top" aria-labelledby="direction-title">
        <div className={styles.heroCopy}><h1 id="direction-title">{c.title[0]}<br />{c.title[1]}</h1><div className={styles.heroSubline}><p>{c.lead}</p></div></div>
        <ProductScene kind="hero" locale={locale} />
      </section>
      <DirectionMarquee title={c.tools} note={c.toolsNote} pause={c.pause} resume={c.resume} />
      <section className={styles.principles} aria-labelledby="principles-title"><h2 id="principles-title">{c.statement[0]} <span>{c.statement[1]}</span></h2><div className={styles.principleGrid}>{c.principles.map(item => <article key={item.image}><img src={`/falcon/landing/2026-11/concept-${item.image}.webp`} alt="" width={1448} height={1086} loading="lazy" /><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></section>
      <section id="repository" className={styles.chapter} aria-labelledby="repository-title"><div className={styles.chapterHeading}><div><ListChecks size={22} strokeWidth={1.5} aria-hidden="true" /><h2 id="repository-title">{c.repositoryTitle}</h2></div><div><p>{c.repositoryBody}</p><a className={styles.textLink} href={`${docs}?article=create-test-case`}>{c.repositoryLink}<ArrowRight size={16} aria-hidden="true" /></a></div></div><ProductScene kind="coverage" locale={locale} /><div className={styles.details}>{c.details.map(([title, body], i) => <div key={title}>{i === 0 ? <ListChecks size={17} aria-hidden="true" /> : i === 1 ? <Layers3 size={17} aria-hidden="true" /> : <BookOpen size={17} aria-hidden="true" />}<h3>{title}</h3><p>{body}</p></div>)}</div></section>
      <section id="execution" className={styles.chapter} aria-labelledby="execution-title"><div className={styles.chapterHeading}><div><Layers3 size={22} strokeWidth={1.5} aria-hidden="true" /><h2 id="execution-title">{c.executionTitle}</h2></div><div><p>{c.executionBody}</p><a className={styles.textLink} href={`${docs}?article=create-run`}>{c.executionLink}<ArrowRight size={16} aria-hidden="true" /></a></div></div><ProductScene kind="execution" locale={locale} /></section>
      <AchievementStory locale={locale} />
      <section id="falcon-ai" className={styles.chapter} aria-labelledby="ai-title"><div className={styles.chapterHeading}><div><Workflow size={22} strokeWidth={1.5} aria-hidden="true" /><h2 id="ai-title">{c.aiTitle}</h2></div><div><p>{c.aiBody}</p><a className={styles.textLink} href={`${docs}?article=codex-web-qa`}>{c.aiLink}<ArrowRight size={16} aria-hidden="true" /></a></div></div><ProductScene kind="integrations" locale={locale} /><div className={styles.sceneFootnote}><span>{c.demoLabel}</span></div></section>
      <section id="plans" className={styles.chapter} aria-labelledby="plans-title">
        <div className={styles.chapterHeading}>
          <div><CreditCard size={22} strokeWidth={1.5} aria-hidden="true" /><h2 id="plans-title">{plansLabel}</h2></div>
          <div><p>{ru ? 'Оставьте заявку на подключение. Команда Falcon ответит вам по почте.' : 'Request access and the Falcon team will follow up by email.'}</p></div>
        </div>
        <div className={styles.planGrid}>
          {publicBillingCatalog.map(plan => <article key={plan.id} className={styles.plan}>
            <h3>{planNames[plan.id]}</h3>
            <p className={styles.planPrice}><strong>${new Intl.NumberFormat('en-US').format(plan.amount / 100)}</strong><span>{ru ? 'в месяц' : 'per month'}</span></p>
            <p className={styles.planMeta}>{ru ? (plan.seats === 1 ? '1 место · плюс налоги' : '5 мест · плюс налоги') : (plan.seats === 1 ? '1 seat · plus applicable tax' : '5 seats · plus applicable tax')}</p>
            <p className={styles.planDescription}>{planDescriptions[plan.id]}</p>
            <a className={styles.secondary} href={`${open}&requestPlan=${plan.id}`}>{ru ? 'Запросить подключение' : 'Request access'}<ArrowRight size={16} aria-hidden="true" /></a>
          </article>)}
          <article className={styles.plan}>
            <h3>Enterprise</h3>
            <p className={styles.planPrice}><strong>{ru ? 'По запросу' : 'Custom'}</strong></p>
            <p className={styles.planMeta}>{ru ? 'Места по согласованию' : 'Seats by arrangement'}</p>
            <p className={styles.planDescription}>{planDescriptions.enterprise}</p>
            <a className={styles.secondary} href={`${open}&requestPlan=enterprise`}>{ru ? 'Связаться с нами' : 'Contact us'}<ArrowRight size={16} aria-hidden="true" /></a>
          </article>
        </div>
      </section>
      <section id="resources" className={styles.resources}><BookOpen size={26} strokeWidth={1.5} aria-hidden="true" /><h2>{c.guideTitle}</h2><p>{c.guideBody}</p><a className={styles.secondary} href={docs}>{c.readDocs}<ArrowRight size={16} aria-hidden="true" /></a></section>
      <section className={styles.closing}><h2>{c.closeTitle}</h2><p>{c.closeBody}</p><a className={styles.primary} href={open}>{c.open}<ArrowRight size={16} aria-hidden="true" /></a></section>
      <section id="book-demo" className={styles.demoSection} aria-label={c.demo}><FalconDemoForm locale={locale} /></section>
    </main>
    <footer className={styles.footer}><a className={styles.brand} href="#top"><img src="/falcon/landing/2026-11/falcon-line-mark.svg" width={28} height={28} alt="" /><span>Falcon</span></a><p>{c.brand}</p><nav aria-label={c.resources}><a href={docs}>{c.docs}</a><a href="https://t.me/falcon_tms">{c.contact}</a><a href={`/privacy/?lang=${locale}`}>{c.privacy}</a><a href={`/trial-terms/?lang=${locale}`}>{c.terms}</a><a href="#top">{c.back}<ArrowRight size={14} aria-hidden="true" /></a></nav><small>© 2026 Falcon · SaturnusGo</small></footer>
  </div>;
}
