"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { createFalconAssembly } from "./falconAssembly";
import styles from "./falcon-brand-mark.module.css";

const asset = "/falcon/falcon-brand-mark.svg";
const markStyle = { "--falcon-brand-mark-image": `url("${asset}")` } as CSSProperties;

export function FalconBrandMark({
  className,
  animated = true,
  intervalMs,
  intro = false,
}: {
  className?: string;
  animated?: boolean;
  intervalMs?: number;
  intro?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasNode = canvasRef.current;
    if (!canvasNode?.parentElement) return;
    const canvas = canvasNode;
    const mark = canvasNode.parentElement;
    if (typeof window.matchMedia !== "function") {
      mark.dataset.static = "";
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = typeof IntersectionObserver === "undefined";
    let mounted = true;
    let renderer: Awaited<ReturnType<typeof createFalconAssembly>>;
    let loading = false;
    let frame = 0;
    let timer = 0;
    let elapsed = 0;
    let previous: number | undefined;

    function stop() {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      frame = timer = 0;
      previous = undefined;
    }
    function canAnimate() {
      return mounted && visible && !document.hidden && !reducedMotion.matches;
    }
    function tick(now: number) {
      frame = 0;
      if (!renderer || !canAnimate()) return;
      if (previous !== undefined) elapsed += (now - previous) / 1000;
      previous = now;
      if (intervalMs && elapsed >= renderer.cycleSeconds) {
        delete mark.dataset.assembling;
        elapsed = 0;
        previous = undefined;
        update();
        return;
      }
      renderer.draw(elapsed, intro);
      if (!mark.hasAttribute("data-assembling")) mark.dataset.assembling = "true";
      frame = window.requestAnimationFrame(tick);
    }
    function play() {
      if (!canAnimate()) return;
      if (renderer) {
        renderer.resize();
        renderer.readTheme();
        if (!frame) frame = window.requestAnimationFrame(tick);
      } else if (!loading) {
        loading = true;
        void import("./falconAssembly").then(({ createFalconAssembly }) => createFalconAssembly(canvas, asset))
          .then(result => {
            renderer = result;
            if (!mounted) return;
            if (renderer) play();
            else mark.dataset.static = "";
          }).catch(() => {
            if (mounted) mark.dataset.static = "";
          });
      }
    }
    function update() {
      if (!canAnimate()) {
        stop();
        if (reducedMotion.matches) {
          delete mark.dataset.assembling;
          elapsed = 0;
        }
        return;
      }
      if (intervalMs && elapsed === 0 && !frame) {
        if (!timer) timer = window.setTimeout(() => {
          timer = 0;
          play();
        }, intervalMs);
      } else {
        play();
      }
    }
    const intersection = typeof IntersectionObserver === "undefined" ? undefined : new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    const resize = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(() => {
      renderer?.resize();
      renderer?.draw(elapsed, intro);
    });
    const theme = typeof MutationObserver === "undefined" ? undefined : new MutationObserver(() => renderer?.readTheme());
    intersection?.observe(mark);
    resize?.observe(mark);
    const themeOptions = { attributes: true, attributeFilter: ["class", "style", "data-theme"] };
    theme?.observe(document.documentElement, themeOptions);
    const localTheme = mark.closest("[data-theme]");
    if (localTheme && localTheme !== document.documentElement) theme?.observe(localTheme, themeOptions);
    reducedMotion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      mounted = false;
      stop();
      delete mark.dataset.assembling;
      delete mark.dataset.static;
      intersection?.disconnect();
      resize?.disconnect();
      theme?.disconnect();
      reducedMotion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [animated, intervalMs, intro]);

  return (
    <span aria-hidden="true" data-falcon-brand-mark="" data-intro={intro && animated ? "" : undefined}
      className={[styles.mark, className].filter(Boolean).join(" ")} style={markStyle}>
      {animated && <canvas ref={canvasRef} className={styles.canvas} />}
    </span>
  );
}

export default FalconBrandMark;
