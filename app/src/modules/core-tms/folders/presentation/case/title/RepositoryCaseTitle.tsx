import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import css from "./repository-case-title.module.css";

/** Opt-in for run lists; the accessible button name remains the complete captured title. */
export function RepositoryCaseTitle({ title }: { title: string }) {
  const viewport = useRef<HTMLSpanElement>(null);
  const track = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const measure = () => setOverflow(Math.max(0, element.scrollWidth - element.clientWidth));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (track.current) observer.observe(track.current);
    return () => observer.disconnect();
  }, [title]);
  return <span ref={viewport} className={css.viewport} data-case-title data-overflow={overflow > 1 || undefined}
    style={{ "--title-offset": `${-overflow}px`, "--title-duration": `${Math.max(6, overflow / 28 * 2 + 3)}s` } as CSSProperties}>
    <span ref={track} className={css.track}>{title}</span>
  </span>;
}
