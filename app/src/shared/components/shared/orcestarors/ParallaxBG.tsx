// app/components/shared/orcestarors/ParallaxBG.tsx
'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Production RAIL parallax:
 * - никаких чтений layout в rAF-цикле
 * - запись transform только в 2 слоя
 * - единый rAF который стартует по инпуту и останавливается по settle
 * - passive listeners; pointermove только там, где это уместно
 * - пауза на hidden и при prefers-reduced-motion
 * - безопасный teardown (AbortController)
 */
export default function ParallaxBG() {
  const pathname = usePathname();
  const isTms = /^\/testcases(?:\/|$)/i.test(pathname || '');
  const farRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTms) return;

    // уважение предпочтений пользователя
    const mReduced = matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mReduced?.matches) return;

    const far = farRef.current;
    const near = nearRef.current;
    if (!far || !near) return;

    // coarse-поверхности (тач) — отключаем pointer-повороты
    const mCoarse = matchMedia?.('(hover: none) and (pointer: coarse)');
    const enablePointerTilt = !mCoarse?.matches;

    // текущие значения
    let y1 = 0, y2 = 0, rx = 0, ry = 0;
    // таргеты
    let ty1 = 0, ty2 = 0, trx = 0, try_ = 0;

    // центр для нормализации указателя
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;

    let rafId = 0;
    let running = false;
    let lastActiveAt = 0;

    const start = () => {
      lastActiveAt = performance.now();
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(loop);
      }
    };

    const onScroll = () => {
      // только запись в таргеты (px)
      const s =
        window.scrollY ??
        document.scrollingElement?.scrollTop ??
        document.documentElement.scrollTop ??
        0;

      ty1 = s * 0.05;   // дальний слой
      ty2 = s * -0.03;  // ближний слой
      start();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!enablePointerTilt) return;
      // нормализация в диапазон [-1..1]
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;

      // таргеты поворота (deg)
      trx = dy * -3; // tilt X
      try_ = dx *  4; // tilt Y
      start();
    };

    const onResize = () => {
      cx = window.innerWidth / 2;
      cy = window.innerHeight / 2;
      // лёгкий «пинок», чтобы пересчитаться плавно
      start();
    };

    const loop = () => {
      // critically-damped easing
      const k = 0.08;
      y1 += (ty1 - y1) * k;
      y2 += (ty2 - y2) * k;
      rx += (trx - rx) * k;
      ry += (try_ - ry) * k;

      // единственная запись — transform
      // (toFixed(2) для стабилизации строк и предотвращения «дрожи»)
      far.style.transform  =
        `translate3d(0, ${y1.toFixed(2)}px, 0) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      near.style.transform =
        `translate3d(0, ${y2.toFixed(2)}px, 0) rotateX(${(rx * 0.6).toFixed(2)}deg) rotateY(${(ry * 0.6).toFixed(2)}deg)`;

      // критерий «успокоения»
      const settled =
        Math.abs(ty1 - y1) +
        Math.abs(ty2 - y2) +
        Math.abs(trx - rx) +
        Math.abs(try_ - ry) < 0.15;

      const justActive = performance.now() - lastActiveAt < 120;

      if (!settled || justActive) {
        rafId = requestAnimationFrame(loop);
      } else {
        running = false;
        rafId = 0;
      }
    };

    // безопасная отписка (одним абортом)
    const ac = new AbortController();
    const opt = { passive: true, signal: ac.signal } as AddEventListenerOptions;

    window.addEventListener('scroll', onScroll, opt);
    window.addEventListener('resize', onResize, opt);
    window.addEventListener('pointermove', onPointerMove, opt);

    const onVis = () => {
      if (document.visibilityState === 'hidden' && rafId) {
        cancelAnimationFrame(rafId);
        running = false;
        rafId = 0;
      }
    };
    document.addEventListener('visibilitychange', onVis, ac as any);

    // первичный запуск
    onScroll();

    return () => {
      ac.abort();
      document.removeEventListener('visibilitychange', onVis);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isTms]);

  if (isTms) return null;

  return (
    <>
      <div ref={farRef}  className="bg-par bg-par--far"  aria-hidden />
      <div ref={nearRef} className="bg-par bg-par--near" aria-hidden />
    </>
  );
}
