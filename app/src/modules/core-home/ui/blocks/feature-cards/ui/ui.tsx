"use client";

import { CORE_HOME_FEATURES } from "../../../../constants";
import styles from "../styles/styles.module.css";

export default function FeatureCards() {
  return (
    <div className={styles.grid}>
      {CORE_HOME_FEATURES.map((item) => (
        <article className={styles.card} key={item.title}>
          <div className={styles.icon} aria-hidden>{item.icon}</div>
          <h3 className={styles.title}>{item.title}</h3>
          <p className={styles.description}>{item.description}</p>
        </article>
      ))}
    </div>
  );
}
