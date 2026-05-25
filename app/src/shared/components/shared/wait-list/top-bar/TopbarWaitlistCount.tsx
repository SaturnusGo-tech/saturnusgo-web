// app/components/shared/wait-list/TopbarWaitlistCount.tsx
'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import useWaitlistCount from '../hooks/useWaitlistCount';

type Props = {
  apiBase?: string;
  refreshIntervalMs?: number;
  immediate?: boolean;
  locales?: string | string[];
  numberFormat?: Intl.NumberFormatOptions;
};

export default function TopbarWaitlistCount({
  apiBase,
  refreshIntervalMs,
  immediate,
  locales = 'en-US',
  numberFormat,
}: Props) {
  const { count, loading } = useWaitlistCount({ apiBase, refreshIntervalMs, immediate });
  const animated = useAnimatedInt(count ?? 0, 450);
  const nf = useMemo(() => new Intl.NumberFormat(locales, numberFormat), [locales, numberFormat]);
  const display = count === null ? '—' : nf.format(animated);

  return (
    <span
      className="tb-wl"
      aria-live="polite"
      data-loading={loading ? 'true' : 'false'}
      title={count === null ? 'Loading…' : `${display} on the waitlist`}
    >
      <span className="tb-wl__dot" aria-hidden />
      <span className="tb-wl__num"> ~ {display}</span>
      <span className="tb-wl__label">on the waitlist</span>

      <style jsx>{`
        .tb-wl{
          display:inline-flex; align-items:center; gap:8px;
          margin-left:10px; padding:6px 10px; border-radius:999px;
          font-size:12px; line-height:1; font-variant-numeric: tabular-nums;
          background: rgba(22,22,24,0.42);
          color: rgba(255,255,255,0.92);
          border: 1px solid rgba(255,255,255,0.14);
          backdrop-filter: blur(10px) saturate(1.1);
          vertical-align: middle;
        }
        @media (max-width: 640px){
          .tb-wl{ gap:6px; padding:6px 8px; }
          .tb-wl__label{ display:none; }  /* скрываем подпись, оставляем цифру */
          .tb-wl__num{ font-weight:700; }
        }
        .tb-wl[data-loading="true"]{ opacity:.7; }
        .tb-wl__dot{
          width:6px; height:6px; border-radius:50%;
          background:#7cffb4; box-shadow:0 0 0 4px rgba(124,255,180,0.12);
          position:relative; flex:0 0 6px;
        }
        .tb-wl__dot::after{
          content:''; position:absolute; inset:-2px; border-radius:50%;
          border:2px solid rgba(124,255,180,0.35);
          animation: ping 1.6s ease-out infinite;
        }
        @keyframes ping{
          0%{ transform: scale(1); opacity:.9; }
          80%{ transform: scale(1.8); opacity:0; }
          100%{ transform: scale(1.8); opacity:0; }
        }
        .tb-wl__num{ font-weight:700; letter-spacing:.2px; }
        .tb-wl__label{ color: rgba(255,255,255,0.72); }
      `}</style>
    </span>
  );
}

// локальная анимация целого числа
function useAnimatedInt(target: number, duration = 450){
  const [val, setVal] = useState<number>(target);
  const fromRef = useRef<number>(target);
  useEffect(() => {
    const from = fromRef.current ?? 0;
    const to = target;
    if (from === to) { setVal(to); return; }
    fromRef.current = to;

    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = Math.round(from + (to - from) * eased);
      setVal(cur);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}
