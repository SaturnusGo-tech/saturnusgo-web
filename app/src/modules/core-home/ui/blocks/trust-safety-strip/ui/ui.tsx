"use client";

import { CORE_HOME_TRUST_ITEMS } from "../../../../constants";
import styles from "../styles/styles.module.css";

export default function TrustSafetyStrip() {
  return (
    <div className={styles.grid}>
      {CORE_HOME_TRUST_ITEMS.map((item) => (
        <article className={styles.item} key={item.label}>
          <span className={styles.label}>{item.label}</span>
          <div className={styles.value}>{item.value}</div>
          <p className={styles.description}>{item.description}</p>
        </article>
      ))}
    </div>
  );
}
