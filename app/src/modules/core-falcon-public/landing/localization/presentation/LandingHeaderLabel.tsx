"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useLandingLocale } from "../context/LandingLocaleProvider";
import type { LandingLocale } from "../model/locale";
import styles from "./header-label.module.css";

const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const sizeEasing = "cubic-bezier(.22, 1, .36, 1)";

export function LandingHeaderLabel({ en, ru }: Record<LandingLocale, string>) {
  const { locale, ready } = useLandingLocale();
  const previous = useRef({ locale, ready });
  const animations = useRef<Animation[]>([]);
  const wrapper = useRef<HTMLSpanElement>(null);
  const english = useRef<HTMLSpanElement>(null);
  const russian = useRef<HTMLSpanElement>(null);

  useClientLayoutEffect(() => {
    const before = previous.current;
    previous.current = { locale, ready };
    const label = wrapper.current;
    const outgoing = (locale === "en" ? russian : english).current;
    const incoming = (locale === "en" ? english : russian).current;
    if (!before.ready || before.locale === locale || !label || !incoming || !outgoing) return;

    const isAnimating = animations.current.some(animation => animation.playState === "running");
    const currentWidth = isAnimating
      ? label.getBoundingClientRect().width
      : outgoing.getBoundingClientRect().width;
    const outgoingOpacity = isAnimating ? Number(getComputedStyle(outgoing).opacity) : 1;
    const incomingOpacity = isAnimating ? Number(getComputedStyle(incoming).opacity) : 0;
    for (const animation of animations.current) animation.cancel();
    animations.current = [];

    if (!currentWidth || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nextWidth = incoming.getBoundingClientRect().width;
    // Let the longer label fade before the space it occupies starts to shrink.
    const shrinkDelay = nextWidth < currentWidth ? 55 : 0;
    const revealDelay = shrinkDelay ? 90 : 110;
    animations.current = [
      label.animate({ width: [`${currentWidth}px`, `${nextWidth}px`] }, {
        duration: 280 - shrinkDelay, delay: shrinkDelay, easing: sizeEasing, fill: "backwards",
      }),
      outgoing.animate({ opacity: [outgoingOpacity, 0], visibility: ["visible", "hidden"] }, { duration: revealDelay + 10, easing: "ease-out" }),
      incoming.animate({ opacity: [incomingOpacity, 1] }, { duration: 280 - revealDelay, delay: revealDelay, easing: "ease-out", fill: "backwards" }),
    ];
  }, [locale, ready]);

  return <span className={styles.label} ref={wrapper}>
    <span ref={english} lang="en" aria-hidden={locale !== "en"}>{en}</span>
    <span ref={russian} lang="ru" aria-hidden={locale !== "ru"}>{ru}</span>
  </span>;
}
