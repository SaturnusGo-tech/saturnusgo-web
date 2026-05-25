// app/compliance/page.tsx
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

export default function CompliancePage() {
  const heroRef = useRef<HTMLElement>(null)

  // Parallax hero
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

  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const tone = mounted && resolvedTheme === "light" ? "light" : "dark"

  return (
    <div className="policy-page" data-tone={tone}>
      <BackgroundEffects />

      {/* HERO — общий стиль */}
      <section ref={heroRef} className="hero-section">
        <div className="hero-content">
         
          <h1 className="hero-title">
            Compliance <span className="hero-accent">SaturnusGo</span>
          </h1>
          <p className="hero-subtitle">Governance, risk, and compliance overview.</p>
          <p className="hero-meta">
            Last updated: <time dateTime="2025-09-01">01 Sep 2025</time>
          </p>
        </div>
      </section>

      {/* TOC */}
      <nav className="toc" aria-label="On this page">
        <div className="toc-inner">
          <a href="#governance" className="toc-chip">Governance</a>
          <a href="#security" className="toc-chip">Security Program</a>
          <a href="#privacy" className="toc-chip">Privacy & Data Protection</a>
          <a href="#payments" className="toc-chip">Payments & Financial</a>
          <a href="#regional" className="toc-chip">Regional Obligations</a>
          <a href="#contact" className="toc-chip">Contact</a>
        </div>
      </nav>

      {/* BODY — чистая структура */}
      <main className="content">
        <article className="doc">
          <p className="lead">
            SaturnusGo is committed to regulatory and industry compliance across the regions where we operate. This page
            summarizes our approach to governance, risk, and compliance.
          </p>

          {/* 1 */}
          <section id="governance" className="block">
            <header className="block-head">
              <p className="eyebrow">Section 1</p>
              <h2 className="h2">Governance</h2>
              <p className="sub">Ownership, policies, and oversight.</p>
            </header>
            <ul className="bullets">
              <li>Documented policies for privacy, security, incident response, and vendor management.</li>
              <li>Executive oversight with periodic risk and policy reviews.</li>
              <li>Designated contacts for legal, security, and privacy matters.</li>
            </ul>
          </section>

          {/* 2 */}
          <section id="security" className="block">
            <header className="block-head">
              <p className="eyebrow">Section 2</p>
              <h2 className="h2">Security Program</h2>
              <p className="sub">Controls across people, process, and technology.</p>
            </header>
            <dl className="keylist">
              <div>
                <dt>Encryption</dt>
                <dd>In transit and at rest where applicable; key management aligned with best practices.</dd>
              </div>
              <div>
                <dt>Access Control</dt>
                <dd>Least privilege, MFA for sensitive operations, and periodic access reviews.</dd>
              </div>
              <div>
                <dt>SDLC</dt>
                <dd>Secure development lifecycle, code review, and dependency monitoring.</dd>
              </div>
              <div>
                <dt>Vulnerability Management</dt>
                <dd>Regular scanning, patching SLAs, and risk-based remediation.</dd>
              </div>
              <div>
                <dt>Logging & Monitoring</dt>
                <dd>Audit logs and alerting for critical systems, with retention policies.</dd>
              </div>
              <div>
                <dt>Incident Response</dt>
                <dd>Playbooks, on-call coverage, and post-incident reviews.</dd>
              </div>
            </dl>
          </section>

          {/* 3 */}
          <section id="privacy" className="block">
            <header className="block-head">
              <p className="eyebrow">Section 3</p>
              <h2 className="h2">Privacy & Data Protection</h2>
              <p className="sub">Minimization, purpose limitation, and user rights.</p>
            </header>
            <ul className="bullets">
              <li>Data mapping, retention schedules, and access governance.</li>
              <li>Support for data subject requests where applicable.</li>
              <li>Privacy by design in new features and integrations.</li>
            </ul>
          </section>

          {/* 4 */}
          <section id="payments" className="block">
            <header className="block-head">
              <p className="eyebrow">Section 4</p>
              <h2 className="h2">Payments & Financial</h2>
              <p className="sub">Work with certified processors and follow applicable standards.</p>
            </header>
            <p>
              We collaborate with certified payment processors and follow applicable standards for handling payment data,
              including tokenization and segregation of duties where relevant.
            </p>
          </section>

          {/* 5 */}
          <section id="regional" className="block">
            <header className="block-head">
              <p className="eyebrow">Section 5</p>
              <h2 className="h2">Regional Obligations</h2>
              <p className="sub">Local requirements by market.</p>
            </header>
            <p>
              We evaluate local laws (consumer protection, e-commerce, transportation, events) before launch and on an
              ongoing basis, updating policies, disclosures, and controls as regulations evolve.
            </p>
          </section>

          {/* 6 */}
          <section id="contact" className="block">
            <header className="block-head">
              <p className="eyebrow">Section 6</p>
              <h2 className="h2">Contact</h2>
              <p className="sub">Compliance inquiries and notices.</p>
            </header>
            <div className="callout">
              <p>
                Email: <a href="mailto:compliance@saturnusgo.com">compliance@saturnusgo.com</a>
              </p>
            </div>
          </section>
        </article>
      </main>

      {/* STYLES */}
      <style jsx global>{`
        /* TOKENS — DARK */
        .policy-page {
          --bg-0:#0a0b0d; --bg-1:#0f1115; --grid:rgba(255,255,255,.035);
          --txt:#e7e9ee; --txt-2:#c2c6cf; --txt-3:#9aa0a6;
          --ink:#e9ebf2; --ink-2:#cbd1dc;
          --primary:#646cff; --primary-hover:#5a63f0;
          --white-02:rgba(255,255,255,.02); --white-06:rgba(255,255,255,.06); --white-08:rgba(255,255,255,.08); --white-12:rgba(255,255,255,.12);
          --rule:rgba(255,255,255,.10); --ring:rgba(100,108,255,.25);
          --radius-lg:20px; --radius-xl:28px;
          --shadow-1:0 10px 30px rgba(0,0,0,.28), 0 1px 0 rgba(255,255,255,.02) inset;

          color:var(--txt);
          background:
            radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.08), transparent),
            linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 55%, var(--bg-0) 100%);
          font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, system-ui, sans-serif;
          text-rendering:optimizeLegibility; min-height:100vh;
        }
        /* TOKENS — LIGHT */
        .policy-page[data-tone='light'],
        :global(html.light) .policy-page {
          --bg-0:#f6f8fb; --bg-1:#ffffff; --grid:rgba(2,6,23,.06);
          --txt:#0f172a; --txt-2:#475569; --txt-3:#64748b;
          --ink:#0b1220; --ink-2:#334155;
          --rule:rgba(2,6,23,.12);
          background:
            radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.09), transparent),
            linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 55%, var(--bg-0) 100%);
          color:var(--txt);
        }

        /* HERO */
        .hero-section{position:relative; min-height:85vh; display:flex; align-items:center; justify-content:center; padding:92px 24px 80px; text-align:center}
        .hero-content{max-width:920px; width:100%}
        .hero-logo-img{max-width:120px; height:auto; margin:0 auto 24px; display:block; filter:drop-shadow(0 10px 20px rgba(0,0,0,.35))}
        .policy-page[data-tone='light'] .hero-logo-img,:global(html.light) .policy-page .hero-logo-img{filter:drop-shadow(0 8px 16px rgba(2,6,23,.12))}
        .hero-title{font-size:clamp(44px,7vw,84px); font-weight:850; letter-spacing:-.02em; line-height:1.06; margin:0 0 12px; background:linear-gradient(to right, var(--ink), var(--ink-2)); -webkit-background-clip:text; background-clip:text; color:transparent}
        .hero-accent{color:var(--primary)}
        .hero-subtitle{font-size:20px; line-height:1.7; color:var(--txt-2); max-width:760px; margin:0 auto 6px}
        .hero-meta{color:var(--txt-3); font-size:14px; margin:6px 0 0}

        /* TOC — chips */
        .toc{position:sticky; top:0; z-index:5; backdrop-filter:saturate(140%) blur(6px); background:linear-gradient(to bottom, color-mix(in oklab, var(--bg-0) 88%, transparent), transparent 90%); border-top:1px solid var(--white-12); border-bottom:1px solid var(--white-12)}
        .toc-inner{max-width:1100px; margin:0 auto; padding:10px 16px; display:flex; gap:12px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:thin}
        .toc-inner::-webkit-scrollbar{height:8px}
        .toc-inner::-webkit-scrollbar-thumb{background:var(--white-12); border-radius:999px}
        .toc-chip{padding:10px 14px; border-radius:999px; white-space:nowrap; border:1px solid var(--white-12); background:var(--white-06); color:var(--txt-2); font-weight:700; font-size:13px; text-decoration:none; transition:all .2s ease}
        .toc-chip:hover{background:var(--white-08); color:var(--txt); box-shadow:0 0 0 6px var(--ring)}

        /* CONTENT */
        .content{padding:34px 0 120px}
        .doc{max-width:1100px; margin:0 auto; padding:0 24px}
        .lead{font-size:clamp(18px,1.6vw,20px); line-height:1.9; color:var(--txt-2); max-width:68ch; margin:0 0 22px}

        .block{margin:38px 0 0}
        .block-head{margin:0 0 12px}
        .eyebrow{text-transform:uppercase; letter-spacing:.12em; font-weight:800; font-size:11px; color:var(--txt-3); margin:0 0 6px}
        .h2{font-size:clamp(24px,2.6vw,30px); font-weight:900; letter-spacing:-.01em; line-height:1.25; margin:0 0 6px; background:linear-gradient(to right, var(--txt), var(--txt-2)); -webkit-background-clip:text; background-clip:text; color:transparent; scroll-margin-top:96px}
        .sub{font-size:16px; color:var(--txt-2); margin:0; max-width:72ch}

        .doc p{color:var(--txt-2); line-height:1.85; margin:0 0 12px; max-width:72ch}
        .doc a{color:var(--primary); text-decoration:none; font-weight:800}
        .doc a:hover{color:var(--primary-hover); text-decoration:underline}

        .bullets{margin:14px 0 0; padding:0 0 0 1.1em; max-width:72ch}
        .bullets li{margin:0 0 8px; color:var(--txt-2); line-height:1.85}

        .keylist{display:grid; gap:10px; margin:14px 0 0; max-width:72ch}
        .keylist > div{display:grid; gap:6px; padding:12px 14px; border:1px solid var(--white-12); border-radius:var(--radius-lg); background:var(--white-02)}
        .keylist dt{font-weight:900; color:var(--txt); letter-spacing:.01em}
        .keylist dd{margin:0; color:var(--txt-2); line-height:1.75}

        .callout{margin-top:14px; padding:16px; border:1px solid var(--white-12); border-radius:var(--radius-xl); background:radial-gradient(400px 160px at 0% 0%, rgba(100,108,255,.12), transparent), var(--white-06)}
        .callout p{margin:0 0 8px; color:var(--txt-2)}

        :is(a, button):focus-visible{outline:none; box-shadow:0 0 0 6px var(--ring), 0 0 0 2px var(--primary); border-radius:12px}

        @media (prefers-reduced-motion: reduce){
          .hero-section{transform:none !important; opacity:1 !important}
        }
      `}</style>
    </div>
  )
}
