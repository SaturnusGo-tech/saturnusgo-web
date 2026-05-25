// app/privacy/page.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"

const BackgroundEffects = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div
      className="absolute inset-0 opacity-[0.015]"
      style={{
        backgroundImage: `
          linear-gradient(var(--grid) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    />
  </div>
)

export default function PrivacyPage() {
  const heroRef = useRef<HTMLElement>(null)

  // Parallax for hero (как на других экранах)
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY
          const h = el.offsetHeight || 1
          const p = Math.min(y / (h * 0.6), 1)
          el.style.transform = `translateY(${p * 14}px)`
          el.style.opacity = `${Math.max(1 - p * 0.22, 0.82)}`
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Theme (dark/light)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const tone = mounted && resolvedTheme === "light" ? "light" : "dark"

  return (
    <div className="policy-page" data-tone={tone}>
      <BackgroundEffects />

      {/* HERO — единый стиль с Reach/FAQ */}
      <section ref={heroRef} className="hero-section">
        <div className="hero-content">
         
          <h1 className="hero-title">
            Privacy Policy <span className="hero-accent">SaturnusGo</span>
          </h1>
          <p className="hero-subtitle">
            How we collect, use, and protect your data across our apps and services —
            written clearly and kept up-to-date.
          </p>
          <p className="hero-meta">
            Last updated: <time dateTime="2025-09-01">01 Sep 2025</time>
          </p>
        </div>
      </section>

      {/* TOC — чистые чипы, скролл по якорям */}
      <nav className="toc" aria-label="On this page">
        <div className="toc-inner">
          <a href="#collect" className="toc-chip">Information We Collect</a>
          <a href="#use" className="toc-chip">How We Use Information</a>
          <a href="#legal" className="toc-chip">Legal Bases</a>
          <a href="#sharing" className="toc-chip">Sharing & Disclosure</a>
          <a href="#retention" className="toc-chip">Data Retention</a>
          <a href="#transfers" className="toc-chip">International Transfers</a>
          <a href="#rights" className="toc-chip">Your Rights</a>
          <a href="#children" className="toc-chip">Children</a>
          <a href="#security" className="toc-chip">Security</a>
          <a href="#contact" className="toc-chip">Contact</a>
        </div>
      </nav>

      {/* BODY — ровная иерархия, профессиональная типографика */}
      <main className="content">
        <article className="doc">
          <p className="lead">
            This Privacy Policy explains how SaturnusGo (“we”, “us”, “our”) collects, uses, discloses, and safeguards
            your information when you use our applications, websites, and services (the “Services”).
          </p>

          {/* Collect */}
          <section id="collect" className="block">
            <header className="block-head">
              <p className="eyebrow">Section 1</p>
              <h2 className="h2">Information We Collect</h2>
              <p className="sub">
                We collect only what’s needed to deliver and improve the product. Below are the main categories.
              </p>
            </header>

            <dl className="keylist">
              <div>
                <dt>Account Data</dt>
                <dd>Name, email, phone, password hashes, account settings.</dd>
              </div>
              <div>
                <dt>Profile & Booking Data</dt>
                <dd>Preferences, itineraries, hotels/events, loyalty details, Saved Places.</dd>
              </div>
              <div>
                <dt>Payments</dt>
                <dd>Tokenized payment identifiers (we do not store full card numbers), transaction metadata.</dd>
              </div>
              <div>
                <dt>Device & Usage</dt>
                <dd>App version, device IDs, performance and crash logs, diagnostics, cookies.</dd>
              </div>
              <div>
                <dt>Location (with consent)</dt>
                <dd>Approximate or precise, to power mobility features (e.g., pickup, routing).</dd>
              </div>
            </dl>
          </section>

          {/* Use */}
          <section id="use" className="block">
            <header className="block-head">
              <p className="eyebrow">Section 2</p>
              <h2 className="h2">How We Use Information</h2>
              <p className="sub">
                We process data to operate core functionality, keep users safe, and improve the experience.
              </p>
            </header>

            <ul className="bullets">
              <li>Provide and improve the Services; personalize content and recommendations.</li>
              <li>Enable bookings, payments, receipts, and responsive customer support.</li>
              <li>Prevent fraud, ensure trust & safety, and comply with legal obligations.</li>
              <li>Send transactional messages and, where permitted, product updates or marketing.</li>
            </ul>
          </section>

          {/* Legal */}
          <section id="legal" className="block">
            <header className="block-head">
              <p className="eyebrow">Section 3</p>
              <h2 className="h2">Legal Bases</h2>
              <p className="sub">Where applicable, we rely on one or more of the following legal bases.</p>
            </header>

            <div className="cards">
              <div className="card">
                <h3>Contract</h3>
                <p>Processing necessary to perform the contract with you (e.g., bookings, payments).</p>
              </div>
              <div className="card">
                <h3>Legitimate Interests</h3>
                <p>Improving the product, preventing abuse, and securing our Services without overriding your rights.</p>
              </div>
              <div className="card">
                <h3>Consent</h3>
                <p>Where required (e.g., precise location, certain marketing). You may withdraw consent at any time.</p>
              </div>
              <div className="card">
                <h3>Legal Obligation</h3>
                <p>Compliance with applicable laws, regulatory requests, and lawful orders.</p>
              </div>
            </div>
          </section>

          {/* Sharing */}
          <section id="sharing" className="block">
            <header className="block-head">
              <p className="eyebrow">Section 4</p>
              <h2 className="h2">Sharing & Disclosure</h2>
              <p className="sub">
                We do not sell personal data. We share limited information as outlined below to provide the Services.
              </p>
            </header>

            <dl className="keylist">
              <div>
                <dt>Hospitality & Venue Partners</dt>
                <dd>To fulfill bookings, reservations, and event access according to your selections.</dd>
              </div>
              <div>
                <dt>Payments & Identity</dt>
                <dd>Trusted processors and verification providers for secure transactions and compliance.</dd>
              </div>
              <div>
                <dt>Vendors Under Contract</dt>
                <dd>Cloud, analytics, and support providers bound by confidentiality and data-processing terms.</dd>
              </div>
              <div>
                <dt>Law Enforcement / Regulators</dt>
                <dd>Where required by applicable law, or to protect rights, safety, and security.</dd>
              </div>
            </dl>
          </section>

          {/* Retention */}
          <section id="retention" className="block">
            <header className="block-head">
              <p className="eyebrow">Section 5</p>
              <h2 className="h2">Data Retention</h2>
              <p className="sub">We keep data for as long as needed for the purposes described and legal requirements.</p>
            </header>
            <p>
              We apply data minimization and retention schedules. When data is no longer necessary, we either delete it
              or de-identify it in accordance with our policies and applicable law.
            </p>
          </section>

          {/* Transfers */}
          <section id="transfers" className="block">
            <header className="block-head">
              <p className="eyebrow">Section 6</p>
              <h2 className="h2">International Transfers</h2>
              <p className="sub">Where data crosses borders, we use appropriate safeguards.</p>
            </header>
            <p>
              We implement mechanisms such as Standard Contractual Clauses (SCCs) or equivalent safeguards, in addition
              to technical and organizational measures to help protect your data.
            </p>
          </section>

          {/* Rights */}
          <section id="rights" className="block">
            <header className="block-head">
              <p className="eyebrow">Section 7</p>
              <h2 className="h2">Your Rights</h2>
              <p className="sub">
                Depending on your jurisdiction, you may have rights regarding your personal data.
              </p>
            </header>

            <ul className="bullets">
              <li>Access, correction, deletion, and portability.</li>
              <li>Restriction or objection to certain processing.</li>
              <li>Withdrawal of consent where processing is based on consent.</li>
              <li>Right to lodge a complaint with a supervisory authority.</li>
            </ul>
          </section>

          {/* Children */}
          <section id="children" className="block">
            <header className="block-head">
              <p className="eyebrow">Section 8</p>
              <h2 className="h2">Children</h2>
              <p className="sub">Our Services are not directed to children under the applicable age of consent.</p>
            </header>
            <p>
              If we become aware that we have collected personal data from a child contrary to applicable law, we will
              delete it and take appropriate steps to remediate.
            </p>
          </section>

          {/* Security */}
          <section id="security" className="block">
            <header className="block-head">
              <p className="eyebrow">Section 9</p>
              <h2 className="h2">Security</h2>
              <p className="sub">We use technical and organizational measures to protect data.</p>
            </header>
            <p>
              Security includes encryption in transit, access controls, monitoring, and regular reviews of our
              safeguards. No method is 100% secure, but we work to continuously improve our protections.
            </p>
          </section>

          {/* Contact */}
          <section id="contact" className="block">
            <header className="block-head">
              <p className="eyebrow">Section 10</p>
              <h2 className="h2">Contact</h2>
              <p className="sub">For privacy inquiries or requests, contact us:</p>
            </header>
            <div className="callout">
              <p>
                Email: <a href="mailto:privacy@saturnusgo.com">privacy@saturnusgo.com</a>
              </p>
              <p>
                Please include relevant IDs (booking/transaction) and your region. We respond as required by
                applicable law.
              </p>
            </div>
          </section>
        </article>
      </main>

      {/* STYLES */}
      <style jsx global>{`
        /* ============================
           TOKENS — DARK (default)
        =============================*/
        .policy-page {
          --bg-0: #0a0b0d; --bg-1: #0f1115; --grid: rgba(255,255,255,.035);

          --txt: #e7e9ee; --txt-2: #c2c6cf; --txt-3: #9aa0a6;
          --ink: #e9ebf2; --ink-2: #cbd1dc;

          --primary: #646cff; --primary-hover: #5a63f0;

          --white-02: rgba(255,255,255,.02);
          --white-06: rgba(255,255,255,.06);
          --white-08: rgba(255,255,255,.08);
          --white-12: rgba(255,255,255,.12);

          --rule: rgba(255,255,255,.10);
          --ring: rgba(100,108,255,.25);

          --radius-lg: 20px;
          --radius-xl: 28px;

          --shadow-1: 0 10px 30px rgba(0,0,0,.28), 0 1px 0 rgba(255,255,255,.02) inset;

          color: var(--txt);
          background:
            radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.08), transparent),
            linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 55%, var(--bg-0) 100%);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, system-ui, sans-serif;
          text-rendering: optimizeLegibility;
          min-height: 100vh;
        }

        /* ============================
           TOKENS — LIGHT OVERRIDES
        =============================*/
        .policy-page[data-tone='light'],
        :global(html.light) .policy-page {
          --bg-0: #f6f8fb; --bg-1: #ffffff; --grid: rgba(2,6,23,.06);

          --txt: #0f172a; --txt-2: #475569; --txt-3: #64748b;
          --ink: #0b1220; --ink-2: #334155;

          --white-02: rgba(2,6,23,.02);
          --white-06: rgba(2,6,23,.06);
          --white-08: rgba(2,6,23,.08);
          --white-12: rgba(2,6,23,.12);

          --rule: rgba(2,6,23,.12);

          background:
            radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.09), transparent),
            linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 55%, var(--bg-0) 100%);
          color: var(--txt);
        }

        /* ============================
           HERO — единый стиль
        =============================*/
        .hero-section {
          position: relative;
          min-height: 85vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 92px 24px 80px;
          text-align: center;
        }
        .hero-content { max-width: 920px; width: 100%; }
        .hero-logo-img {
          max-width: 120px; height: auto; margin: 0 auto 24px; display: block;
          filter: drop-shadow(0 10px 20px rgba(0,0,0,.35));
        }
        .policy-page[data-tone='light'] .hero-logo-img,
        :global(html.light) .policy-page .hero-logo-img {
          filter: drop-shadow(0 8px 16px rgba(2,6,23,.12));
        }
        .hero-title {
          font-size: clamp(44px, 7vw, 84px);
          font-weight: 850;
          letter-spacing: -0.02em;
          line-height: 1.06;
          margin: 0 0 12px;
          background: linear-gradient(to right, var(--ink), var(--ink-2));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .hero-accent { color: var(--primary); }
        .hero-subtitle {
          font-size: 20px;
          line-height: 1.7;
          color: var(--txt-2);
          max-width: 760px;
          margin: 0 auto 6px;
        }
        .hero-meta {
          color: var(--txt-3);
          font-size: 14px;
          margin: 6px 0 0;
        }

        /* ============================
           TOC — чипы
        =============================*/
        .toc {
          position: sticky; top: 0; z-index: 5;
          backdrop-filter: saturate(140%) blur(6px);
          background:
            linear-gradient(to bottom, color-mix(in oklab, var(--bg-0) 88%, transparent), transparent 90%);
          border-top: 1px solid var(--white-12);
          border-bottom: 1px solid var(--white-12);
        }
        .toc-inner {
          max-width: 1100px; margin: 0 auto; padding: 10px 16px;
          display: flex; gap: 12px; overflow-x: auto; -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }
        .toc-inner::-webkit-scrollbar { height: 8px; }
        .toc-inner::-webkit-scrollbar-thumb { background: var(--white-12); border-radius: 999px; }
        .toc-chip {
          padding: 10px 14px; border-radius: 999px; white-space: nowrap;
          border: 1px solid var(--white-12); background: var(--white-06);
          color: var(--txt-2); font-weight: 700; font-size: 13px; text-decoration: none;
          transition: all .2s ease;
        }
        .toc-chip:hover {
          background: var(--white-08); color: var(--txt);
          box-shadow: 0 0 0 6px var(--ring);
        }

        /* ============================
           CONTENT
        =============================*/
        .content { padding: 34px 0 120px; }
        .doc {
          max-width: 1100px; margin: 0 auto; padding: 0 24px;
        }
        .lead {
          font-size: clamp(18px, 1.6vw, 20px);
          line-height: 1.9;
          color: var(--txt-2);
          max-width: 68ch;
          margin: 0 0 22px;
        }

        .block { margin: 38px 0 0; }
        .block-head { margin: 0 0 12px; }
        .eyebrow {
          text-transform: uppercase; letter-spacing: .12em; font-weight: 800;
          font-size: 11px; color: var(--txt-3); margin: 0 0 6px;
        }
        .h2 {
          font-size: clamp(24px, 2.6vw, 30px);
          font-weight: 900; letter-spacing: -0.01em; line-height: 1.25;
          margin: 0 0 6px;
          background: linear-gradient(to right, var(--txt), var(--txt-2));
          -webkit-background-clip: text; background-clip: text; color: transparent;
          scroll-margin-top: 96px; /* якоря не прячутся под sticky TOC */
        }
        .sub {
          font-size: 16px; color: var(--txt-2); margin: 0;
          max-width: 72ch;
        }

        /* Definition list — аккуратные пары термин/описание */
        .keylist {
          display: grid; gap: 10px; margin: 14px 0 0;
          max-width: 72ch;
        }
        .keylist > div {
          display: grid; gap: 6px; padding: 12px 14px;
          border: 1px solid var(--white-12); border-radius: var(--radius-lg);
          background: var(--white-02);
        }
        .keylist dt {
          font-weight: 900; color: var(--txt);
          letter-spacing: .01em;
        }
        .keylist dd {
          margin: 0; color: var(--txt-2); line-height: 1.75;
        }

        /* Bulleted list — чистые маркеры и ритм */
        .bullets {
          margin: 14px 0 0; padding: 0 0 0 1.1em; max-width: 72ch;
        }
        .bullets li {
          margin: 0 0 8px; color: var(--txt-2); line-height: 1.85;
        }

        /* Cards grid (legal bases) */
        .cards {
          display: grid; gap: 12px; margin-top: 14px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          max-width: 100%;
        }
        @media (max-width: 780px) {
          .cards { grid-template-columns: 1fr; }
        }
        .card {
          padding: 16px 16px 14px; border: 1px solid var(--white-12);
          border-radius: var(--radius-xl); background: var(--white-06);
        }
        .card h3 {
          margin: 0 0 6px; font-size: 16px; font-weight: 900; letter-spacing: .01em;
          color: var(--txt);
        }
        .card p { margin: 0; color: var(--txt-2); line-height: 1.75; }

        /* Callout (contact) */
        .callout {
          margin-top: 14px; padding: 16px;
          border: 1px solid var(--white-12); border-radius: var(--radius-xl);
          background:
            radial-gradient(400px 160px at 0% 0%, rgba(100,108,255,.12), transparent),
            var(--white-06);
        }
        .callout p { margin: 0 0 8px; color: var(--txt-2); }
        .callout a {
          color: var(--primary); font-weight: 800; text-decoration: none;
        }
        .callout a:hover { color: var(--primary-hover); text-decoration: underline; }

        /* Links focus */
        :is(a, button):focus-visible {
          outline: none;
          box-shadow: 0 0 0 6px var(--ring), 0 0 0 2px var(--primary);
          border-radius: 12px;
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .hero-section { transform: none !important; opacity: 1 !important; }
        }
      `}</style>
    </div>
  )
}
