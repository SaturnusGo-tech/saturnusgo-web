"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef, useState } from "react";
import styles from "./landing.module.css";

export function FalconHeroCinema() {
  const sceneRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sceneRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 92,
    damping: 28,
    mass: 0.2,
  });
  const reduceMotion = useReducedMotion() === true;
  const [introInteractive, setIntroInteractive] = useState(true);

  const introOpacity = useTransform(progress, [0, 0.16, 0.36, 0.72, 1], [1, 1, 0.22, 0.14, 0.09]);
  const introY = useTransform(progress, [0, 0.32], [0, -58]);
  const introBlur = useTransform(progress, [0.12, 0.32], ["blur(0px)", "blur(14px)"]);
  const statementOpacity = useTransform(progress, [0.25, 0.4, 0.82, 0.98], [0, 1, 1, 0.18]);
  const statementY = useTransform(progress, [0.25, 0.44, 0.82, 1], [54, 0, 0, -120]);
  const statementBlur = useTransform(progress, [0.25, 0.4, 0.86, 1], ["blur(14px)", "blur(0px)", "blur(0px)", "blur(12px)"]);
  const productOpacity = useTransform(progress, [0.34, 0.47, 1], [0, 1, 1]);
  const productY = useTransform(progress, [0.32, 0.62, 1], [440, 128, -18]);
  const productScale = useTransform(progress, [0.32, 0.58, 0.82, 1], [0.78, 0.98, 1.03, 1.04]);
  const productRotateX = useTransform(progress, [0.32, 0.68, 1], [10, 3, 0]);
  const ambientScale = useTransform(progress, [0, 1], [1, 1.08]);
  const ambientOpacity = useTransform(progress, [0, 0.44, 1], [0.5, 0.92, 0.72]);
  const cueOpacity = useTransform(progress, [0, 0.1, 0.24, 0.34], [1, 1, 0.24, 0]);

  useMotionValueEvent(progress, "change", (latest) => {
    const shouldBeInteractive = reduceMotion || latest < 0.34;
    setIntroInteractive((current) => current === shouldBeInteractive ? current : shouldBeInteractive);
  });

  return (
    <section
      ref={sceneRef}
      className={`${styles.heroCinema} ${reduceMotion ? styles.heroReducedMotion : ""}`}
      aria-labelledby="falcon-hero-title"
    >
      <div className={styles.heroSticky}>
        <motion.div
          className={styles.heroAmbient}
          style={reduceMotion ? undefined : { opacity: ambientOpacity, scale: ambientScale }}
          aria-hidden="true"
        />

        <motion.div
          className={styles.heroPrelude}
          style={reduceMotion ? undefined : { opacity: introOpacity, y: introY, filter: introBlur }}
          aria-hidden={!introInteractive}
        >
          <h1 id="falcon-hero-title">Тест-кейсы, прогоны и дефекты с общей историей</h1>
          <p className={styles.heroLead}>
            Пишите сценарий один раз. Его точная версия останется в каждом прогоне.
          </p>
          <Link
            className={styles.primaryButtonLarge}
            href="/signup/"
            tabIndex={introInteractive ? undefined : -1}
          >
            Попробовать <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </motion.div>

        <motion.div
          className={styles.heroStatement}
          style={reduceMotion ? undefined : { opacity: statementOpacity, y: statementY, filter: statementBlur }}
        >
          <h2 className={styles.heroStatementTitle}>Каждый запуск сохраняет контекст</h2>
          <p>Falcon фиксирует ревизию кейса, окружение и сборку в момент запуска.</p>
        </motion.div>

        <motion.figure
          className={styles.heroProductStage}
          style={reduceMotion ? undefined : {
            opacity: productOpacity,
            y: productY,
            scale: productScale,
            rotateX: productRotateX,
          }}
        >
          <picture>
            <source media="(max-width: 780px)" srcSet="/falcon/landing/run-detail-mobile.jpg" width="780" height="1400" />
            <img
              src="/falcon/landing/run-detail.jpg"
              alt="Активный тест-ран Falcon со списком кейсов и открытым сценарием"
              width="2560"
              height="1440"
              loading="lazy"
              fetchPriority="auto"
              decoding="async"
            />
          </picture>
        </motion.figure>

        <motion.div
          className={styles.scrollCue}
          style={reduceMotion ? undefined : { opacity: cueOpacity }}
          aria-hidden="true"
        >
          <span />
          Прокрутите
        </motion.div>
      </div>
    </section>
  );
}
