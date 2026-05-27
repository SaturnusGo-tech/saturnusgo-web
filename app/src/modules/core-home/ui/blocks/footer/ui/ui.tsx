"use client";

import {
  CORE_HOME_SOCIAL_LINKS,
} from "../../../../constants";
import { useLanguage } from "../../../../../../shared/i18n";
import styles from "../styles/styles.module.css";

export default function Footer() {
  const { dictionary } = useLanguage();
  const footer = dictionary.home.footer;
  const year = new Date().getFullYear();

  return (
    <footer
      className={styles.footer}
      itemScope
      itemType="https://schema.org/Organization"
    >
      <div className={styles.top}>
        <div className={styles.brand} itemProp="name">
          SaturnusGo
        </div>
        <div className={styles.socials} aria-label={footer.socialsLabel}>
          {CORE_HOME_SOCIAL_LINKS.map((link) => (
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
              key={link.label}
            >
              {link.shortLabel}
            </a>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {footer.groups.map((group) => (
          <nav
            className={styles.group}
            aria-label={group.title}
            key={group.title}
          >
            <h3>{group.title}</h3>
            {group.links.map((link) => (
              <a href={link.href} key={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        ))}
      </div>

      <div className={styles.bottom}>
        <address
          className={styles.contact}
          itemProp="founder"
          itemScope
          itemType="https://schema.org/Person"
        >
          <span itemProp="name">Mercury Rucks</span>
          <span>{footer.founderRole}</span>
          <a href="mailto:founder@saturnusgoinvest.com" itemProp="email">
            founder@saturnusgoinvest.com
          </a>
        </address>
        <small>© {year} SaturnusGo. {footer.rights}</small>
      </div>
    </footer>
  );
}
