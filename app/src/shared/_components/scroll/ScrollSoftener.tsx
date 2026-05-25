'use client';
import { useEffect } from 'react';

type Props = {
  /** Порог, после которого считаем событие «резким» (px после нормализации) */
  threshold?: number;
  /** Сколько максимум пикселей скроллить за один перехваченный импульс */
  cap?: number;
  /** Длительность сглаживания резкого импульса (мс) */
  duration?: number;
  /** Не трогать вложенные скролл-контейнеры (списки, модалки и т.п.) */
  respectInnerScrolls?: boolean;
};

export default function ScrollSpikeGuard({
  threshold = 240,
  cap = 420,
  duration = 220,
  respectInnerScrolls = true,
}: Props) {
  useEffect(() => {
    // уважение prefers-reduced-motion и мобильных (своя физика скролла)
    const prm = matchMedia?.('(prefers-reduced-motion: reduce)');
    if (prm?.matches) return;
    const coarse = matchMedia?.('(hover: none) and (pointer: coarse)');
    if (coarse?.matches) return;

    const root = document.scrollingElement || document.documentElement;

    let raf = 0;
    let start = 0;
    let fromY = 0;
    let toY = 0;

    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
    const maxScroll = () => Math.max(0, root.scrollHeight - window.innerHeight);

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const isInsideScrollableY = (el: Element | null) => {
      if (!respectInnerScrolls) return false;
      while (el && el !== document.body) {
        const h = el as HTMLElement;
        const s = getComputedStyle(h);
        const oy = s.overflowY;
        const canY = (oy === 'auto' || oy === 'scroll') && h.scrollHeight > h.clientHeight;
        if (canY) return true;
        el = el.parentElement;
      }
      return false;
    };

    const normalizeDeltaY = (e: WheelEvent) => {
      // 0=pixel, 1=line (~16px), 2=page (высота вьюпорта)
      if (e.deltaMode === 1) return e.deltaY * 16;
      if (e.deltaMode === 2) return e.deltaY * window.innerHeight;
      return e.deltaY;
    };

    const animateTo = (target: number) => {
      if (raf) cancelAnimationFrame(raf);
      fromY = window.scrollY;
      toY = clamp(target, 0, maxScroll());
      start = performance.now();

      const tick = (t: number) => {
        const p = clamp((t - start) / duration, 0, 1);
        const y = fromY + (toY - fromY) * easeOutCubic(p);
        window.scrollTo(0, y);
        if (p < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          raf = 0;
        }
      };
      raf = requestAnimationFrame(tick);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.defaultPrevented) return;
      if (e.ctrlKey) return; // браузерный зум
      const tgt = e.target as Element | null;
      if (tgt && (tgt.closest('input,textarea,[contenteditable="true"],select'))) return;
      if (isInsideScrollableY(tgt)) return; // даём прокручиваться вложенным спискам

      const dy = normalizeDeltaY(e);
      const abs = Math.abs(dy);

      // Обычный скролл → не трогаем
      if (abs <= threshold) return;

      // Резкий импульс → перехватываем и сглаживаем
      e.preventDefault();

      const step = Math.sign(dy) * Math.min(abs, cap);
      const target = window.scrollY + step;

      // если в данный момент уже идёт наша анимация — начинаем от текущей позиции
      animateTo(target);
    };

    // Синхронизация, если пользователь «подвинул» позицию не через wheel (тачбар/ползунок)
    const onNativeScroll = () => {
      // ничего специально не делаем; следующая анимация начнётся от актуального scrollY
    };

    const optPassiveFalse = { passive: false } as AddEventListenerOptions;

    window.addEventListener('wheel', onWheel, optPassiveFalse);
    window.addEventListener('scroll', onNativeScroll, { passive: true });

    const onVis = () => {
      if (document.visibilityState === 'hidden' && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.removeEventListener('wheel', onWheel as any, optPassiveFalse);
      window.removeEventListener('scroll', onNativeScroll as any);
      document.removeEventListener('visibilitychange', onVis as any);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [threshold, cap, duration, respectInnerScrolls]);

  return null;
}
