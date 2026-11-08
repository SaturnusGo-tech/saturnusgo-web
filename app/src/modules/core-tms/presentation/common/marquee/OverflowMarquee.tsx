"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

type MarqueeStyle = CSSProperties & {
  "--marquee-distance"?: string;
  "--marquee-duration"?: string;
};

export function OverflowMarquee({ text, className }: { text: string; className?: string }) {
  const viewportRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const measure = () => {
      const difference = (contentRef.current?.getBoundingClientRect().width ?? 0)
        - (viewportRef.current?.getBoundingClientRect().width ?? 0);
      setOverflow(difference > 1 ? Math.ceil(difference) : 0);
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (viewportRef.current) observer?.observe(viewportRef.current);
    if (contentRef.current) observer?.observe(contentRef.current);
    return () => observer?.disconnect();
  }, [text]);

  const style: MarqueeStyle = overflow > 0 ? {
    "--marquee-distance": `-${overflow}px`,
    "--marquee-duration": `${Math.max(5, overflow / 12 + 2).toFixed(2)}s`,
  } : {};

  return <span ref={viewportRef} className={className} data-overflow={overflow > 0}>
    <span ref={contentRef} style={style}>{text}</span>
  </span>;
}
