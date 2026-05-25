'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

export default function Showcase() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const phones = Array.from(el.querySelectorAll<HTMLElement>('.showcase__phone'));
    let raf = 0; let target = 0, v = 0;
    const onScroll = () => { target = (window.scrollY || 0) * 0.06; if (!raf) tick(); };
    const tick = () => {
      v += (target - v) * 0.08;
      phones.forEach((p, i) => {
        const phase = (i - 1) * 12;
        p.style.transform = `translateY(${v + phase}px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y))`;
      });
      raf = Math.abs(target - v) < 0.2 ? 0 : requestAnimationFrame(tick);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="showcase reveal">
      <div className="showcase__sticky" ref={ref}>
        <div className="showcase__panel">
          <h3>Feels native. Scales globally.</h3>
          <p className="showcase__meta">
            Gesture-first UX, protective flows (dates overlap, payments fallback), and a clean design system.
          </p>
        </div>
       
      </div>
    </div>
  );
}