'use client';
import { useEffect } from 'react';

export default function useReveal(){
  useEffect(() => {
    const scan = () => Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.reveal--in)'));
    const els = scan();
    if (!els.length) return;

    let io: IntersectionObserver | null = null;

    const init = () => {
      io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('reveal--in');
            io!.unobserve(e.target);
          }
        }
      }, {
        rootMargin: '140px 0px', // заранее прогреваем
        threshold: 0.01
      });
      els.forEach(el => io!.observe(el));
    };

    const rir: any = (window as any).requestIdleCallback || ((fn: any) => setTimeout(fn, 1));
    const cancel: any = (window as any).cancelIdleCallback || clearTimeout;
    const id = rir(init);

    return () => { io?.disconnect(); cancel(id); };
  }, []);
}
