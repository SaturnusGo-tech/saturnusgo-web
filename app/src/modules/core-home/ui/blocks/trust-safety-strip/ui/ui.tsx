"use client";

import { useLanguage } from "../../../../../../shared/i18n";
import styles from "../styles/styles.module.css";

export default function TrustSafetyStrip() {
  const { dictionary } = useLanguage();
  const cards = dictionary.home.presenceCards;

  return (
    <div className={styles.grid}>
      {cards.map((item) => (
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
