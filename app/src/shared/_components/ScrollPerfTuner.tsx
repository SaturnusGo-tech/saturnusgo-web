'use client';
import { useEffect } from 'react';

export default function ScrollPerfTuner({
  idleAfter = 140,      // через сколько мс после последнего события скролла вернуть эффекты
}: { idleAfter?: number } = {}) {
  useEffect(() => {
    const root = document.documentElement;
    let t: number | null = null;
    let active = false;

    const onScroll = () => {
      if (!active) {
        active = true;
        root.setAttribute('data-scroll', '1'); // флаг «идёт прокрутка»
      }
      if (t) window.clearTimeout(t);
      t = window.setTimeout(() => {
        active = false;
        root.removeAttribute('data-scroll');
        t = null;
      }, idleAfter);
    };

    const opts = { passive: true } as AddEventListenerOptions;
    window.addEventListener('scroll', onScroll, opts);
    window.addEventListener('wheel', onScroll, opts);
    window.addEventListener('touchmove', onScroll, opts);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onScroll);
      window.removeEventListener('touchmove', onScroll);
    };
  }, [idleAfter]);

  return null;
}
