"use client";

// components/investors/ProblemSolutionSection.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import Section from '../../../items/section';

type PSItem = {
  title: string;
  problem: string | string[];
  solution: string | string[];
  tag?: string;
};

const ITEMS: PSItem[] = [
  {
    tag: 'Payments',
    title: 'Payments fail in many markets',
    problem: [
      'Millions of users cannot pay for rides or bookings: cards are declined, providers unsupported.',
      'A failed payment = a failed trip and broken trust.',
    ],
    solution: [
      'Local payment methods and saved cards (PCI) for reliable transactions.',
      'In-app balance and fallback payment routes for resilience.',
    ],
  },
  {
    tag: 'Unification',
    title: 'Mobility is fragmented',
    problem: [
      'Users juggle 3–5 apps: rides, hotels, places, events, wallets.',
      'Flows break between services → wasted time, money, conversion.',
    ],
    solution: [
      'One platform: rides, bookings, places, events, wallet, and loyalty.',
      'Unified UX reduces hops and lifts conversion.',
    ],
  },
  {
    tag: 'Places',
    title: 'Places are scattered and offline',
    problem: [
      'Users save places in random maps, notes, or screenshots.',
      'No integration with rides, bookings, or planning.',
    ],
    solution: [
      'PlaceHub: one hub for saving, sharing, and reusing locations.',
      'B2B2C: venues, events, and merchants plug directly into user flows.',
    ],
  },
  {
    tag: 'Planning',
    title: 'Smart planning is missing',
    problem: [
      'Weekend trips and getaways are manual and error-prone.',
      'Routes, timing, and bookings must be stitched together.',
    ],
    solution: [
      'Built-in AI planning: routes, timing, availability — in real time.',
      'Wishlists and weekend kits turn ideas into coordinated trips.',
    ],
  },
  {
    tag: 'Finance',
    title: 'No financial visibility',
    problem: [
      'No unified view of spend across rides, hotels, places, and events.',
      'Hard to optimize payments or manage limits.',
    ],
    solution: [
      'Single financial dashboard: categories, limits, controls.',
      'Optimized payment routing and rewards to cut effective cost.',
    ],
  },
  {
    tag: 'Loyalty',
    title: 'Loyalty is broken',
    problem: [
      'Transactions are isolated; no cross-service value.',
      'No reason to stay within one ecosystem.',
    ],
    solution: [
      'Unified loyalty across rides, hotels, places, and events.',
      'Subscriptions and tiers that build retention and stickiness.',
    ],
  },
];

