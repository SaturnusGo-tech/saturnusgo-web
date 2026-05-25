"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  CORE_HOME_HERO_METRICS,
  CORE_HOME_HERO_WORDS,
  CORE_HOME_INVESTORS_PATHNAME,
} from "../../../../constants";
import usePdfDemoDialog from "../../../../services/pdf-demo-dialog";
import styles from "../styles/styles.module.css";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const { Dialog, openDialog } = usePdfDemoDialog({
    url: "/SG-P.pdf",
    rememberKey: "skipDeckWarning",
  });

  const words = useMemo(() => CORE_HOME_HERO_WORDS, []);
  const activeWord = words[wordIndex] ?? words[0];

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return;
    }

    let rafId = 0;
    let currentOffset = 0;
    let nextOffset = 0;

    const tick = () => {
      currentOffset += (nextOffset - currentOffset) * 0.1;
      section.style.setProperty("--hero-y", `${currentOffset}px`);
      rafId = Math.abs(nextOffset - currentOffset) < 0.2 ? 0 : requestAnimationFrame(tick);
    };

    const onScroll = () => {
      nextOffset = window.scrollY * 0.025;

      if (!rafId) {
        tick();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);

      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setWordIndex((current) => (current + 1) % words.length);
    }, 2300);

    return () => window.clearInterval(intervalId);
  }, [words.length]);

  return (
    <>
      <section ref={sectionRef} className={`${styles.hero} reveal`}>
        <div className={styles.shell}>
          <div className={styles.copy}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowLine} aria-hidden />
              View our project
            </div>

            <h1 className={styles.title}>
              <span>Welcome to SaturnusGo</span>
              <span className={styles.titleLine}>
                Your ultimate {" "}
                <span className={styles.swapHost} aria-label={activeWord}>
                  {words.map((word) => (
                    <span
                      key={word}
                      className={`${styles.swap} ${word === activeWord ? styles.swapActive : ""}`}
                      aria-hidden={word !== activeWord}
                    >
                      {word}
                    </span>
                  ))}
                </span>
              </span>
              <span>management solution</span>
            </h1>

            <p className={styles.lead}>
              A dark, focused command center for rides, places, wallet, bookings and travel actions — built to make movement feel organized instead of fragmented.
            </p>

            <div className={styles.actions}>
              <a className={styles.primaryAction} href="#waitlist">Start free beta</a>
              <Link className={styles.secondaryAction} href={CORE_HOME_INVESTORS_PATHNAME}>Investor view</Link>
              <button className={styles.secondaryAction} type="button" onClick={openDialog}>Open deck</button>
            </div>
          </div>

          <div className={styles.visual} aria-hidden>
            <div className={styles.photoTile}>
              <span className={styles.photoNoise} />
            </div>

            <div className={styles.metricStack}>
              {CORE_HOME_HERO_METRICS.map((metric) => (
                <div className={styles.metricCard} key={metric.value}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>

            <div className={styles.projectBoard}>
              <div className={styles.boardMedia} />
              <div className={styles.boardTags}>
                <span>Ride</span>
                <span>Hotel</span>
                <span>Wallet</span>
              </div>
              <p>SaturnusGo — your go-to platform for streamlined travel planning, booking and execution.</p>
            </div>

            <div className={styles.meetingCard}>
              <span className={styles.cardDot} />
              <strong>Let's plan the weekend</strong>
              <p>Discuss route, places, booking and payment in one focused flow.</p>
            </div>

            <div className={styles.statusCard}>
              <span>Buenos Aires</span>
              <strong>ETA 21 min</strong>
            </div>
          </div>
        </div>
      </section>

      {Dialog}
    </>
  );
}
