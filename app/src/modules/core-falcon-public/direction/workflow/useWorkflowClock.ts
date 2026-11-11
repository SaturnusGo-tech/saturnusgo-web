'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { WORKFLOW_DURATION } from './workflow-story';

export function useWorkflowClock() {
  const ref = useRef<HTMLElement>(null);
  const elapsedRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const [visible, setVisible] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  // The server cannot read matchMedia. Keep the first client frame identical
  // and reveal the completed reduced-motion artifact immediately after mount.
  const reducedMotion = mounted && Boolean(prefersReducedMotion);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .2 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setDocumentVisible(document.visibilityState !== 'hidden');
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const running = visible && documentVisible && !paused && !reducedMotion && elapsed < WORKFLOW_DURATION;

  useEffect(() => {
    if (!running) return;
    let id = 0;
    let last = performance.now();
    let lastPaint = last;
    const tick = (now: number) => {
      elapsedRef.current = Math.min(WORKFLOW_DURATION, elapsedRef.current + Math.max(0, now - last));
      last = now;
      if (now - lastPaint >= 45 || elapsedRef.current === WORKFLOW_DURATION) {
        setElapsed(elapsedRef.current);
        lastPaint = now;
      }
      if (elapsedRef.current < WORKFLOW_DURATION) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [running]);

  return {
    ref,
    elapsed: reducedMotion ? WORKFLOW_DURATION : elapsed,
    paused,
    reducedMotion: Boolean(reducedMotion),
    togglePause: () => setPaused(value => !value),
    replay: () => { elapsedRef.current = 0; setElapsed(0); setPaused(false); },
  };
}
