"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Card, CardDescription, CardTitle } from "../../../../../../../../shared/vendor/dashboardcn/card";
import styles from "../dashboardcn.module.css";

type Props = {
  title: string;
  value: number | null | undefined;
  locale: string;
  context: string;
  busy: boolean;
  onOpen?: () => void;
};

export function DashboardcnCount({ title, value, locale, context, busy, onOpen }: Props) {
  const full = value == null ? "—" : new Intl.NumberFormat(locale).format(value);
  const drill = value != null ? onOpen : undefined;
  return <div className={styles.countTile} data-dashboardcn-count="" aria-busy={busy}>
    <Card className={styles.countCard} aria-hidden={drill ? true : undefined}>
      <CardTitle className={styles.countValue} title={full}>
        <span className={styles.countAccessible}>{full}</span>
        {value == null ? <span aria-hidden="true">—</span> : <CountUp value={value} locale={locale} />}
      </CardTitle>
      <CardDescription className={styles.countLabel}>{title}</CardDescription>
      <span className={styles.countAccessible}>{context}</span>
    </Card>
    {drill && <button className={styles.metricAction} type="button" onClick={drill}
      title={`${title} · ${full}`} aria-label={`${title}: ${full}. ${context}`}>
      <ArrowUpRight size={15} aria-hidden="true" />
    </button>}
  </div>;
}

function CountUp({ value, locale }: { value: number; locale: string }) {
  const element = useRef<HTMLSpanElement>(null);
  const initialValue = useRef(value);
  const finished = useRef(false);
  const [display, setDisplay] = useState({ target: value, count: 0 });
  const formatter = useMemo(() => new Intl.NumberFormat(locale, value >= 10000
    ? { notation: "compact", maximumFractionDigits: 1 }
    : undefined), [locale, value]);

  useEffect(() => {
    const target = element.current;
    if (!target || value === 0 || finished.current) return;
    if (value !== initialValue.current) {
      finished.current = true;
      setDisplay({ target: value, count: value });
      return;
    }
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let start: number | undefined;
    let frame = 0;
    let observer: IntersectionObserver | undefined;
    const finish = () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      finished.current = true;
      setDisplay({ target: value, count: value });
    };
    const step = (now: number) => {
      start ??= now;
      const progress = (now - start) / 700;
      if (progress >= 1) { finish(); return; }
      const count = Math.trunc(value * (1 - (1 - progress) ** 2));
      setDisplay(current => current.count === count ? current : { target: value, count });
      frame = requestAnimationFrame(step);
    };
    const onMotionChange = () => { if (motion.matches) finish(); };
    if (motion.matches) { finish(); return; }

    if (typeof IntersectionObserver === "undefined") frame = requestAnimationFrame(step);
    else {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          observer?.disconnect();
          frame = requestAnimationFrame(step);
        }
      }, { threshold: 0.25 });
      observer.observe(target);
    }
    motion.addEventListener("change", onMotionChange);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", onMotionChange);
    };
  }, [value]);

  const final = formatter.format(value);
  return <span ref={element} aria-hidden="true" data-count-visual=""
    style={{ "--count-length": final.length } as CSSProperties}>
    <span className={styles.countAnimated}>{formatter.format(value === display.target ? display.count : value)}</span>
    <span className={styles.countStatic}>{final}</span>
  </span>;
}
