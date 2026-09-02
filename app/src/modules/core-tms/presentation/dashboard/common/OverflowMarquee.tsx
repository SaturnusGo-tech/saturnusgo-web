"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

type MarqueeStyle = CSSProperties & {
  "--dashboard-marquee-distance"?: string;
  "--dashboard-marquee-duration"?: string;
};

export function OverflowMarquee({ text, className }: { text: string; className?: string }) {
  const viewportRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const measure = () => setOverflow(Math.max(0,
      (contentRef.current?.scrollWidth ?? 0) - (viewportRef.current?.clientWidth ?? 0)));
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (viewportRef.current) observer?.observe(viewportRef.current);
    if (contentRef.current) observer?.observe(contentRef.current);
    return () => observer?.disconnect();
  }, [text]);

  const style: MarqueeStyle = overflow > 0 ? {
    "--dashboard-marquee-distance": `-${overflow}px`,
    "--dashboard-marquee-duration": `${Math.max(4.5, overflow / 18).toFixed(2)}s`,
  } : {};

  return <span ref={viewportRef} className={className} data-overflow={overflow > 0} title={text}>
    <span ref={contentRef} style={style}>{text}</span>
  </span>;
}
