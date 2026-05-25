"use client";

import { CORE_HOME_SOCIAL_LINKS } from "../../../../constants";
import type { SocialLinksProps } from "../../../../types";
import styles from "../styles/styles.module.css";

export default function SocialLinks({
  size = "sm",
  children,
  compact = false,
  scroll = false,
  className,
}: SocialLinksProps) {
  const classNames = [
    styles.social,
    size === "lg" ? styles.large : "",
    compact ? styles.compact : "",
    scroll ? styles.scroll : "",
    className ?? "",
  ].filter(Boolean).join(" ");

  return (
    <div className={classNames} aria-label="Social links">
      {CORE_HOME_SOCIAL_LINKS.map((link) => (
        <a
          className={styles.link}
          href={link.href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={link.label}
          title={link.label}
          key={link.label}
        >
          <span className={styles.short} aria-hidden>{link.shortLabel}</span>
          <span className={styles.label}>{link.label}</span>
        </a>
      ))}
      {children ? <span className={styles.extra}>{children}</span> : null}
    </div>
  );
}
