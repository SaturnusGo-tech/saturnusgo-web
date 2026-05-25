// app/components/shared/wait-list/WaitlistCounter.tsx
'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import useWaitlistCount from '../hooks/useWaitlistCount';

type Props = {
  className?: string;
  label?: string;                 // подпись справа от числа
  apiBase?: string;
  refreshIntervalMs?: number;
  immediate?: boolean;
  locales?: string | string[];
  numberFormat?: Intl.NumberFormatOptions;
  hidePulse?: boolean;
};

export default function WaitlistCounter({
  className,
  label = 'on the waitlist',
  apiBase,
  refreshIntervalMs,
  immediate,
  locales = 'en-US',
  numberFormat,
  hidePulse = false,
}: Props) {
  const { count, loading } = useWaitlistCount({ apiBase, refreshIntervalMs, immediate });

  // тема → data-tone (light|dark)
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const tone = mounted && resolvedTheme === 'light' ? 'light' : 'dark';

  // плавная анимация числа
  const animated = useAnimatedInt(count ?? 0, 600);
  const nf = useMemo(() => new Intl.NumberFormat(locales, numberFormat), [locales, numberFormat]);
  const display = count === null ? '—' : nf.format(animated);

  return (
    <div
      className={`wf-counter${className ? ' ' + className : ''}`}
      aria-live="polite"
      data-loading={loading ? 'true' : 'false'}
      data-tone={tone}
      title={count === null ? 'Loading…' : `${display} on the waitlist`}
    >
      {!hidePulse && <span className="wf-counter__dot" aria-hidden />}
      <span className="wf-counter__num" aria-label="People on the waitlist">
        ~ {display}
      </span>
      <span className="wf-counter__label">{label}</span>

      <style jsx>{`
        /* ===== Тон-зависимые токены ===== */
        .wf-counter {
          /* dark (default) */
          --chip-bg: rgba(22,22,24,0.45);
          --chip-border: rgba(255,255,255,0.14);
          --chip-fg: rgba(255,255,255,0.92);
          --chip-fg-2: rgba(255,255,255,0.72);
          --chip-shadow: 0 10px 28px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(255,255,255,0.06);

          /* индикатор (пульс-точка) */
          --dot-fill: #7cffb4;
          --dot-ring: rgba(124,255,180,0.35);
          --dot-glow: rgba(124,255,180,0.12);

          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 999px;
          background: var(--chip-bg);
          border: 1px solid var(--chip-border);
          backdrop-filter: blur(12px) saturate(1.15);
          box-shadow: var(--chip-shadow);
          color: var(--chip-fg);
          font-size: 14px;
          line-height: 1;
          font-variant-numeric: tabular-nums;
          user-select: none;

          /* как просил — сдвиг */
          transform: translateY(-10px);
        }

        .wf-counter[data-tone='light'] {
          /* light override — повышаем контраст и читаемость на светлом фоне */
          --chip-bg: rgba(255,255,255,0.85);
          --chip-border: rgba(2,6,23,0.12);
          --chip-fg: #0f172a;   /* slate-900 */
          --chip-fg-2: #475569; /* slate-600 */
          --chip-shadow: 0 10px 24px rgba(2,6,23,0.08), inset 0 0 0 1px rgba(255,255,255,0.66);

          /* точка — темнее, чтобы не терялась */
          --dot-fill: #059669;                 /* emerald-600 */
          --dot-ring: rgba(5,150,105,0.30);    /* контур/пульсация */
          --dot-glow: rgba(5,150,105,0.16);    /* мягкое свечение */
        }

        .wf-counter[data-loading="true"] { opacity: .7; }

        .wf-counter__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--dot-fill);
          box-shadow: 0 0 0 6px var(--dot-glow);
          position: relative;
          flex: 0 0 auto;
        }
        .wf-counter__dot::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          border: 2px solid var(--dot-ring);
          animation: ping 1.6s ease-out infinite;
        }

        @keyframes ping {
          0%   { transform: scale(1);   opacity: .9; }
          80%  { transform: scale(1.8); opacity: 0;  }
          100% { transform: scale(1.8); opacity: 0;  }
        }

        .wf-counter__num { font-weight: 700; letter-spacing: .2px; color: var(--chip-fg); }
        .wf-counter__label { color: var(--chip-fg-2); }
      `}</style>
    </div>
  );
}

/** Локальный хук для плавной анимации числа */
function useAnimatedInt(target: number, duration = 600){
  const ReactRef = (React as any).useRef as typeof React.useRef;
  const ReactState = (React as any).useState as typeof React.useState;
  const ReactEffect = (React as any).useEffect as typeof React.useEffect;

  const [val, setVal] = ReactState<number>(target);
  const lastTargetRef = ReactRef<number>(target);

  ReactEffect(() => {
    const from = lastTargetRef.current ?? 0;
    const to = target;
    if (from === to) { setVal(to); return; }
    lastTargetRef.current = to;

    let raf = 0;
    const start = performance.now();

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const cur = Math.round(from + (to - from) * eased);
      setVal(cur);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return val;
}
