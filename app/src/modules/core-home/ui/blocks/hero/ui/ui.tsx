"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  CORE_HOME_HERO_LOADING_DURATION_MS,
  CORE_HOME_INVESTORS_PATHNAME,
} from "../../../../constants";
import usePdfDemoDialog from "../../../../services/pdf-demo-dialog";
import styles from "../styles/styles.module.css";

function useHeroLoadingProgress() {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(100);
      setIsReady(true);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();

    const update = (now: number) => {
      const elapsed = now - startedAt;
      const nextProgress = Math.min(
        100,
        Math.round((elapsed / CORE_HOME_HERO_LOADING_DURATION_MS) * 100),
      );

      setProgress(nextProgress);

      if (nextProgress >= 100) {
        setIsReady(true);
        return;
      }

      frame = window.requestAnimationFrame(update);
    };

    frame = window.requestAnimationFrame(update);

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return { progress, isReady };
}

export default function Hero() {
  const { progress, isReady } = useHeroLoadingProgress();
  const { Dialog, openDialog } = usePdfDemoDialog({
    url: "/SG-P.pdf",
    rememberKey: "skipDeckWarning",
  });

  return (
    <>
      <section className={`${styles.hero} ${isReady ? styles.ready : ""}`}>
        <div className={styles.loader} aria-hidden={isReady}>
          <span>{progress}%</span>
        </div>

        <div className={styles.mediaLayer} aria-hidden>
          <img
            className={styles.media}
            src="/mock/hero-main.webp"
            alt=""
            loading="eager"
            decoding="async"
          />
        </div>

        <div className={styles.veil} aria-hidden />

        <div className={styles.content}>
          <div className={styles.kicker}>SaturnusGo / urban mobility</div>
          <h1 className={styles.title}>Ехать, отправлять, открывать город</h1>
          <p className={styles.lead}>
            Taxi-first главный экран для поездок, доставки, мест и городского
            движения в одном спокойном premium-flow.
          </p>

          <div className={styles.actions}>
            <a className={styles.primaryAction} href="#trips">
              Смотреть продукт
            </a>
            <Link className={styles.secondaryAction} href={CORE_HOME_INVESTORS_PATHNAME}>
              Investors
            </Link>
            <button className={styles.secondaryAction} type="button" onClick={openDialog}>
              Deck
            </button>
          </div>
        </div>

        <a className={styles.scrollHint} href="#value" aria-label="Scroll to product intro">
          <span>Scroll down</span>
          <i aria-hidden />
        </a>
      </section>

      {Dialog}
    </>
  );
}
