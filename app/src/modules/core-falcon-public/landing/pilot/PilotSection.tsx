"use client";
import { useLandingLocale } from "../localization/context/LandingLocaleProvider";
import { SiTelegram } from "react-icons/si";
import { Reveal } from "../motion/Reveal";
import styles from "./pilot.module.css";

export function PilotSection() {
  const { copy } = useLandingLocale();
  return (
    <section className={styles.section} aria-labelledby="company-title">
      <Reveal>
        <p className={styles.label}>{copy.companyLabel}</p>
        <h2 id="company-title">{copy.companyTitle}</h2>
        <div className={styles.points}>
          {copy.companyPoints.map(point => <div key={point.title}><h3>{point.title}</h3><p>{point.text}</p></div>)}
        </div>
        <a href="https://t.me/falcon_tms" target="_blank" rel="noopener noreferrer" className={styles.contact}>
          <SiTelegram size={17} aria-hidden="true" /> {copy.contact}
        </a>
      </Reveal>
    </section>
  );
}
