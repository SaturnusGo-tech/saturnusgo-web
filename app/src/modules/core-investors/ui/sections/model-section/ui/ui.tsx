"use client";

// components/investors/ModelSection.tsx
'use client';

import { useEffect, useRef, useState } from "react";
import Section from "../../../items/section";

type Item = { title: string; desc: string };

const ITEMS: Item[] = [
  { title: 'Trip commission',              desc: 'Transparent per-trip economics across ride classes and repeat routes.' },
  { title: 'Delivery service fee',         desc: 'Everyday orders, courier tasks, and partner fulfillment in one logistics surface.' },
  { title: 'Places monetization',          desc: 'Promoted venues, saved-place activation, and discovery-to-visit conversion.' },
  { title: 'Transport partnerships',       desc: 'Route integrations, city operators, and B2B distribution for mobility supply.' },
];

export default function ModelSection() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const items = Array.from(wrap.querySelectorAll<HTMLLIElement>('li.mitem'));

    const resetAll = () => { items.forEach((li) => li.classList.remove('reveal-in')); };

    if (prefersReduced) {
      items.forEach((li) => li.classList.add('reveal-in'));
      setArmed(true);
      return;
    }

    // Гейт: держим наблюдение, чтобы при выходе из зоны мгновенно сбрасывать
    const gateObs = new IntersectionObserver(
      ([entry]) => {
        const inView = !!entry?.isIntersecting;
        setArmed(inView);
        if (!inView) resetAll();
      },
      { threshold: 0.25, rootMargin: '-10% 0px -10% 0px' }
    );
    gateObs.observe(wrap);

    // Айтемы: добавляем/снимаем reveal-in в зависимости от видимости
    const itemObs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const li = entry.target as HTMLLIElement;
          if (!armed) { li.classList.remove('reveal-in'); continue; }
          if (entry.isIntersecting) li.classList.add('reveal-in');
          else li.classList.remove('reveal-in');
        }
      },
      { threshold: 0.25, rootMargin: '0px 0px -8% 0px' }
    );

    items.forEach((li, i) => {
      li.style.setProperty('--i', String(i));
      li.classList.add(i % 2 ? 'dir-r' : 'dir-l'); // на всякий случай
      itemObs.observe(li);
    });

    return () => {
      gateObs.disconnect();
      itemObs.disconnect();
    };
  }, [armed]);

  return (
    <Section
      id="model"
      kicker="Business model"
      title="Monetization follows the city journey"
      subtitle="Four streams aligned with the current product: trips, delivery, places, and transport partnerships."
    >
      <div ref={wrapRef} className="mono" role="region" aria-label="Monetization highlights">
        <ul className="mlist" role="list">
          {ITEMS.map((it, idx) => (
            <li className={`mitem reveal ${idx % 2 ? 'dir-r' : 'dir-l'}`} key={it.title}>
              <div className="mcopy">
                <strong className="mt">{it.title}</strong>
                <p className="md">{it.desc}</p>
              </div>
            </li>
          ))}
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
          place-content: center;
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

        .mcopy{
          width: 100%;
          max-width: 520px;
          text-align: center;
          padding-top: 0;
          border-top: 0;
        }

        .mlist > li:nth-child(n+3) .mcopy{
          border-top: 1px solid color-mix(in oklab, var(--border), transparent 20%);
          padding-top: 12px;
        }
        @media (min-width: 980px){
          .mlist > li:nth-child(3) .mcopy,
          .mlist > li:nth-child(4) .mcopy{
            border-top: 1px solid color-mix(in oklab, var(--border), transparent 20%);
            padding-top: 12px;
          }
        }

        .mt{
          font-weight: 700;
          margin: 0;
          color: var(--text, #ECECEC);
          word-break: normal;
          overflow-wrap: anywhere;
        }
        .md{
          margin: 0;
          font-size: 14.5px;
          line-height: 1.6;
          color: var(--text-2, #A9A9B1);
          text-wrap: pretty;
        }

        /* === Анимации входа/выхода с ресетом (как в ProblemSolutionSection) === */
        .reveal{
          --rise: 22px;
          --skew: 0.3deg;
          --blur: 8px;
          opacity: 0;
          filter: blur(var(--blur));
          transform:
            translate3d(0, var(--rise), 0)
            scale(0.985)
            rotateX(0.0001deg)
            skewY(var(--skew));
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

        :global(#model .section__head){
          text-align:center;
          margin-left:auto; margin-right:auto;
          max-width: 980px;
        }
        :global(#model .section__head .kicker){ letter-spacing: .14em; }
        :global(#model .section__head h2){
          margin-left:auto; margin-right:auto;
          font-size: clamp(34px, 4.8vw, 56px);
          line-height: 1.02;
          letter-spacing: -0.01em;
          margin-bottom: 8px;
        }
        :global(#model .section__head .sub){
          font-size: clamp(15px, 2vw, 18px);
          color: var(--text-2);
          max-width: 880px;
          margin-left:auto; margin-right:auto;
          text-wrap: pretty;
        }
        :global(#model.section){
          margin-top: 72px;
          margin-bottom: 72px;
        }
        @media (max-width: 680px){
          :global(#model.section){
            margin-top: 60px;
            margin-bottom: 64px;
          }
        }
      `}</style>
    </Section>
  );
}
