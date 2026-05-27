"use client";

import { useMemo, useState } from "react";

import { CORE_HOME_SERVICE_MODULES } from "../../../../constants";
import styles from "../styles/styles.module.css";

export default function FeatureCards() {
  const [activeId, setActiveId] = useState(CORE_HOME_SERVICE_MODULES[0]?.id);
  const activeService = useMemo(
    () => CORE_HOME_SERVICE_MODULES.find((service) => service.id === activeId),
    [activeId],
  );

  if (!activeService) {
    return null;
  }

  return (
    <div className={styles.grid}>
      <div className={styles.preview}>
        <img className={styles.image} src={activeService.image} alt="" />
        <div className={styles.previewCopy}>
          <span>{activeService.eyebrow}</span>
          <p>{activeService.description}</p>
        </div>
      </div>

      <div className={styles.list}>
        {CORE_HOME_SERVICE_MODULES.map((service) => {
          const isActive = service.id === activeId;

          return (
            <article id={service.id} className={styles.card} data-active={isActive} key={service.id}>
              <button
                className={styles.button}
                type="button"
                aria-expanded={isActive}
                aria-controls={`service-panel-${service.id}`}
                onClick={() => setActiveId(service.id)}
              >
                <span className={styles.index}>{service.index}</span>
                <span className={styles.heading}>{service.title}</span>
                <span className={styles.plus} aria-hidden />
              </button>

              <div
                id={`service-panel-${service.id}`}
                className={styles.panel}
                aria-hidden={!isActive}
              >
                <p>{service.summary}</p>
                <a href={service.href}>{service.action} <span aria-hidden>→</span></a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
