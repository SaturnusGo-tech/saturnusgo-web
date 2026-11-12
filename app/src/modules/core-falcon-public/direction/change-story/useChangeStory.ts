'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMotionValue } from 'framer-motion';
import { CHANGE_STORY_DURATION, clampStoryTime } from './change-story';

/** Keep continuous animation outside React; text and accessibility get a 10 Hz snapshot. */
export function useChangeStory() {
  const ref = useRef<HTMLElement | null>(null);
  const time = useMotionValue(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  // A layout effect resolves the preference before the first hydrated paint, while SSR stays quiet.
  const useHydratedEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

  useHydratedEffect(() => {
    const element = ref.current;
    if (!element) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = !('IntersectionObserver' in window);
    let revealed = visible;
    let focused = true;
    let presented = false;
    let restartPending = false;
    let reduced = preference.matches;
    let disposed = false;
    let playing = false;
    let frame: number | null = null;
    let previousTimestamp = 0;
    let published = time.get();

    const setPlaying = (value: boolean) => {
      if (playing === value) return;
      playing = value;
      setRunning(value);
    };
    const stop = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      setPlaying(false);
    };
    const tick = (timestamp: number) => {
      if (disposed || !playing) return;
      frame = null;
      const next = clampStoryTime(time.get() + Math.max(0, timestamp - previousTimestamp));
      previousTimestamp = timestamp;
      time.set(next);
      if (next - published >= 100 || next === CHANGE_STORY_DURATION) {
        published = next;
        setElapsed(next);
      }
      if (next === CHANGE_STORY_DURATION) stop();
      else frame = window.requestAnimationFrame(tick);
    };
    const sync = () => {
      if (disposed) return;
      if (!visible || document.hidden || !focused) {
        if (presented) restartPending = true;
        stop();
        return;
      }
      if (reduced) { restartPending = false; stop(); return; }
      if (restartPending) {
        stop();
        restartPending = false;
        time.set(0);
        published = 0;
        setElapsed(0);
      }
      const shouldPlay = time.get() < CHANGE_STORY_DURATION;
      if (!shouldPlay) { stop(); return; }
      if (playing) return;
      // Returning to the scene starts a fresh presentation without counting hidden time.
      previousTimestamp = window.performance.now();
      presented = true;
      setPlaying(true);
      frame = window.requestAnimationFrame(tick);
    };
    const settlePreference = () => {
      reduced = preference.matches;
      setReducedMotion(reduced);
      if (reduced) {
        stop();
        presented = true;
        restartPending = false;
        time.set(CHANGE_STORY_DURATION);
        published = CHANGE_STORY_DURATION;
        setElapsed(CHANGE_STORY_DURATION);
      }
      sync();
    };
    const loseFocus = () => { focused = false; sync(); };
    const gainFocus = () => { focused = true; sync(); };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      const entry = entries.find(candidate => candidate.target === element);
      if (!entry) return;
      // A new visit must reveal enough of the scene before restarting, avoiding edge flicker.
      if (!entry.isIntersecting || entry.intersectionRatio === 0) revealed = false;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.35) revealed = true;
      visible = revealed && entry.isIntersecting && entry.intersectionRatio > 0;
      sync();
    }, { threshold: [0, 0.35] }) : null;
    observer?.observe(element);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('blur', loseFocus);
    window.addEventListener('focus', gainFocus);
    preference.addEventListener('change', settlePreference);
    settlePreference();

    return () => {
      disposed = true;
      if (frame !== null) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('blur', loseFocus);
      window.removeEventListener('focus', gainFocus);
      preference.removeEventListener('change', settlePreference);
    };
  }, [time]);

  return { ref, time, elapsed, running, reducedMotion };
}
