// app/components/shared/cards/HeroDock.tsx
'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

type Props = { children: React.ReactNode };

/**
 * HeroDock — централизованный «apple-logic» контроллер:
 * 1) На старте — герой единственный и отцентрован по экрану.
 * 2) При скролле — мягкий возврат героя на своё место.
 * 3) Остальные секции плавно проявляются по прогрессу.
 */
export default function HeroDock({ children }: Props) {
  const wrapRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const wrap = wrapRef.current as HTMLElement | null;
    if (!wrap) return;

    const heroEl = wrap.querySelector<HTMLElement>('.hero');
    const topbar = document.querySelector<HTMLElement>('.topbar');
    const root = document.documentElement;

    if (!heroEl) return;

    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    const readVH = () => Math.max(480, window.innerHeight);
    const readTopbar = () => Math.round((topbar?.getBoundingClientRect().height ?? 72) + 8);

    let enterOffset = 0;   // расстояние, чтобы центрировать hero
    let startY = 0;        // точка начала возврата (в координатах страницы)
    let prevP = 0;         // сглаженный прогресс
    let raf = 0;

    const computeStart = () => {
      const vh = readVH();
      const dockTop = readTopbar();

      // Высота героя может прыгать при загрузке шрифтов/постера → измеряем надёжно
      const h = Math.max(220, Math.round(heroEl.offsetHeight || heroEl.getBoundingClientRect().height));
      enterOffset = Math.max(0, Math.round((vh - h) / 2 - dockTop));

      // высота контейнера: 1 экран + путь возврата (с запасом)
      const span = Math.max(40, enterOffset + 40);
      wrap.style.setProperty('--dock-top', `${dockTop}px`);
      wrap.style.setProperty('--dock-span', `${span}px`);

      // Абсолютная позиция секции
      const pageTop = wrap.getBoundingClientRect().top + window.scrollY;
      startY = Math.max(0, pageTop - dockTop);

      // первый расчёт
      tick(true);
    };

    const setVars = (p: number) => {
      // сглаживаем прогресс для мягкости (lerp)
      prevP += (p - prevP) * 0.18;
      if (Math.abs(prevP - p) < 0.002) prevP = p;

      const yPx = Math.round(enterOffset * (1 - prevP));
      const scale = 1.015 - 0.015 * prevP;

      wrap.style.setProperty('--dock-p', `${prevP}`);
      wrap.style.setProperty('--dock-y', `${yPx}px`);
      wrap.style.setProperty('--dock-scale', scale.toFixed(4));
      root.style.setProperty('--dock-p', `${prevP}`);
    };

    const tick = (force = false) => {
      const y = window.scrollY;
      const raw = enterOffset > 0 ? (y - startY) / enterOffset : 1;
      const p = clamp01(raw);
      setVars(p);

      if (force || Math.abs(prevP - p) > 0.001) {
        raf = requestAnimationFrame(() => tick(false));
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    // Единый пассивный слушатель скролла (без дубликатов из Hero)
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => tick(false)); };

    // Надёжные измерения: после шрифтов, после кадра, и при ресайзе
    let ro: ResizeObserver | null = null;

    const measureAll = () => {
      // два rAF подряд исключают «холодный» layout
      requestAnimationFrame(() => requestAnimationFrame(computeStart));
    };

    document.fonts?.ready
      .then(measureAll)
      .catch(measureAll);

    measureAll();

    ro = new ResizeObserver(measureAll);
    ro.observe(heroEl);
    if (topbar) ro.observe(topbar);

    window.addEventListener('resize', measureAll);
    window.addEventListener('orientationchange', measureAll);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', measureAll);
      window.removeEventListener('orientationchange', measureAll);
      window.removeEventListener('scroll', onScroll);
      ro?.disconnect();
      if (raf) cancelAnimationFrame(raf);
      root.style.removeProperty('--dock-p');
    };
  }, []);

  // Структура: sticky-контейнер держит Hero, всё остальное — ниже
  return (
    <section ref={wrapRef as any} className="dock">
      <div className="dock__sticky">
        {children}
      </div>
    </section>
  );
}
