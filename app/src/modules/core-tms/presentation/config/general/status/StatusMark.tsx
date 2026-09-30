'use client';

// Adapted from React Bits StatusMark; see README.md and LICENSE.md in this directory.
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { animate, useMotionValue } from 'motion/react';
import styles from './status-mark.module.css';

export type StatusMarkStatus = 'pending' | 'running' | 'done' | 'failed';

export interface StatusMarkProps {
  status: StatusMarkStatus;
  label: string;
  size?: number;
}

const CIRCUMFERENCE = 18 * Math.PI;
const DASH_PERIOD = CIRCUMFERENCE / 8;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const UI = { type: 'spring' as const, duration: 0.2, bounce: 0 };
const MORPH = { duration: 0.2, ease: [0.77, 0, 0.175, 1] as [number, number, number, number] };

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const getReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;
const getServerReducedMotion = () => true;

function dashArray(mode: number, arc: number) {
  const dash = 0.3 * DASH_PERIOD + (arc * CIRCUMFERENCE - 0.3 * DASH_PERIOD) * mode;
  const gap = 0.7 * DASH_PERIOD + ((1 - arc) * CIRCUMFERENCE - 0.7 * DASH_PERIOD) * mode;
  return `${Math.max(0, dash)} ${Math.max(0, gap)}`;
}

export function StatusMark({ status, label, size = 16 }: StatusMarkProps) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion, getReducedMotion, getServerReducedMotion,
  );
  const solid = status !== 'pending';
  const running = status === 'running';
  const targetArc = running ? 0.68 : 1;
  const mode = useMotionValue(solid ? 1 : 0);
  const arc = useMotionValue(targetArc);
  const travel = useMotionValue(0);
  const ringRef = useRef<SVGCircleElement>(null);
  const initialDash = useRef(dashArray(solid ? 1 : 0, targetArc));

  const writeRing = useCallback(() => {
    ringRef.current?.setAttribute('stroke-dasharray', dashArray(mode.get(), arc.get()));
    ringRef.current?.setAttribute('stroke-dashoffset', String(travel.get()));
  }, [mode, arc, travel]);

  useEffect(() => {
    writeRing();
    const unsubscribe = [mode, arc, travel].map(value => value.on('change', writeRing));
    return () => unsubscribe.forEach(stop => stop());
  }, [mode, arc, travel, writeRing]);

  useEffect(() => {
    if (reducedMotion) {
      mode.jump(solid ? 1 : 0);
      arc.jump(targetArc);
      travel.jump(0);
      return;
    }
    if (mode.get() === 0) arc.jump(targetArc);
    const transitions = [
      animate(mode, solid ? 1 : 0, MORPH),
      animate(arc, targetArc, UI),
      running
        ? animate(travel, [travel.get(), travel.get() - CIRCUMFERENCE], {
          duration: 1.1, ease: 'linear', repeat: Infinity,
        })
        : animate(travel, Math.floor(travel.get() / DASH_PERIOD) * DASH_PERIOD, UI),
    ];
    // Interrupt at the current value so rapid state changes never replay stale completions.
    return () => transitions.forEach(transition => transition.stop());
  }, [status, solid, running, targetArc, reducedMotion, mode, arc, travel]);

  return (
    <span className={styles.status} data-status={status} role="status" aria-live="polite" aria-atomic="true">
      <svg className={styles.glyph} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
        <circle className={styles.track} cx="12" cy="12" r="9" />
        <circle
          ref={ringRef} className={styles.ring} cx="12" cy="12" r="9"
          transform="rotate(-90 12 12)" strokeDasharray={initialDash.current} strokeDashoffset="0"
        />
        <path className={styles.check} d="M7.5 12.25 10.5 15.25 16.75 8.75" pathLength="1" />
        <path className={styles.cross} d="M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5" pathLength="1" />
      </svg>
      <span>{label}</span>
    </span>
  );
}

export default StatusMark;
