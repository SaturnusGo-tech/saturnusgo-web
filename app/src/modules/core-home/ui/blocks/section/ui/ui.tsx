"use client";

import styles from "../styles/styles.module.css";
import type { CoreHomeSectionProps } from "../../../../types";

export default function Section({
  id,
  kicker,
  title,
  subtitle,
  titleAside,
  children,
  className,
}: CoreHomeSectionProps) {
  const sectionClassName = className ? `${styles.section} ${className}` : styles.section;

  return (
    <section id={id} className={`${sectionClassName} reveal`}>
      <div className={styles.head}>
        {kicker ? <div className={styles.kicker}>{kicker}</div> : null}
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{title}</h2>
          {titleAside ? <div className={styles.titleAside}>{titleAside}</div> : null}
        </div>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
