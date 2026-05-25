"use client";

// core-investors CTA section
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Section from '../../../items/section';
import Link from 'next/link';

export default function CtaSection({ onOpenDeck }: { onOpenDeck?: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);

  const triggerOpenDeck = useCallback(() => {
    if (onOpenDeck) {
      onOpenDeck();
    } else {
      window.dispatchEvent(new Event('open-deck'));
    }
  }, [onOpenDeck]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const items = Array.from(wrap.querySelectorAll<HTMLDivElement>('.cta-item'));

    if (prefersReduced) {
      items.forEach((el) => el.classList.add('reveal-in'));
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
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    );
    gateObs.observe(wrap);

    const itemObs = new IntersectionObserver(
      (entries) => {
        if (!armed) return;
        for (const entry of entries) {
          const el = entry.target as HTMLDivElement;
          if (entry.isIntersecting) {
            el.classList.add('reveal-in');
            itemObs.unobserve(el);
          }
        }
      },
      { threshold: 0.3, rootMargin: '0px 0px -6% 0px' }
    );

    items.forEach((el, i) => {
      el.style.setProperty('--i', String(i));
      itemObs.observe(el);
    });

    return () => {
      gateObs.disconnect();
      itemObs.disconnect();
    };
  }, [armed]);

  return (
    <Section
      id="cta"
      kicker="Next steps"
      title="Deck, data points, and call"
      subtitle="Review the deck, browse key metrics, or request a focused walkthrough."
    >
      <div ref={wrapRef} className="cta-wrap">
        <div className="cta-row" role="group" aria-label="CTA">
          {/* ⬇️ left button removed per request */}

          <div className="cta-item dir-c">
            <button
              type="button"
              className="btn btn-primary"
              onClick={triggerOpenDeck}
              aria-haspopup="dialog"
            >
              Open Deck (PDF)
            </button>
          </div>

          {/* ⬇️ About founder — сразу справа от Open Deck */}
          <div className="cta-item dir-r">
            <Link href="/founder" className="btn btn--cta-secondary" aria-label="About founder" title="About founder">
              About founder
            </Link>
          </div>

          <div className="cta-item dir-r">
            <a className="btn" href="/#waitlist">Request early access</a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cta-wrap {
          display: grid;
          gap: 24px;
          justify-items: start;
          text-align: left;
        }

        .cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: flex-start;
          align-items: center;
        }

        .cta-item {
          will-change: transform, opacity, filter;
          backface-visibility: hidden;
          transform-style: preserve-3d;
          opacity: 0;
          filter: blur(8px);
          transform: translate3d(0,16px,0) scale(.985);
          transition:
            opacity 640ms ease-out,
            filter 640ms ease-out,
            transform 640ms cubic-bezier(.22,.61,.36,1);
          transition-delay: 0ms;
        }

        .cta-item.dir-r { transform: translate3d(28px, 10px, 0) scale(.985); }
        .cta-item.dir-c { transform: translate3d(0, 22px, 0) scale(.98); }

        .cta-item.reveal-in {
          opacity: 1;
          filter: blur(0px);
          transform: translate3d(0,0,0) scale(1);
        }

        /* вторичная CTA-пилюля в тёмной теме с градиентной обводкой (соразмерна тексту) */
        .btn--cta-secondary{
          height:38px; padding:0 14px; border-radius:10px;
          display:inline-flex; align-items:center; justify-content:center;
          font-weight:600; line-height:1; white-space:nowrap;
          background:
            linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04)) padding-box,
            linear-gradient(135deg, #6a8bff66, #50e3c266) border-box;
          border:1px solid transparent; background-clip: padding-box, border-box;
          color: rgba(255,255,255,0.98);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.06) inset,
            0 10px 28px rgba(0,0,0,0.24),
            0 0 14px rgba(104,170,255,.18);
          transition: transform .14s ease, box-shadow .18s ease, background .22s ease, filter .18s ease;
        }
        .btn--cta-secondary:hover{
          transform: translateY(-1px);
          background:
            linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.06)) padding-box,
            linear-gradient(135deg, #7a97ff88, #67f0d388) border-box;
          box-shadow:
            0 1px 0 rgba(255,255,255,0.08) inset,
            0 12px 32px rgba(0,0,0,0.30),
            0 0 22px rgba(104,170,255,.25);
          filter: brightness(1.02);
        }
        .btn--cta-secondary:active{
          transform: translateY(0);
        }

        @media (min-width: 980px) {
          .cta-item { transition-delay: calc(var(--i, 0) * 50ms); }
        }

        @media (prefers-reduced-motion: reduce) {
          .cta-item, .cta-item.reveal-in {
            transition: none !important;
            transform: none !important;
            filter: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </Section>
  );
}
