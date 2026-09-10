import { useLayoutEffect, useRef, type ReactNode } from "react";
import css from "./expansion.module.css";
/** Animate the actual measured height, including the lazily loaded Markdown editor. */
export function ExpandingComment({ children }: { children: ReactNode }) {
  const shell = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const previous = useRef(0);
  useLayoutEffect(() => {
    const element = shell.current; const inner = content.current;
    if (!element || !inner) return;
    let animation: Animation | undefined;
    const resize = () => {
      const next = inner.getBoundingClientRect().height;
      if (Math.abs(next - previous.current) < 1) return;
      const from = animation?.playState === "running" ? element.getBoundingClientRect().height : previous.current;
      animation?.cancel();
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        element.dataset.moving = "true";
        animation = element.animate([{ height: `${previous.current ? from : 36}px` }, { height: `${next}px` }],
          { duration: 240, easing: "cubic-bezier(.2,.7,.2,1)" });
        animation.onfinish = () => { delete element.dataset.moving; animation = undefined; };
      }
      previous.current = next;
    };
    resize();
    const observer = new ResizeObserver(resize); observer.observe(inner);
    return () => { observer.disconnect(); animation?.cancel(); delete element.dataset.moving; animation = undefined; };
  }, []);
  return <div ref={shell} className={css.expansion}><div ref={content}>{children}</div></div>;
}
