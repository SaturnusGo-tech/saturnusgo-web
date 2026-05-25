"use client";

// components/investors/animated-rollout/RolloutPathAnimated.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

type Step = { label: string };

const DEFAULT_STEPS: Step[] = [
  { label: 'LATAM · Argentina' },
  { label: 'LATAM · Brazil' },
  { label: 'UAE' },
  { label: 'EU' },
];

type Props = {
  steps?: Step[];
  dotMs?: number;
  segMs?: number;
  loopPauseMs?: number;   // пауза после финальной точки, пока в зоне
  active?: boolean;       // управляет стартом/сбросом анимации
  className?: string;
  /** 'auto' — по умолчанию: следует за html.light или [data-tone='light'] */
  tone?: 'auto' | 'light' | 'dark';
};

export default function RolloutPathAnimated({
  steps = DEFAULT_STEPS,
  dotMs = 420,
  segMs = 700,
  loopPauseMs = 5000,
  active = false,
  className = '',
  tone = 'auto',
}: Props) {
  const n = steps.length;
  const [dotOn, setDotOn] = useState<boolean[]>(() => Array(n).fill(false));
  const [segP, setSegP] = useState<number[]>(() => Array(Math.max(0, n - 1)).fill(0));
  const [reduce, setReduce] = useState(false);
  const timers = useRef<number[]>([]);
  const [runKey, setRunKey] = useState(0); // перезапуск цикла пока активен

  // track reduce
  useEffect(() => {
    try {
      const m = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      setReduce(!!m?.matches);
    } catch {}
  }, []);

  // Сбрасываем прогресс
  const reset = () => {
    setDotOn(Array(n).fill(false));
    setSegP(Array(Math.max(0, n - 1)).fill(0));
  };
  const clearAll = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  // Главный эффект: управляем запуском/остановкой в зависимости от active
  useEffect(() => {
    clearAll();

    // ВНЕ зоны — мгновенно сбрасываем
    if (!active) {
      reset();
      return;
    }

    // В зоне:
    if (reduce || n === 0) {
      // Без анимаций показываем финальное состояние
      setDotOn(Array(n).fill(true));
      setSegP(Array(Math.max(0, n - 1)).fill(1));
      return;
    }

    // Анимированный прогон + луп, пока active === true
    reset();

    let t = 0;

    // dot[0]
    timers.current.push(
      window.setTimeout(() => {
        setDotOn((prev) => { const next = prev.slice(); next[0] = true; return next; });
      }, (t += dotMs)),
    );

    for (let i = 0; i < n - 1; i++) {
      // линия i→i+1
      timers.current.push(
        window.setTimeout(() => {
          setSegP((prev) => { const next = prev.slice(); next[i] = 1; return next; });
        }, (t += 80)),
      );
      t += segMs;

      // dot[i+1]
      timers.current.push(
        window.setTimeout(() => {
          setDotOn((prev) => { const next = prev.slice(); next[i + 1] = true; return next; });
        }, t),
      );

      if (i < n - 2) t += dotMs;
    }

    // После паузы перезапускаем цикл, если по-прежнему active
    timers.current.push(
      window.setTimeout(() => {
        if (active) setRunKey((k) => k + 1);
      }, (t += loopPauseMs)),
    );

    return clearAll;
    // runKey даёт непрерывный цикл, active — гейт
  }, [steps, dotMs, segMs, loopPauseMs, reduce, n, active, runKey]);

  const toneClass =
    tone === 'light' ? 'rollout--light' : tone === 'dark' ? 'rollout--dark' : 'rollout--auto';

  return (
    <div className={`rollout-path ${toneClass} ${className}`} aria-label="Animated rollout path">
      <ol className="path" role="list">
        {steps.map((s, i) => (
          <li key={i} className={`node ${dotOn[i] ? 'is-on' : ''}`}>
            <span className={`dot ${dotOn[i] ? 'is-on' : ''}`} aria-hidden />
            <span className="label">{s.label}</span>
            {i < steps.length - 1 && (
              <span className="seg" aria-hidden>
                <span className="seg__track" />
                <span className="seg__fill" style={{ ['--p' as any]: segP[i] }} />
              </span>
            )}
          </li>
        ))}
      </ol>

      <style jsx>{`
        .rollout-path {
          position: relative;
          width: 100%;
          max-width: 100%;
          border: 1px solid var(--stroke);
          border-radius: 10px;
          padding: 8px 10px;
          background: var(--bg, transparent);
          overflow: hidden;
          contain: layout paint; /* меньше дёрганий на скролле */

          /* размеры сегментов */
          --seg: 88px;   /* горизонтальный сегмент (десктоп) */
          --segY: 22px;  /* вертикальный сегмент (мобилка) */

          /* ===== ТЁМНЫЕ значения по умолчанию ===== */
          --txt: #e7e9ee;
          --stroke: rgba(255, 255, 255, 0.14);
          --dot-bg: rgba(255, 255, 255, 0.08);
          --dot-border: rgba(255, 255, 255, 0.35);
          --dot-on-bg: #ffffff;
          --dot-on-border: #ffffff;
          --dot-on-shadow: rgba(255, 255, 255, 0.16);
          --seg-track: rgba(255, 255, 255, 0.18);
          --seg-fill: #ffffff;
          --before-g1: rgba(255, 255, 255, 0.08);
          --before-g2: rgba(255, 255, 255, 0.18);
          --before-g3: rgba(255, 255, 255, 0.08);
        }

        /* Явно тёмная тема */
        .rollout-path.rollout--dark {
          --txt: #e7e9ee;
          --stroke: rgba(255, 255, 255, 0.14);
          --dot-bg: rgba(255, 255, 255, 0.08);
          --dot-border: rgba(255, 255, 255, 0.35);
          --dot-on-bg: #ffffff;
          --dot-on-border: #ffffff;
          --dot-on-shadow: rgba(255, 255, 255, 0.16);
          --seg-track: rgba(255, 255, 255, 0.18);
          --seg-fill: #ffffff;
          --before-g1: rgba(255, 255, 255, 0.08);
          --before-g2: rgba(255, 255, 255, 0.18);
          --before-g3: rgba(255, 255, 255, 0.08);
        }

        /* Явно светлая тема */
        .rollout-path.rollout--light {
          --txt: #0f172a;
          --stroke: rgba(2, 6, 23, 0.14);
          --dot-bg: rgba(2, 6, 23, 0.06);
          --dot-border: rgba(2, 6, 23, 0.28);
          --dot-on-bg: #0f172a;
          --dot-on-border: #0f172a;
          --dot-on-shadow: rgba(2, 6, 23, 0.12);
          --seg-track: rgba(2, 6, 23, 0.16);
          --seg-fill: #0f172a;
          --before-g1: rgba(2, 6, 23, 0.06);
          --before-g2: rgba(2, 6, 23, 0.14);
          --before-g3: rgba(2, 6, 23, 0.06);
        }

        /* AUTO: следует за html.light или [data-tone='light'] на предке */
        :global(html.light) .rollout-path.rollout--auto,
        :global([data-tone='light']) .rollout-path.rollout--auto {
          --txt: #0f172a;
          --stroke: rgba(2, 6, 23, 0.14);
          --dot-bg: rgba(2, 6, 23, 0.06);
          --dot-border: rgba(2, 6, 23, 0.28);
          --dot-on-bg: #0f172a;
          --dot-on-border: #0f172a;
          --dot-on-shadow: rgba(2, 6, 23, 0.12);
          --seg-track: rgba(2, 6, 23, 0.16);
          --seg-fill: #0f172a;
          --before-g1: rgba(2, 6, 23, 0.06);
          --before-g2: rgba(2, 6, 23, 0.14);
          --before-g3: rgba(2, 6, 23, 0.06);
        }

        .rollout-path::before{
          content:""; position:absolute; left:-12px; top:0; bottom:0; width:1px;
          background: linear-gradient(180deg, var(--before-g1), var(--before-g2), var(--before-g3));
        }

        .path{
          margin:0; padding:0; list-style:none;
          display:flex; flex-direction:row; align-items:center; gap:14px; flex-wrap:nowrap;
          min-width: 0;
        }

        .node{
          display:grid; grid-template-columns: 26px auto var(--seg);
          align-items:center; gap:10px;
          min-width: 0;
        }
        .node:last-child{ grid-template-columns: 26px auto; }

        .dot{
          width:26px; height:26px; border-radius:50%;
          border:1px solid var(--dot-border);
          background: var(--dot-bg);
          transition: background 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
          box-shadow: 0 0 0 0 var(--dot-on-shadow);
          will-change: transform, box-shadow;
        }
        .dot.is-on{
          background: var(--dot-on-bg);
          border-color: var(--dot-on-border);
          box-shadow: 0 0 0 4px var(--dot-on-shadow);
        }

        .label{
          color: var(--txt);
          font-size:13.5px; font-weight:700; line-height:1.25; white-space:nowrap;
          min-width: 0;
        }

        .seg{ position:relative; width:var(--seg); height:2px; display:inline-flex; align-items:center; }
        .seg__track{ position:absolute; inset:0; background: var(--seg-track); }
        .seg__fill{
          position:absolute; inset:0; background: var(--seg-fill);
          transform: scaleX(var(--p)); transform-origin: left center;
          transition: transform ${segMs}ms ease;
          will-change: transform;
        }

        /* ===== МОБИЛЬНАЯ ВЕРСИЯ: вертикальная дорожка ===== */
        @media (max-width: 680px){
          .rollout-path{ --segY: 18px; }
          .rollout-path::before{ display:none; } /* декоративная линия не нужна */

          .path{
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .node{
            grid-template-columns: 26px 1fr;              /* точка + текст */
            grid-template-rows: auto var(--segY);         /* сегмент под узлом */
            column-gap: 10px;
            row-gap: 6px;
          }
          .node:last-child{ grid-template-rows: auto; }   /* без нижнего сегмента */

          .label{
            grid-column: 2; grid-row: 1;
            white-space: normal;               /* переносы включены */
            overflow-wrap: anywhere;
            word-break: break-word;
            hyphens: auto;
          }

          .dot{
            grid-column: 1; grid-row: 1;
            justify-self: center;
          }

          .seg{
            grid-column: 1; grid-row: 2;
            width: 2px; height: var(--segY);
            justify-self: center;
          }
          .seg__fill{
            transform: scaleY(var(--p));       /* вертикальная анимация */
            transform-origin: center top;
          }
        }

        /* reduce motion: отключаем плавность заливки */
        @media (prefers-reduced-motion: reduce){
          .seg__fill{ transition: none !important; }
        }
      `}</style>
    </div>
  );
}
