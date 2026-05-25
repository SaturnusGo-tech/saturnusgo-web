// app/src/shared/_components/defer/Defer.tsx
'use client';

import { useEffect, useState } from 'react';

type Props = {
  children: React.ReactNode;
  /** 'idle' — rIC/timeout, 'afterInteractive' — next tick, 'delay' — ms */
  strategy?: 'idle' | 'afterInteractive' | 'delay';
  delayMs?: number;
};

/** Отложенный маунт некритичных компонентов, чтобы не мешать TTI/интерактивности */
export default function Defer({ children, strategy = 'idle', delayMs = 0 }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (strategy === 'afterInteractive') {
      const id = requestAnimationFrame(() => setReady(true));
      return () => cancelAnimationFrame(id);
    }
    if (strategy === 'delay') {
      const t = setTimeout(() => setReady(true), delayMs);
      return () => clearTimeout(t);
    }
    // 'idle'
    const cb = () => setReady(true);
    // @ts-ignore
    const ric = window.requestIdleCallback ? window.requestIdleCallback(cb, { timeout: 700 }) : setTimeout(cb, 120);
    return () => {
      // @ts-ignore
      if (window.cancelIdleCallback) window.cancelIdleCallback(ric);
      else clearTimeout(ric);
    };
  }, [strategy, delayMs]);

  return ready ? <>{children}</> : null;
}
