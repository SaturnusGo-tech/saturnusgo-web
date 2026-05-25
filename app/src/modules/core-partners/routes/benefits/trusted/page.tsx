"use client"
import { useTheme } from "next-themes"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  ShieldCheck,
  Handshake,
  Sparkles,
  LineChart,
  LifeBuoy,
  FileCheck,
  Lock,
  Timer,
  Headphones,
} from "lucide-react"

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

export default function TrustedPartnershipPage() {
  const heroRef = useRef<HTMLElement>(null)
  const router = useRouter()
  const [open, setOpen] = useState<string | null>("onboarding")
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const tone = mounted && resolvedTheme === "light" ? "light" : "dark"
  
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
          el.style.opacity = `${Math.max(1 - p * 0.22, 0.84)}`
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="trusted-page" data-tone={tone}>

      <BackgroundEffects />

      {/* HERO */}
      <section ref={heroRef} className="hero-section">
        <div className="hero-content">
          <img
            src="https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/logo.png"
            alt="SaturnusGo"
            className="hero-logo-img"
          />
          <h1 className="hero-title">
            Trusted <span className="hero-accent">Partnership</span>
          </h1>
          <p className="hero-subtitle">
            Work with a platform designed for transparency, seamless UX, and dedicated partner support — building toward
            long-term growth and stability together.
          </p>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="principles-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Principles we don’t compromise</h2>
            <p className="section-subtitle">
              Trust is a product choice. We design flows, policies, and operations to be understandable and dependable.
            </p>
          </div>

          <div className="cards-grid">
            <div className="card">
              <div className="icon">
                <ShieldCheck />
              </div>
              <h3>Transparency by default</h3>
              <p>Clear pricing, policies, and availability — the same truth across every surface.</p>
            </div>

            <div className="card">
              <div className="icon">
                <Sparkles />
              </div>
              <h3>Seamless user experience</h3>
              <p>Less friction, fewer steps, higher confidence — a checkout flow that simply works.</p>
            </div>

            <div className="card">
              <div className="icon">
                <Handshake />
              </div>
              <h3>Long-term alignment</h3>
              <p>Stable APIs, sensible change management, and a roadmap shared early with partners.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET — text-focused */}
      <section className="textpack-section">
        <div className="section-container">
          <div className="textpack-card">
            <h3>What you get as a partner</h3>
            <div className="textpack-body">
              <p className="lead">
                One agreement, one integration — consistent execution everywhere your brand appears.
              </p>

              <div className="twocol">
                <div>
                  <h4>Onboarding & Integration</h4>
                  <ul>
                    <li>Dedicated onboarding with sandbox credentials and example payloads.</li>
                    <li>Stable REST/GraphQL endpoints with versioning and deprecation windows.</li>
                    <li>Loyalty, promo, and pricing rules enforced consistently at checkout.</li>
                  </ul>
                </div>
                <div>
                  <h4>Reliability & Operations</h4>
                  <ul>
                    <li>Real-time status and alerting for availability, pricing, and booking confirmations.</li>
                    <li>Error budgets and circuit breakers to protect your systems during spikes.</li>
                    <li>Operational runbooks and contact paths for fast incident resolution.</li>
                  </ul>
                </div>
              </div>

              <div className="twocol">
                <div>
                  <h4>Commercial & Insights</h4>
                  <ul>
                    <li>Transparent fees, settlement timelines, and unified monthly statements.</li>
                    <li>Performance analytics: views → adds → checkouts → conversions.</li>
                    <li>City/date cohorting to understand quality of demand and seasonality.</li>
                  </ul>
                </div>
                <div>
                  <h4>Trust & Safety</h4>
                  <ul>
                    <li>KYC/AML controls where applicable and dispute workflows that respect evidence.</li>
                    <li>Clear content & review policies with moderation that prioritizes fairness.</li>
                    <li>Security standards for data in transit/at rest and strict access control.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUPPORT & SLA — compact accordion */}
      <section className="support-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Support & SLAs</h2>
            <p className="section-subtitle">Clear contacts, clear timings, clear outcomes.</p>
          </div>

          <div className="acc">
            <AccItem
              id="onboarding"
              open={open === "onboarding"}
              onToggle={() => setOpen(open === "onboarding" ? null : "onboarding")}
              icon={<Headphones />}
              title="Onboarding"
            >
              <p>
                Named onboarding lead, weekly check-ins until go-live, and a validation checklist covering inventory,
                pricing, policies, and refunds. Sandbox first, then staged rollout by city or category.
              </p>
            </AccItem>

            <AccItem
              id="daily"
              open={open === "daily"}
              onToggle={() => setOpen(open === "daily" ? null : "daily")}
              icon={<LifeBuoy />}
              title="Day-to-day support"
            >
              <p>
                Partner portal with health dashboards and logs. Ticket portal + email for non-urgent issues, and chat
                window during local business hours.
              </p>
            </AccItem>

            <AccItem
              id="incidents"
              open={open === "incidents"}
              onToggle={() => setOpen(open === "incidents" ? null : "incidents")}
              icon={<Timer />}
              title="Incidents & uptime"
            >
              <p>
                Real-time status page, paging on critical signals, and post-incident reports within 48h. We maintain
                error budgets and autoscaling to keep flows stable in peak.
              </p>
            </AccItem>

            <AccItem
              id="change"
              open={open === "change"}
              onToggle={() => setOpen(open === "change" ? null : "change")}
              icon={<FileCheck />}
              title="Change management"
            >
              <p>
                Versioned APIs with deprecation windows, early RFCs for breaking changes, and migration guides with
                copy-paste examples. We announce changes in-product and by email.
              </p>
            </AccItem>
          </div>
        </div>
      </section>

      {/* POLICIES GLANCE — tiny chips (single row scroll) */}
      <section className="policies-section">
        <div className="section-container">
          <div className="chips-scroll">
            <div className="chips-track">
              <span className="chip">
                <Lock /> Security standards
              </span>
              <span className="chip">
                <FileCheck /> Clear refund rules
              </span>
              <span className="chip">
                <ShieldCheck /> Verified partners
              </span>
              <span className="chip">
                <LineChart /> Transparent fees
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS (planned goals) */}
      <section className="metrics-section">
        <div className="section-container">
          <div className="section-header" style={{ marginBottom: "40px" }}>
            <h2 className="section-title">Our roadmap goals</h2>
            <p className="section-subtitle">Building toward these milestones with our growing partner network</p>
          </div>

          <div className="metrics-grid">
            <div className="metric">
              <div className="num">2.5M+</div>
              <div className="label">planned monthly active users</div>
            </div>
            <div className="metric">
              <div className="num">150+</div>
              <div className="label">cities in development</div>
            </div>
            <div className="metric">
              <div className="num">4.8★</div>
              <div className="label">target partner satisfaction</div>
            </div>
          </div>

          <div className="metrics-grid" style={{ marginTop: "32px" }}>
            <div className="metric">
              <div className="num">99.9%</div>
              <div className="label">target uptime</div>
            </div>
            <div className="metric">
              <div className="num">24–48h</div>
              <div className="label">post-incident reports</div>
            </div>
            <div className="metric">
              <div className="num">T+15</div>
              <div className="label">standard settlement (days)</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="section-container cta-wrap">
          <div className="cta-copy">
            <h3>Let's build on trust</h3>
            <p>Partner with SaturnusGo as we build transparent execution and long-term growth together.</p>
          </div>
          <div className="cta-actions">
            <button className="btn-primary" onClick={() => router.push("/partners/apply")}>
              Apply now <ArrowRight className="btn-icon" />
            </button>
            <button className="btn-secondary" onClick={() => router.push("/partners")}>
              Back to partners
            </button>
          </div>
        </div>
      </section>

      {/* STYLES */}
      <style jsx global>{`
        .trusted-page {
          --bg-0: #0a0b0d; --bg-1: #0f1115; --grid: rgba(255,255,255,0.035);
          --txt: #e7e9ee; --txt-2: #c2c6cf; --txt-3: #9aa0a6;
          --white-02: rgba(255,255,255,0.02); --white-08: rgba(255,255,255,0.08); --white-12: rgba(255,255,255,0.12);
          --primary: #646cff; --primary-hover: #5a63f0;
          --radius-lg: 20px; --radius-xl: 28px; --shadow-2: 0 24px 60px -20px rgba(0,0,0,.5);
          min-height: 100vh;
          background: radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.08), transparent),
            linear-gradient(135deg, var(--bg-0), var(--bg-1));
          color: var(--txt);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .trusted-page[data-tone='light'],
        :global(html.light) .trusted-page {
          --bg-0:#f6f8fb; --bg-1:#ffffff; --grid:rgba(2,6,23,.06);
        
          --txt:#0f172a;      /* slate-900 */
          --txt-2:#475569;    /* slate-600 */
          --txt-3:#64748b;    /* slate-500 */
        
          /* те же «белые» токены, но из тёмных пигментов для светлой темы */
          --white-02:rgba(2,6,23,.02);
          --white-08:rgba(2,6,23,.06);
          --white-12:rgba(2,6,23,.12);
        
          background:
            radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.09), transparent),
            linear-gradient(135deg, var(--bg-0), var(--bg-1));
          color: var(--txt);
        }

        /* мягкая тень логотипа в hero в светлой теме */
.trusted-page[data-tone='light'] .hero-logo-img,
:global(html.light) .trusted-page .hero-logo-img {
  filter: drop-shadow(0 8px 16px rgba(2,6,23,.12));
}

/* чипы-плашки — чуть светлее фон */
.trusted-page[data-tone='light'] .chip,
:global(html.light) .trusted-page .chip {
  background: rgba(2,6,23,.04);
}

/* hover карт — чтобы не темнело слишком сильно в light */
.trusted-page[data-tone='light'] .card:hover,
:global(html.light) .trusted-page .card:hover {
  background: var(--white-08);
}

        /* HERO */
        .hero-section { position: relative; min-height: 68vh; display:flex; align-items:center; justify-content:center; padding: 92px 24px 56px; text-align:center; }
        .hero-content { max-width: 920px; width: 100%; }
        .hero-logo-img { max-width: 120px; height:auto; margin:0 auto 24px; display:block; filter: drop-shadow(0 10px 20px rgba(0,0,0,.35)); }
        .hero-title {
          font-size: clamp(44px, 7vw, 84px); font-weight: 850; letter-spacing: -0.02em; line-height: 1.06; margin: 0 0 10px;
          background: linear-gradient(to right, var(--txt), var(--txt-2)); -webkit-background-clip:text; background-clip:text; color: transparent;
        }
        .hero-accent { color: var(--primary); }
        .hero-subtitle { font-size: 20px; line-height: 1.7; color: var(--txt-2); max-width: 760px; margin: 0 auto 22px; }

        /* Sections */
        .section-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .section-header { text-align: center; margin-bottom: 56px; }
        .section-title {
          font-size: clamp(32px, 5vw, 48px); font-weight: 800; margin: 0 0 10px;
          background: linear-gradient(to right, var(--txt), var(--txt-2)); -webkit-background-clip:text; background-clip:text; color: transparent;
        }
        .section-subtitle { color: var(--txt-2); font-size: 18px; line-height: 1.6; margin: 0 auto; max-width: 760px; }

        /* Cards */
        .principles-section { padding: 100px 0 70px; }
        .cards-grid { display: grid; gap: 28px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
        .card {
          background: var(--white-08); border: 1px solid var(--white-12);
          border-radius: var(--radius-xl); padding: 28px; transition: all .25s ease;
        }
        .card:hover { transform: translateY(-6px); box-shadow: var(--shadow-2); background: var(--white-12); }
        .icon { width: 52px; height: 52px; border-radius: 16px; background: var(--primary); color:#fff; display:grid; place-items:center; margin-bottom: 14px; }
        .card h3 { margin: 0 0 8px; font-size: 20px; }
        .card p { margin: 0; color: var(--txt-2); line-height: 1.7; }

        /* Text pack */
        .textpack-section { padding: 90px 0; background: var(--white-02); }
        .textpack-card { background: var(--white-08); border: 1px solid var(--white-12); border-radius: var(--radius-xl); padding: 28px; }
        .textpack-card h3 { margin: 0 0 10px; font-size: 22px; }
        .textpack-body .lead { color: var(--txt); margin: 4px 0 16px; }
        .twocol { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-top: 6px; }
        .textpack-card h4 { margin: 10px 0 6px; font-size: 16px; color: var(--txt); letter-spacing: .2px; }
        .textpack-card ul { margin: 0; padding-left: 18px; color: var(--txt-2); line-height: 1.75; }

        /* Support (accordion) */
        .support-section { padding: 90px 0 70px; }
        .acc { max-width: 920px; margin: 0 auto; display: grid; gap: 12px; }
        .acc-item { background: var(--white-08); border: 1px solid var(--white-12); border-radius: var(--radius-lg); overflow: hidden; }
        .acc-head { display:flex; align-items:center; gap: 10px; width:100%; text-align:left; background: transparent; border:0; color: var(--txt); padding: 16px 18px; cursor: pointer; }
        .acc-head h4 { margin: 0; font-size: 16px; }
        .acc-icon { width: 18px; height: 18px; color: var(--primary); flex: 0 0 auto; }
        .acc-body { padding: 0 18px 16px; color: var(--txt-2); line-height: 1.75; }
        .acc-item[data-open="false"] .acc-body { display: none; }

        /* Policies chips */
        .policies-section { padding: 10px 0 80px; }
        .chips-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .chips-track { display: inline-flex; gap: 10px; padding: 6px; }
        .chip { display:inline-flex; align-items:center; gap:8px; padding: 10px 14px; border-radius: 999px; background: rgba(255,255,255,0.04); border: 1px solid var(--white-12); color: var(--txt-2); white-space: nowrap; }
        .chip svg { width: 16px; height: 16px; color: var(--txt-3); }

        /* Metrics */
        .metrics-section { padding: 60px 0 90px; background: var(--white-02); }
        .metrics-grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
        .metric { background: var(--white-08); border: 1px solid var(--white-12); border-radius: var(--radius-xl); padding: 24px; text-align:center; }
        .metric .num { font-size: 28px; font-weight: 800; color: var(--primary); margin-bottom: 6px; }
        .metric .label { color: var(--txt-2); font-weight: 600; }

        /* CTA */
        .cta-section { padding: 20px 0 120px; }
        .cta-wrap {
          display:grid; gap: 20px; grid-template-columns: 1.2fr auto; align-items:center;
          background: var(--white-08); border:1px solid var(--white-12); border-radius: var(--radius-xl); padding: 28px;
        }
        .cta-copy h3 { margin:0 0 6px; font-size:26px; }
        .cta-copy p { margin:0; color: var(--txt-2); }
        .cta-actions { display:flex; gap:12px; flex-wrap:wrap; }
        .btn-primary, .btn-secondary {
          display:inline-flex; align-items:center; gap:8px; padding:14px 22px; border-radius:18px; font-weight:700; font-size:15px;
          border:none; cursor:pointer; transition:all .2s ease;
        }
        .btn-primary { background: var(--primary); color:#fff; }
        .btn-primary:hover { background: var(--primary-hover); transform: translateY(-2px); }
        .btn-secondary { background: var(--white-08); color: var(--txt); border: 1px solid var(--white-12); }
        .btn-secondary:hover { background: var(--white-12); transform: translateY(-2px); }
        .btn-icon { width:16px; height:16px; }

        @media (max-width: 960px) {
          .cta-wrap { grid-template-columns: 1fr; text-align: center; }
          .cta-actions { justify-content: center; }
        }
      `}</style>
    </div>
  )
}

/** ---- Small accordion primitives (local, dependency-free) ---- */
function AccItem({
  id,
  open,
  onToggle,
  icon,
  title,
  children,
}: {
  id: string
  open: boolean
  onToggle: () => void
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="acc-item" data-open={open}>
      <button className="acc-head" aria-expanded={open} aria-controls={`acc-${id}`} onClick={onToggle}>
        <span className="acc-icon">{icon}</span>
        <h4>{title}</h4>
      </button>
      <div id={`acc-${id}`} className="acc-body">
        {children}
      </div>
    </div>
  )
}
