"use client";

import { CORE_HOME_EXPERIENCE_STEPS } from "../../../../constants";
import styles from "../styles/styles.module.css";

export default function HowItFeels() {
  return (
    <div className={styles.wrap}>
      {CORE_HOME_EXPERIENCE_STEPS.map((step) => (
        <article className={styles.step} key={step.index}>
          <div className={styles.icon} aria-hidden>{step.index}</div>
          <h3 className={styles.title}>{step.title}</h3>
          <p className={styles.description}>{step.description}</p>
        </article>
      ))}
    </div>
  );
}
