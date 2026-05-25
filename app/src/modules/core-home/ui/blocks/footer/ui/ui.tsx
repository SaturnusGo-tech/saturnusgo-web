"use client";

import styles from "../styles/styles.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} itemScope itemType="https://schema.org/Organization">
      <div className={styles.inner}>
        <div className={styles.brand} itemProp="name">SaturnusGo</div>
        <address className={styles.contact} aria-label="Contact" itemProp="founder" itemScope itemType="https://schema.org/Person">
          <span className={styles.contactName} itemProp="name">Mercury Rucks</span>
          <span className={styles.contactRole}>Founder &amp; CEO | CTO</span>
          <a className={styles.mail} href="mailto:founder@saturnusgoinvest.com" itemProp="email">
            founder@saturnusgoinvest.com
          </a>
        </address>
        <div className={styles.legal}>© {year} SaturnusGo. All rights reserved.</div>
      </div>
    </footer>
  );
}
