"use client";

import { useMemo, useState } from "react";

import { useLanguage } from "../../../../../../shared/i18n";
import styles from "../styles/styles.module.css";

export default function FeatureCards() {
  const { dictionary } = useLanguage();
  const services = dictionary.home.serviceModules;
  const [activeId, setActiveId] = useState(services[0]?.id);
  const activeService = useMemo(
    () => services.find((service) => service.id === activeId),
    [activeId, services],
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
        {services.map((service) => {
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
