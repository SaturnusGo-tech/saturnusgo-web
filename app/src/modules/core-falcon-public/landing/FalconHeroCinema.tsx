"use client";
import { useLandingLocale } from "./localization/context/LandingLocaleProvider";
import { ArrowDown, Play } from "lucide-react";
import { motion, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import styles from "./landing.module.css";
import {
  useLandingMotionEnabled,
  useLandingScrollProgress,
} from "./motion/useLandingScrollProgress";

export function FalconHeroCinema() {
  const { copy } = useLandingLocale();
  const section = useRef<HTMLElement>(null);
  const motionEnabled = useLandingMotionEnabled();
  const progress = useLandingScrollProgress(section, motionEnabled, "hero");
  const smoothProgress = useSpring(progress, {
    stiffness: 140,
    damping: 28,
    mass: 0.45,
  });
  const y = useTransform(smoothProgress, [0, 1], [0, 90]);
  return (
    <section
      ref={section}
      className={styles.hero}
      aria-labelledby="falcon-hero-title"
    >
      <motion.img
        className={styles.heroArt}
        src="/falcon/landing/2026-09/falcon-wing.webp"
        alt=""
        aria-hidden="true"
        width={1672}
        height={941}
        fetchPriority="high"
        style={motionEnabled ? { y } : { y: 0 }}
      />
      <div className={styles.heroInner}>
        <p className={styles.eyebrow}>Falcon / {copy.category}</p>
        <h1 id="falcon-hero-title">
          {copy.heroTitle[0]}
          <br />
          {copy.heroTitle[1]}
        </h1>
        <p className={styles.heroLead}>
          {copy.heroLead}
        </p>
        <a href="#product" className={styles.watchLink}>
          <span>
            <Play size={17} fill="currentColor" aria-hidden="true" />
          </span>
          {copy.watch}
        </a>
      </div>
      <a
        className={styles.scrollLink}
        href="#product"
        aria-label={copy.scroll}
      >
        <ArrowDown size={19} aria-hidden="true" />
      </a>
    </section>
  );
}