export default function ProblemSolutionSection() {
  const wrapRef = useRef<HTMLDivElement>(null);

  // theme
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const tone: 'light' | 'dark' = mounted && resolvedTheme === 'light' ? 'light' : 'dark';

  // staged reveal
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const items = Array.from(wrap.querySelectorAll<HTMLElement>('.ps-item'));

    if (prefersReduced) {
      items.forEach(el => el.classList.add('reveal-in'));
      setArmed(true);
      return;
    }

    const gateObs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setArmed(true);
      },
      { threshold: 0.01, rootMargin: '0px 0px -1px 0px' }
    );
    gateObs.observe(wrap);

    return () => gateObs.disconnect();
  }, []);

  useEffect(() => {
    if (!armed) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    const items = Array.from(wrap.querySelectorAll<HTMLElement>('.ps-item'));
    const itemObs = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            el.classList.add('reveal-in');
          } else if (entry.intersectionRatio === 0) {
            el.classList.remove('reveal-in');
          }
        }
      },
      { threshold: [0, 0.15, 0.35], rootMargin: '0px 0px -2% 0px' }
    );

    items.forEach((el, i) => {
      el.style.setProperty('--i', String(i));
      el.classList.add('reveal', i % 2 ? 'dir-r' : 'dir-l');
      itemObs.observe(el);
    });

    return () => itemObs.disconnect();
  }, [armed]);

  return (
    <Section
      id="problem"
      kicker="Problem → Solution"
      title="5 apps for 1 trip → broken journeys."
      subtitle="SaturnusGo: one platform for rides, hotels, places, and events — unified by AI planning and loyalty."
    >
      <div className="ps" data-tone={tone}>
        <div
          ref={wrapRef}
          className="ps-wrap"
          role="region"
          aria-label="Problem to solution mapping"
        >
          {ITEMS.map((it, i) => (
            <article
              className="ps-item"
              key={i}
              role="article"
              aria-labelledby={`ps-title-${i}`}
              tabIndex={0}
            >
              <header className="ps-head">
                <span className="ps-tag" aria-label={`Category: ${it.tag ?? 'General'}`}>
                  {it.tag}
                </span>
                <h3 className="ps-title" id={`ps-title-${i}`}>{it.title}</h3>
                <div className="ps-rail" aria-hidden="true" />
              </header>

              <div className="ps-rows">
                <div className="ps-row is-problem" aria-label="Problem">
                  <span className="badge badge-p">Problem</span>
                  {Array.isArray(it.problem) ? (
                    <ul className="ps-list" aria-label="Problem points">
                      {it.problem.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="ps-text">{it.problem}</p>
                  )}
                </div>

                <div className="ps-row is-solution" aria-label="Solution">
                  <span className="badge badge-s">Solution</span>
                  {Array.isArray(it.solution) ? (
                    <ul className="ps-list" aria-label="Solution points">
                      {it.solution.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="ps-text">{it.solution}</p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style jsx>{`
        /* =========================================================
           INVESTOR 2025 TOKENS (dark-first, light supported)
           Glass + soft neumorphism; no hover effects
           ========================================================= */
        .ps {
          --fg: var(--text, #e6e7ea);
          --fg-2: var(--text-2, #a2a9b3);
          --stroke: var(--border, rgba(255,255,255,0.08));

          --surface-1: color-mix(in oklab, #0b0d10 94%, white 6%);
          --surface-2: color-mix(in oklab, #0b0d10 96%, white 4%);
          --glass: rgba(255,255,255,0.03);

          --acc-start: #1b2a35;
          --acc-end:   #3a5468;

          --soft: 0 1px 0 rgba(255,255,255,0.04) inset, 0 -1px 0 rgba(0,0,0,0.22) inset;
          --glow: 0 0 0 1px var(--stroke), 0 20px 60px rgba(0,0,0,0.45);

          --badge-p-bg: rgba(239, 68, 68, 0.14);
          --badge-p-fg: rgba(255, 255, 255, 0.92);
          --badge-p-st: rgba(239, 68, 68, 0.35);

          --badge-s-bg: rgba(34, 197, 94, 0.14);
          --badge-s-fg: rgba(255, 255, 255, 0.92);
          --badge-s-st: rgba(34, 197, 94, 0.35);
        }

        .ps[data-tone='light'],
        :global(html.light) .ps {
          --fg: #0f172a;
          --fg-2: #475569;
          --stroke: rgba(2, 6, 23, 0.10);

          --surface-1: #ffffff;
          --surface-2: #f8fafc;
          --glass: rgba(2,6,23,0.04);

          --acc-start: #dbe6f5;
          --acc-end:   #c7d7eb;

          --soft: 0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(0,0,0,0.05) inset;
          --glow: 0 0 0 1px var(--stroke), 0 18px 50px rgba(15, 23, 42, 0.10);

          --badge-p-bg: #fee2e2;
          --badge-p-fg: #991b1b;
          --badge-p-st: #fecaca;

          --badge-s-bg: #dcfce7;
          --badge-s-fg: #166534;
          --badge-s-st: #bbf7d0;
        }

        /* =========================================================
           LAYOUT
           ========================================================= */
        .ps-wrap {
          display: grid;
          gap: 16px;
        }

        .ps-item {
          position: relative;
          display: grid;
          gap: 14px;
          padding: 16px;
          border-radius: 28px;
          border: 1px solid var(--stroke);
          background:
            linear-gradient(180deg, var(--glass), transparent) ,
            var(--surface-1);
          box-shadow: var(--glow);
          outline: none;
        }
        .ps-item:focus-visible {
          box-shadow: 0 0 0 2px color-mix(in oklab, var(--acc-end), white 10%) inset, var(--glow);
        }

        .ps-head {
          display: grid;
          gap: 8px;
          position: relative;
        }

        .ps-tag {
          width: fit-content;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border: 1px solid var(--stroke);
          border-radius: 999px;
          padding: 3px 8px;
          background: color-mix(in oklab, var(--surface-1), white 4%);
          color: var(--fg-2);
        }

        .ps-title {
          margin: 0;
          color: var(--fg);
          font-weight: 800;
          letter-spacing: -0.01em;
          line-height: 1.25;
          font-size: clamp(16px, 1.6vw, 20px);
        }

        .ps-rail {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--acc-start), var(--acc-end), transparent);
          opacity: .35;
        }

        .ps-rows {
          display: grid;
          gap: 12px;
        }

        .ps-row {
          position: relative;
          display: grid;
          gap: 8px;
          padding: 12px;
          border: 1px solid var(--stroke);
          border-radius: 22px;
          background:
            linear-gradient(180deg, var(--glass), transparent),
            var(--surface-2);
          box-shadow: var(--soft);
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 520ms ease-out, transform 520ms cubic-bezier(0.22, 0.61, 0.36, 1);
        }

        .ps-row.is-problem { border-left: 3px solid color-mix(in oklab, #ef4444 80%, transparent); }
        .ps-row.is-solution { border-left: 3px solid color-mix(in oklab, #22c55e 80%, transparent); }

        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 20px;
          padding: 0 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          line-height: 1;
          width: max-content;
          place-self: start;
          border: 1px solid transparent;
        }
        .badge-p { background: var(--badge-p-bg); color: var(--badge-p-fg); border-color: var(--badge-p-st); }
        .badge-s { background: var(--badge-s-bg); color: var(--badge-s-fg); border-color: var(--badge-s-st); }

        .ps-text {
          margin: 0;
          color: var(--fg);
          font-size: 14px;
          line-height: 1.5;
        }

        .ps-list {
          margin: 0;
          padding-left: 16px;
          display: grid;
          gap: 5px;
          color: var(--fg);
        }
        .ps-list li {
          line-height: 1.5;
          font-size: 14px;
        }

        @media (min-width: 980px) {
          .ps-item { padding: 18px; }
          .ps-rows {
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }
          .ps-row { min-height: 100%; }
        }

        /* =========================================================
           ANIMATION: deterministic staged reveal
           ========================================================= */
        .reveal {
          --rise: 18px;
          --blur: 8px;
          opacity: 0;
          filter: blur(var(--blur));
          transform: translate3d(0, var(--rise), 0) scale(0.985);
          transition:
            opacity 640ms ease-out,
            filter 640ms ease-out,
            transform 640ms cubic-bezier(0.22, 0.61, 0.36, 1);
          will-change: transform, opacity, filter;
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }
        .reveal.dir-l { transform: translate3d(-14px, var(--rise), 0) scale(0.985); }
        .reveal.dir-r { transform: translate3d( 14px, var(--rise), 0) scale(0.985); }

        @media (min-width: 980px) {
          .reveal { transition-delay: calc(var(--i, 0) * 35ms); }
        }

        .reveal.reveal-in {
          opacity: 1;
          filter: blur(0);
          transform: translate3d(0, 0, 0) scale(1);
        }
        .reveal.reveal-in .ps-row.is-problem {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 90ms;
        }
        .reveal.reveal-in .ps-row.is-solution {
          opacity: 1;
          transform: translateY(0);
          transition-delay: 170ms;
        }

        @media (prefers-reduced-motion: reduce) {
          .reveal,
          .reveal.reveal-in,
          .ps-row,
          .reveal.reveal-in .ps-row {
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
