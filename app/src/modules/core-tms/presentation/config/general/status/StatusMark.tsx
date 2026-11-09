'use client';

// Adapted from React Bits StatusMark; see README.md and LICENSE.md in this directory.
import { useCallback, useEffect, useRef, useSyncExternalStore, type CSSProperties } from 'react';
import { animate, useMotionValue } from 'motion/react';
import { LoadingOrb } from '../../../../../../shared/components/loading/LoadingOrb';
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
const MORPH = { duration: 0.2, ease: [0.77, 0, 0.175, 1] as [number, number, number, number] };

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const getReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;
const getServerReducedMotion = () => true;

function dashArray(mode: number) {
  const dash = 0.3 * DASH_PERIOD + (CIRCUMFERENCE - 0.3 * DASH_PERIOD) * mode;
  const gap = 0.7 * DASH_PERIOD * (1 - mode);
  return `${Math.max(0, dash)} ${Math.max(0, gap)}`;
}

export function StatusMark({ status, label, size = 16 }: StatusMarkProps) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion, getReducedMotion, getServerReducedMotion,
  );
  const solid = status !== 'pending';
  const running = status === 'running';
  const mode = useMotionValue(solid ? 1 : 0);
  const ringRef = useRef<SVGCircleElement>(null);
  const initialDash = useRef(dashArray(solid ? 1 : 0));

  const writeRing = useCallback(() => {
    ringRef.current?.setAttribute('stroke-dasharray', dashArray(mode.get()));
  }, [mode]);

  useEffect(() => {
    writeRing();
    return mode.on('change', writeRing);
  }, [mode, running, writeRing]);

  useEffect(() => {
    if (reducedMotion || running) {
      mode.jump(solid ? 1 : 0);
      return;
    }
    const transition = animate(mode, solid ? 1 : 0, MORPH);
    return () => transition.stop();
  }, [mode, reducedMotion, running, solid]);

  return (
    <span className={styles.status} data-status={status} role="status" aria-live="polite" aria-atomic="true"
      style={running ? { '--loading-orb-size': `${size}px` } as CSSProperties : undefined}>
      {running ? <LoadingOrb /> : <svg className={styles.glyph} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
        <circle
          ref={ringRef} className={styles.ring} cx="12" cy="12" r="9"
          transform="rotate(-90 12 12)" strokeDasharray={initialDash.current}
        />
        <path className={styles.check} d="M7.5 12.25 10.5 15.25 16.75 8.75" pathLength="1" />
        <path className={styles.cross} d="M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5" pathLength="1" />
      </svg>}
      <span>{label}</span>
    </span>
  );
}

export default StatusMark;
