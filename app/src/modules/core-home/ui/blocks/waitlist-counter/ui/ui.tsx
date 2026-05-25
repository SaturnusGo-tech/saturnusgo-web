"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import useWaitlistCount from "../../../../services/waitlist-count";
import type { WaitlistCounterProps } from "../../../../types";
import styles from "../styles/styles.module.css";

export default function WaitlistCounter({
  className,
  label = "on the waitlist",
  apiBase,
  refreshIntervalMs,
  immediate,
  locales = "en-US",
  numberFormat,
  hidePulse = false,
}: WaitlistCounterProps) {
  const { count, loading } = useWaitlistCount({ apiBase, refreshIntervalMs, immediate });
  const animatedCount = useAnimatedInt(count ?? 0, 600);
  const formatter = useMemo(() => new Intl.NumberFormat(locales, numberFormat), [locales, numberFormat]);
  const displayValue = count === null ? "—" : formatter.format(animatedCount);
  const counterClassName = `${styles.counter}${className ? ` ${className}` : ""}`;

  return (
    <div className={counterClassName} aria-live="polite" data-loading={loading}>
      {hidePulse ? null : <span className={styles.dot} aria-hidden />}
      <span className={styles.number}>~ {displayValue}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}

function useAnimatedInt(target: number, durationMs: number): number {
  const [value, setValue] = useState(target);
  const previousValueRef = useRef(target);

  useEffect(() => {
    const from = previousValueRef.current;
    const to = target;

    if (from === to) {
      setValue(to);
      return;
    }

    previousValueRef.current = to;
    let rafId = 0;
    const startedAt = performance.now();

    const tick = (time: number) => {
      const progress = Math.min(1, (time - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (to - from) * eased));

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [durationMs, target]);

  return value;
}
