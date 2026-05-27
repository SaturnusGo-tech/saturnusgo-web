"use client";

import { useState } from "react";

import { CORE_HOME_RIDE_CLASSES } from "../../../../constants";
import styles from "../styles/styles.module.css";

export default function HowItFeels() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = CORE_HOME_RIDE_CLASSES[activeIndex];

  if (!active) {
    return null;
  }

  const goPrevious = () => {
    setActiveIndex((value) =>
      value === 0 ? CORE_HOME_RIDE_CLASSES.length - 1 : value - 1,
    );
  };

  const goNext = () => {
    setActiveIndex((value) =>
      value === CORE_HOME_RIDE_CLASSES.length - 1 ? 0 : value + 1,
    );
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.copy}>
        <span className={styles.kicker}>Our city flows</span>
        <h3 className={styles.title}>{active.name}</h3>
        <span className={styles.flowLabel}>{active.eyebrow}</span>
        <p className={styles.description}>{active.description}</p>

        <div className={styles.controls}>
          <button type="button" onClick={goPrevious} aria-label="Previous city flow">←</button>
          <button type="button" onClick={goNext} aria-label="Next city flow">→</button>
        </div>
      </div>

      <div className={styles.visual}>
        <img className={styles.image} src={active.image} alt="" />
        <span className={styles.visualIndex}>{String(activeIndex + 1).padStart(2, "0")}</span>
      </div>

      <div className={styles.tabs} aria-label="City flow selector">
        {CORE_HOME_RIDE_CLASSES.map((item, index) => (
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
