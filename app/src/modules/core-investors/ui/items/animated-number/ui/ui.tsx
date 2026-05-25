"use client";

// core-investors animated number
'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  from?: number;
  to: number;
  duration?: number; // ms
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  ariaLabel?: string;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function AnimatedNumber({
  from = 0,
  to,
  duration = 1400,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  ariaLabel,
}: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [val, setVal] = useState<number>(from);
  const started = useRef(false);

  // запускаем только когда элемент попал в вьюпорт
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setVal(to);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - t0) / duration);
            const eased = easeOutCubic(p);
            setVal(from + (to - from) * eased);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.25 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [from, to, duration]);

  // аккуратно форматируем: 2.1T, 185B, 110M и т.п.
  const formatAbbrev = (n: number) => {
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(decimals)}T`;
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(decimals)}B`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(decimals)}M`;
    if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(decimals)}K`;
    return `${sign}${abs.toFixed(decimals)}`;
  };

  return (
    <span
      ref={ref}
      className={`animated-number ${className}`}
      aria-label={ariaLabel ?? `${prefix}${formatAbbrev(to)}${suffix}`}
    >
      {prefix}
      {formatAbbrev(val)}
      {suffix}
      <style jsx>{`
        .animated-number {
          transition: text-shadow 240ms ease;
          will-change: contents;
        }
      `}</style>
    </span>
  );
}
