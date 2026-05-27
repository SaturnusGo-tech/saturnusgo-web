"use client";

import { useState } from "react";

import { useLanguage } from "../../../../../../shared/i18n";
import styles from "../styles/styles.module.css";

export default function HowItFeels() {
  const { dictionary } = useLanguage();
  const { rideClasses, howItFeels } = dictionary.home;
  const [activeIndex, setActiveIndex] = useState(0);
  const active = rideClasses[activeIndex];

  if (!active) {
    return null;
  }

  const goPrevious = () => {
    setActiveIndex((value) =>
      value === 0 ? rideClasses.length - 1 : value - 1,
    );
  };

  const goNext = () => {
    setActiveIndex((value) =>
      value === rideClasses.length - 1 ? 0 : value + 1,
    );
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.copy}>
        <span className={styles.kicker}>{howItFeels.kicker}</span>
        <h3 className={styles.title}>{active.name}</h3>
        <span className={styles.flowLabel}>{active.eyebrow}</span>
        <p className={styles.description}>{active.description}</p>

        <div className={styles.controls}>
          <button type="button" onClick={goPrevious} aria-label={howItFeels.previousLabel}>←</button>
          <button type="button" onClick={goNext} aria-label={howItFeels.nextLabel}>→</button>
        </div>
      </div>

      <div className={styles.visual}>
        <img className={styles.image} src={active.image} alt="" />
        <span className={styles.visualIndex}>{String(activeIndex + 1).padStart(2, "0")}</span>
      </div>

      <div className={styles.tabs} aria-label={howItFeels.selectorLabel}>
        {rideClasses.map((item, index) => (
          <button
            className={styles.tab}
            data-active={index === activeIndex}
            type="button"
            key={item.id}
            onClick={() => setActiveIndex(index)}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}
