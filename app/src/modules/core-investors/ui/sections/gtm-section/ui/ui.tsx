"use client";

// components/investors/GtmSection.tsx
'use client';

import { useEffect, useRef, useState } from "react";
import Section from "../../../items/section";

type Item = { title: string; desc: string; sep?: boolean };

const ITEMS: Item[] = [
  { title: 'Direct launch in AR/BR', desc: 'Closed beta cohorts with tight feedback loops and city-by-city activation.' },
  { title: 'Community-led growth',   desc: 'Referrals and ambassadors (nomads, CIS expats); coworking/campus nodes.' },
  { title: 'B2B2C integrations',     desc: 'Local fleets and boutique hotels; supply + distribution partnerships.', sep: true },
];

export default function GtmSection() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const items = Array.from(wrap.querySelectorAll<HTMLLIElement>('li.mitem'));

    if (prefersReduced) {
      items.forEach((li) => li.classList.add('reveal-in'));
      setArmed(true);
      return;
    }

    const gateObs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setArmed(true);
          gateObs.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -10% 0px' }
    );
    gateObs.observe(wrap);

    const itemObs = new IntersectionObserver(
      (entries) => {
        if (!armed) return;
        for (const entry of entries) {
          const li = entry.target as HTMLLIElement;
          if (entry.isIntersecting) {
            li.classList.add('reveal-in');
            itemObs.unobserve(li);
          }
        }
      },
      { threshold: 0.25, rootMargin: '0px 0px -8% 0px' }
    );

    items.forEach((li, i) => {
      li.style.setProperty('--i', String(i));
      itemObs.observe(li);
    });

    return () => {
      gateObs.disconnect();
      itemObs.disconnect();
    };
  }, [armed]);

  return (
    <Section
      id="gtm"
      kicker="GTM"
      title="Beachheads + community + partnerships"
      subtitle="Launch where global players are weak/blocked, leverage micro-communities, partner with local fleets/hotels."
    >
      <div ref={wrapRef} className="mono" role="region" aria-label="Go-to-market highlights">
        <ul className="mlist" role="list">
          {ITEMS.map((it, idx) => {
            const dir = it.sep ? 'dir-c' : (idx % 2 ? 'dir-r' : 'dir-l');
            return (
              <li className={`mitem reveal ${it.sep ? 'has-sep is-bottom' : ''} ${dir}`} key={it.title}>
                <div className="mcopy">
                  <strong className="mt">{it.title}</strong>
                  <p className="md">{it.desc}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <style jsx>{`
        .mono { width: 100%; }

        .mlist{
          list-style: none;
          padding: 0;
          margin: 0 auto;
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr;
          max-width: 980px;
        }
        @media (min-width: 980px){
          .mlist{
            grid-template-columns: repeat(2, minmax(340px, 1fr));
            column-gap: 24px;
            row-gap: 18px;
          }
        }

        .mitem{
          display: flex;
          justify-content: center;
          align-items: flex-start;
          will-change: transform, opacity, filter;
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }

        /* нижний пункт — на всю строку, центр */
        @media (min-width: 980px){
          .mitem.is-bottom{
            grid-column: 1 / -1;
            justify-self: center;
          }
        }

        .mcopy{
          display: inline-grid;   /* shrink-to-fit для тонкой линии */
          gap: 4px;
          text-align: center;
        }

        /* линия только у нижнего пункта */
        .mitem.has-sep .mcopy{
          border-top: 1px solid color-mix(in oklab, var(--border), transparent 20%);
          padding-top: 12px;
        }

        .mt{
          font-weight: 700;
          margin: 0;
          color: var(--text, #ECECEC);
          overflow-wrap: anywhere;
        }
        .md{
          margin: 0;
          font-size: 14.5px;
          line-height: 1.6;
          color: var(--text-2, #A9A9B1);
          text-wrap: pretty;
        }

        /* === Анимации входа каждого айтема (независимо) === */
        .reveal{
          --rise: 22px;
          --skew: 0.3deg;
          --blur: 8px;
          opacity: 0;
          filter: blur(var(--blur));
          transform: translate3d(0, var(--rise), 0) scale(0.985) rotateX(0.0001deg) skewY(var(--skew));
          transition:
            opacity 700ms ease-out,
            filter 700ms ease-out,
            transform 700ms cubic-bezier(.22,.61,.36,1);
          transition-delay: 0ms;
        }
        @media (min-width: 980px){
          .reveal{ transition-delay: calc(var(--i, 0) * 20ms); }
        }

        .reveal.dir-l{ transform: translate3d(-8px, var(--rise), 0) scale(0.985) rotateX(0.0001deg) skewY(var(--skew)); }
        .reveal.dir-r{ transform: translate3d( 8px, var(--rise), 0) scale(0.985) rotateX(0.0001deg) skewY(var(--skew)); }
        .reveal.dir-c{ transform: translate3d(0, var(--rise), 0)  scale(0.985) rotateX(0.0001deg) skewY(var(--skew)); }

        .reveal.reveal-in{
          opacity: 1;
          filter: blur(0px);
          transform: translate3d(0,0,0) scale(1) rotateX(0deg) skewY(0deg);
        }

        @media (prefers-reduced-motion: reduce){
          .reveal, .reveal.reveal-in{
            transition: none !important;
            transform: none !important;
            filter: none !important;
            opacity: 1 !important;
          }
        }

        :global(#gtm .section__head){
          text-align:center;
          margin-left:auto; margin-right:auto;
          max-width: 980px;
        }
        :global(#gtm .section__head .kicker){ letter-spacing: .14em; }
        :global(#gtm .section__head h2){
          margin-left:auto; margin-right:auto;
          font-size: clamp(34px, 4.8vw, 56px);
          line-height: 1.02;
          letter-spacing: -0.01em;
          margin-bottom: 8px;
        }
        :global(#gtm .section__head .sub){
          font-size: clamp(15px, 2vw, 18px);
          color: var(--text-2);
          max-width: 880px;
          margin-left:auto; margin-right:auto;
          text-wrap: pretty;
        }
        :global(#gtm.section){
          margin-top: 72px;
          margin-bottom: 72px;
        }
        @media (max-width: 680px){
          :global(#gtm.section){
            margin-top: 60px;
            margin-bottom: 64px;
          }
        }
      `}</style>
    </Section>
  );
}
