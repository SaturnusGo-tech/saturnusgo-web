"use client";

// components/investors/IntroSection.tsx
'use client';

import { useEffect, useRef, useState } from "react";
import Section from "../../../items/section";
import NewsLead from '../../../items/news-lead';
import NewsPullQuote from '../../../items/news-pull-quote';
import NewsColumns from '../../../items/news-columns';
import NewsFactBox from '../../../items/news-fact-box';
import RolloutPathAnimated from "../../../items/rollout-path-animated";
import ShimmerH1 from "../../../items/shimmer-h1";

type Props = { onCtaClick: () => void };

export default function IntroSection(_: Props) {
  const rolloutRef = useRef<HTMLElement>(null);
  const [rolloutActive, setRolloutActive] = useState(false);

  useEffect(() => {
    const el = rolloutRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        const inView = !!e?.isIntersecting;
        setRolloutActive(inView);
        if (inView) el.classList.add('is-active');
        else el.classList.remove('is-active');
      },
      { root: null, threshold: 0.35, rootMargin: '-10% 0px -10% 0px' }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Section
      id="intro"
      kicker="Investor overview"
      title="Infrastructure for intelligent mobility in emerging markets"
      subtitle="We unify rides, bookings, places, and loyalty — start where incumbents are weakest and compound with loyalty."
    >
      <div className="intro-wrap">
        <div className="news-grid" role="region" aria-label="Founder's brief in newspaper layout">
          <main className="news-main">
            <NewsLead>
              A modular super-app for mobility & travel. We start LATAM-first —
              launch in Argentina, expand across Brazil; next UAE; then EU.
              <span className="lead-next">
                We unify fragmented ride and travel flows, and compound retention with loyalty and memberships.
              </span>
            </NewsLead>

            <NewsPullQuote text="One product spine across rides, bookings, places, and events — fewer hops, higher trust, better unit economics." />

            <NewsColumns
              sections={[
                { title: 'Why now',      body: `Mobility in emerging markets remains fragmented; reliability and trust are uneven for many users.
                  Super-app attempts bolt features; we ship a single spine that reduces cognitive load and unlocks adoption.` },
                { title: 'What we build', body: `Core ride ordering with class upgrades, city guides & saved places, hotel/event rails, and wishlists with AI planning.
                  The infra is modular: each vertical can run standalone or compound.` },
                { title: 'How it works',  body: `Thin client over a service-oriented backend with real-time via WebSocket and resilient state sync.
                  Cohort-based activation and loyalty to drive repeats.` },
                { title: 'Go-to-market',  body: `Start with Argentina city pairs; expand to Brazil with partner pilots. Subsequent rollouts target UAE, then EU.
                  Focus on underserved segments and B2B2C funnels with strong support and compliance.` },
              ]}
            />
          </main>

          <aside className="news-rail" aria-label="Facts & context">
            <NewsFactBox
              title="At a glance"
              items={[
                { label: 'Moat', value: 'Unified UX + modular infra + loyalty engine' },
                { label: 'Compliance', value: 'Identity checks, risk engine' },
              ]}
            />
            <NewsFactBox
              title="Proof of readiness"
              items={[
                { label: 'Flows', value: 'Core E2E tested' },
                { label: 'Pilots', value: 'Partner pipeline (LATAM)' },
                { label: 'Materials', value: 'Focused walkthrough on request' },
              ]}
            />
          </aside>
        </div>

        {/* ↓ Rollout: появляется при скролле; сбрасывается при выходе из зоны */}
        <section
          ref={rolloutRef}
          className="rollout-below"
          aria-label="Rollout regions"
          aria-describedby="rollout-sub"
        >
          <header className="rollout-head">
            <ShimmerH1 text="Rollout regions" />
            <p id="rollout-sub" className="rollout-sub">
              Argentina → Brazil → UAE → EU · sequential pilots, then scale
            </p>
          </header>
<RolloutPathAnimated active tone="dark" />    
        </section>
      </div>

      <style jsx>{`
        /* базовая сетка */
        .intro-wrap{
          --stroke: color-mix(in oklab, var(--border), white 10%);
          --divider: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 12%, rgba(255,255,255,0.18) 88%, rgba(255,255,255,0) 100%);
          position:relative; display:grid; gap:22px;
          min-width:0; /* 💡 не даём детям раздвигать контейнер */
        }

        .news-grid{
          display:grid; gap:22px;
          grid-template-columns: 1fr;
          align-items:start;
          min-width:0;
        }
        @media (min-width:980px){
          .news-grid{
            grid-template-columns: minmax(0, 1.6fr) minmax(360px, 0.9fr);
            gap:24px;
          }
        }

        .news-main{
          display:grid; gap:18px;
          border-left: 1px solid var(--stroke);
          padding-left:16px;
          min-width:0; /* 💡 ключевой фикс для текста/колонок */
        }
        :global(#intro .lead-next){ display:block; margin-top:6px; }

        /* правый сайдбар */
        .news-rail{
          display:grid; gap:14px; position:relative;
          min-width: 320px; /* десктопная ширина */
        }
        .news-rail::before{
          content:""; position:absolute; left:-14px; top:0; bottom:0; width:1px;
          background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.18), rgba(255,255,255,0.08));
          display:none;
        }
        @media (min-width:980px){ .news-rail::before{ display:block; } }

        /* ===== МОБИЛЬНЫЕ ЖЁСТКИЕ ПРАВКИ ===== */
        @media (max-width:979.98px){
          .intro-wrap{ overflow-x: clip; }

          .news-main{
            border-left:none; padding-left:0; gap:16px; padding-top:12px; position:relative;
          }
          .news-main::before{ content:""; position:absolute; left:0; right:0; top:0; height:1px; background: var(--divider); }
          /* не даём дочерним элементам раздвигать поток */
          .news-main > *{ min-width:0; max-width:100%; }

          .news-rail{
            min-width:0; width:100%; /* 💡 убираем 320px, даём сжаться */
            gap:12px;
          }
          .news-rail > *{ min-width:0; }

          /* гарантируем переносы в любых текстах */
          :global(#intro p),
          :global(#intro li),
          :global(#intro .lead-next){
            overflow-wrap:anywhere; word-break:break-word; hyphens:auto;
          }

          /* медиа внутри не ломают вьюпорт */
          :global(#intro img),
          :global(#intro video),
          :global(#intro svg){
            max-width:100%; height:auto;
          }

          /* аккуратнее заголовок под анимированным шиммером */
          .rollout-head{ overflow:hidden; }
          .rollout-head h1{ font-size: clamp(22px, 6.2vw, 28px); line-height:1.14; }
          .rollout-sub{ font-size: clamp(13px, 3.7vw, 15px); color: var(--text-2); }
        }

        /* Rollout секция с анимацией появления/скрытия + изоляция для плавности */
        .rollout-below{
          display:grid; gap:10px; margin-top:12px;
          justify-self:start;
          opacity: 0;
          transform: translate3d(0, 16px, 0);
          filter: blur(6px);
          contain: layout paint; /* 💡 меньше рефлоу при анимации */
          transition:
            opacity 420ms ease-out,
            transform 420ms ease-out,
            filter 420ms ease-out;
        }
        .rollout-below.is-active{
          opacity: 1;
          transform: translate3d(0, 0, 0);
          filter: blur(0px);
        }
        @media (max-width:979.98px){ .rollout-below{ justify-self:stretch; } }

        :global(#intro .section__head){ max-width: 980px; }
        @media (max-width:680px){
          :global(#intro .section__head h2){ font-size: 30px; line-height: 1.08; }
          :global(#intro .section__head .sub){ font-size: 15px; }
        }
      `}</style>
    </Section>
  );
}
