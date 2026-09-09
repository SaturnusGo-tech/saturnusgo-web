"use client";
import { ArrowDown, Play } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import styles from "./landing.module.css";

export function FalconHeroCinema() {
  const section = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 90]);
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
        style={reduced ? undefined : { y }}
      />
      <div className={styles.heroInner}>
        <p className={styles.eyebrow}>Falcon / Управление тестированием</p>
        <h1 id="falcon-hero-title">
          Тест-кейсы,
          <br />
          прогоны и дефекты.
        </h1>
        <p className={styles.heroLead}>
          Планируйте проверки, фиксируйте результаты
          <br className={styles.desktopBreak} /> и проверяйте исправления вместе
          с командой.
        </p>
        <a href="#product" className={styles.watchLink}>
          <span>
            <Play size={17} fill="currentColor" aria-hidden="true" />
          </span>
          Посмотреть Falcon
        </a>
      </div>
      <a
        className={styles.scrollLink}
        href="#product"
        aria-label="Перейти к демонстрации продукта"
      >
        <ArrowDown size={19} aria-hidden="true" />
      </a>
    </section>
  );
}
