import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import css from "./overflow.module.css";

export function OverflowLabel({ text }: { text: string }) {
  const root = useRef<HTMLSpanElement>(null);
  const content = useRef<HTMLSpanElement>(null);
  const [distance, setDistance] = useState(0);
  useLayoutEffect(() => {
    const measure = () => setDistance(Math.max(0, (content.current?.scrollWidth ?? 0) - (root.current?.clientWidth ?? 0)));
    const observer = new ResizeObserver(measure);
    if (root.current) observer.observe(root.current);
    if (content.current) observer.observe(content.current);
    measure();
    return () => observer.disconnect();
  }, [text]);
  return <span ref={root} className={css.viewport} title={text} data-overflow={distance > 1}
    style={{ "--overflow-distance": `${-distance}px`, "--overflow-duration": `${Math.max(4, distance / 30 + 2)}s` } as CSSProperties}>
    <span ref={content} className={css.text}>{text}</span>
  </span>;
}
