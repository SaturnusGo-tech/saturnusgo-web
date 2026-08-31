import type { CSSProperties } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import styles from "./run-navigator.module.css";

type RunNameMarqueeProps = {
  name: string;
  motion: "always" | "interaction";
};

export function RunNameMarquee({ name, motion }: RunNameMarqueeProps) {
  const viewportRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [distance, setDistance] = useState(0);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const measure = () => setDistance(Math.max(0, Math.ceil(content.scrollWidth - viewport.clientWidth)));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(content);
    return () => observer.disconnect();
  }, [name]);

  const style = {
    "--run-name-distance": `${distance}px`,
    "--run-name-duration": `${Math.min(18, Math.max(7, 5 + distance / 28))}s`,
  } as CSSProperties;

  return (
    <strong ref={viewportRef} className={styles.runNameViewport} title={name}>
      <span
        ref={contentRef}
        className={motion === "always" ? styles.runNameAlways : styles.runNameOnInteraction}
        data-overflow={distance > 0 || undefined}
        style={style}
      >
        {name}
      </span>
    </strong>
  );
}
