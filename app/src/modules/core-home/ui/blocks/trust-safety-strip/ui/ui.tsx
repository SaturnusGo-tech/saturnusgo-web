"use client";

import { CORE_HOME_PRESENCE_CARDS } from "../../../../constants";
import styles from "../styles/styles.module.css";

export default function TrustSafetyStrip() {
  return (
    <div className={styles.grid}>
      {CORE_HOME_PRESENCE_CARDS.map((item) => (
        <article className={styles.item} key={`${item.city}-${item.entity}`}>
          <img className={styles.image} src={item.image} alt="" />
          <div className={styles.overlay} />
          <div className={styles.copy}>
            <span className={styles.country}>{item.country}</span>
            <h3 className={styles.city}>{item.city}</h3>
            <p className={styles.entity}>{item.entity}</p>
            <p className={styles.detail}>{item.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
