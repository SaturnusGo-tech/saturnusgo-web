'use client';

import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" itemScope itemType="https://schema.org/Organization">
      <div className="footer__inner">
        <div className="footer__brand">
          <span itemProp="name">SaturnusGo</span>
        </div>

        {/* Контакты — профессиональный блок */}
        <address className="footer__contact" aria-label="Contact" itemProp="founder" itemScope itemType="https://schema.org/Person">
          <span className="footer__contactName" itemProp="name">Mercury Rucks</span>
          <span className="footer__contactRole">Founder &amp; CEO&nbsp;| CTO</span>
          <a
            className="footer__contactMail"
            href="mailto:founder@saturnusgoinvest.com"
            itemProp="email"
            aria-label="Email founder"
          >
            founder@saturnusgoinvest.com
          </a>
        </address>

        <div className="footer__legal">
          © {year} SaturnusGo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
