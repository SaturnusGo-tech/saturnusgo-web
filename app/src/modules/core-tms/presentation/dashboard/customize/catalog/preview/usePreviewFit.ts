import { useEffect, useRef, useState, type CSSProperties } from "react";

type Fit = { scale: number; left: number; top: number };
export function usePreviewFit(enabled: boolean) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [fit, setFit] = useState<Fit | null>(null);
  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!enabled || !viewport || !content) return;
    let frame = 0;
    const measure = () => {
      const width = content.offsetWidth;
      const height = Math.max(content.offsetHeight, content.scrollHeight);
      if (!width || !height || !viewport.clientWidth || !viewport.clientHeight) return;
      const scale = Math.min(viewport.clientWidth / width, viewport.clientHeight / height);
      const next = { scale, left: (viewport.clientWidth - width * scale) / 2,
        top: (viewport.clientHeight - height * scale) / 2 };
      setFit(previous => previous && Object.keys(next).every(key =>
        previous[key as keyof Fit] === next[key as keyof Fit]) ? previous : next);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport); observer.observe(content); measure();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [enabled]);
  const style: CSSProperties | undefined = enabled ? {
    left: fit?.left ?? 0, top: fit?.top ?? 0,
    transform: `scale(${fit?.scale ?? 1})`, visibility: fit ? "visible" : "hidden",
  } : undefined;
  return { viewportRef, contentRef, style };
}
