"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { ArrowRight, Layers, CreditCard, Heart, Sparkles, Shield, Link2, LineChart } from "lucide-react"

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

export default function IntegratedPlatform() {
  const heroRef = useRef<HTMLElement>(null)
  const [activePill, setActivePill] = useState("Analytics")

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
          el.style.opacity = `${Math.max(1 - p * 0.22, 0.8)}`
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Светлый/тёмный тон (Светлый Фонд)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const tone = mounted && resolvedTheme === "light" ? "light" : "dark"

  const pills = [
    { id: "Analytics", icon: LineChart, text: "Real-time Analytics" },
    { id: "Integration", icon: Link2, text: "API Integration" },
    { id: "Security", icon: Shield, text: "Enterprise Security" },
    { id: "Performance", icon: Sparkles, text: "Performance" },
    { id: "Support", icon: Heart, text: "24/7 Support" },
  ]

  return (
    <div className="platform-page" data-tone={tone}>
      <BackgroundEffects />

      {/* HERO */}
      <section ref={heroRef} className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Enterprise <span className="hero-accent">SaaS</span> Platform
          </h1>
          <p className="hero-subtitle">
            Powerful tools and integrations designed for businesses that need scalable, reliable, and secure software
            solutions with enterprise-grade features.
          </p>

          {/* Pills */}
          <div className="pill-scroll" role="tablist" aria-label="Platform Features">
            <div className="pill-track">
              {pills.map(({ id, icon: Icon, text }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={activePill === id}
                  className={`pill ${activePill === id ? "pill-on" : ""}`}
                  onClick={() => setActivePill(id)}
                  title={text}
                >
                  <Icon />
                  <span className="nowrap">{text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="value-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Why enterprises choose our platform</h2>
            <p className="section-subtitle">
              Enterprise-grade infrastructure with the flexibility to scale from startup to global corporation.
            </p>
          </div>

          <div className="cards-grid">
            <div className="card">
              <div className="icon"><Shield /></div>
              <h3>Enterprise Security</h3>
              <p>SOC 2 Type II compliance, end-to-end encryption, and advanced security features for your business data.</p>
            </div>
            <div className="card">
              <div className="icon"><LineChart /></div>
              <h3>Advanced Analytics</h3>
              <p>Real-time dashboards, custom reports, and predictive insights to optimize your business operations.</p>
            </div>
            <div className="card">
              <div className="icon"><Layers /></div>
              <h3>Seamless Integration</h3>
              <p>Connect with your existing systems through our robust API ecosystem and pre-built integrations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FLOWS */}
      <section className="flows-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Business workflow automation</h2>
            <p className="section-subtitle">See how our platform streamlines complex business scenarios.</p>
          </div>

          <div className="scenarios-grid">
            <div className="scenario">
              <div className="scenario-head"><CreditCard /> <h4>Payment Processing</h4></div>
              <p>Automated billing, subscription management, and payment processing with compliance and security built-in.</p>
            </div>
            <div className="scenario">
              <div className="scenario-head"><Shield /> <h4>Access Control</h4></div>
              <p>Role-based permissions, SSO integration, and automated security policies with audit trails.</p>
            </div>
            <div className="scenario">
              <div className="scenario-head"><LineChart /> <h4>Performance Monitoring</h4></div>
              <p>Real-time monitoring, automated alerts, and performance optimization with predictive analytics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SEGMENT */}
      <section className="segment-section">
        <div className="section-container">
          <div className="segment-card">
            {activePill === "Analytics" && (
              <>
                <h3>Real-time Analytics</h3>
                <ul className="bullets">
                  <li>Executive dashboards with comprehensive business metrics and KPI tracking.</li>
                  <li>Predictive analytics for forecasting and business intelligence insights.</li>
                  <li>Custom reporting with automated alerts and threshold monitoring.</li>
                </ul>
              </>
            )}
            {activePill === "Integration" && (
              <>
                <h3>API Integration</h3>
                <ul className="bullets">
                  <li>RESTful APIs with comprehensive documentation and SDKs for major platforms.</li>
                  <li>Webhook support for real-time data synchronization with your systems.</li>
                  <li>Pre-built connectors for CRM, ERP, and other enterprise systems.</li>
                </ul>
              </>
            )}
            {activePill === "Security" && (
              <>
                <h3>Enterprise Security</h3>
                <ul className="bullets">
                  <li>SOC 2 Type II certified infrastructure with regular security audits.</li>
                  <li>Single Sign-On (SSO) with SAML 2.0 and OAuth 2.0.</li>
                  <li>RBAC with granular permissions and audit trails.</li>
                </ul>
              </>
            )}
            {activePill === "Performance" && (
              <>
                <h3>Performance</h3>
                <ul className="bullets">
                  <li>99.9% uptime SLA with global CDN and redundant infrastructure.</li>
                  <li>Sub-second response times via intelligent caching and optimization.</li>
                  <li>Auto-scaling architecture for peak loads.</li>
                </ul>
              </>
            )}
            {activePill === "Support" && (
              <>
                <h3>24/7 Support</h3>
                <ul className="bullets">
                  <li>Dedicated customer success manager for enterprise accounts.</li>
                  <li>Priority support with guaranteed response times and escalation.</li>
                  <li>Comprehensive onboarding and training programs.</li>
                </ul>
              </>
            )}
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="integrations-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Enterprise implementation</h2>
            <p className="section-subtitle">Seamless deployment with dedicated support and custom configuration options.</p>
          </div>

          <div className="i-steps-scroll" aria-label="Implementation steps">
            <div className="i-steps-track">
              <span className="i-step">Requirements analysis</span>
              <span className="i-step">Custom configuration</span>
              <span className="i-step">System integration</span>
              <span className="i-step">Team training</span>
              <span className="i-step">Go-live support</span>
            </div>
          </div>

          <div className="i-two-col">
            <div className="i-pane">
              <h4>Custom Configuration</h4>
              <p>Tailored setup to match your business processes, workflows, and compliance requirements. White-label options available.</p>
              <ul>
                <li>Custom branding and themes</li>
                <li>Flexible workflows and business rules</li>
                <li>Multi-tenant and multi-language support</li>
              </ul>
            </div>

            <div className="i-pane">
              <h4>Dedicated Support</h4>
              <p>Enterprise-grade support with dedicated account management, priority response times, and training programs.</p>
              <ul>
                <li>Customer success manager</li>
                <li>Priority technical support (SLA)</li>
                <li>Training & certification</li>
              </ul>
            </div>
          </div>

          <div className="i-outcome">
            <Link2 className="i-outcome-icon" />
            <p>Complete enterprise platform with advanced security, analytics, and seamless integration with your systems.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="section-container cta-wrap">
          <div className="cta-copy">
            <h3>Transform your business operations</h3>
            <p>Join leading enterprises using our platform for streamlined, secure, and scalable solutions.</p>
          </div>
          <div className="cta-actions">
            <button className="btn-primary">
              Schedule demo <ArrowRight className="btn-icon" />
            </button>
            <button className="btn-secondary">Learn more</button>
          </div>
        </div>
      </section>

      {/* STYLES */}
      <style jsx global>{`
        /* ============================
           TOKENS — DARK (default)
        =============================*/
        .platform-page {
          --bg-0:#0a0b0d; --bg-1:#0f1115; --grid:rgba(255,255,255,.035);
          --txt:#e7e9ee; --txt-2:#c2c6cf; --txt-3:#9aa0a6;
          --white-02:rgba(255,255,255,.02); --white-08:rgba(255,255,255,.08); --white-12:rgba(255,255,255,.12);
          --primary:#646cff; --primary-hover:#5a63f0;
          --radius-lg:20px; --radius-xl:28px; --shadow-2:0 24px 60px -20px rgba(0,0,0,.5);
          min-height:100vh;
          background:
            radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.08), transparent),
            linear-gradient(135deg, var(--bg-0), var(--bg-1));
          color:var(--txt);
          font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
        }

        /* ============================
           TOKENS — LIGHT OVERRIDES
        =============================*/
        .platform-page[data-tone='light'],
        :global(html.light) .platform-page {
          --bg-0:#f6f8fb; --bg-1:#ffffff; --grid:rgba(2,6,23,.06);
          --txt:#0f172a; --txt-2:#475569; --txt-3:#64748b;
          --white-02:rgba(2,6,23,.02); --white-08:rgba(2,6,23,.06); --white-12:rgba(2,6,23,.12);
          background:
            radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.09), transparent),
            linear-gradient(135deg, var(--bg-0), var(--bg-1));
          color:var(--txt);
        }

        /* HERO */
        .hero-section{ position:relative; min-height:72vh; display:flex; align-items:center; justify-content:center; padding:92px 24px 56px; text-align:center; }
        .hero-content{ max-width:920px; width:100%; }
        .hero-title{
          font-size:clamp(44px,7vw,84px); font-weight:850; letter-spacing:-.02em; line-height:1.06; margin:0 0 10px;
          background:linear-gradient(to right, var(--txt), var(--txt-2)); -webkit-background-clip:text; background-clip:text; color:transparent;
        }
        .hero-accent{ color:var(--primary); }
        .hero-subtitle{ font-size:20px; line-height:1.7; color:var(--txt-2); max-width:760px; margin:0 auto 22px; }

        /* PILLS */
        .pill-scroll{ overflow-x:auto; -webkit-overflow-scrolling:touch; margin:12px auto 0; max-width:920px; }
        .pill-track{ display:inline-flex; gap:10px; padding:6px; }
        .pill{
          display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:999px;
          background:rgba(255,255,255,0.04); border:1px solid var(--white-12);
          color:var(--txt-2); font-weight:700; white-space:nowrap; cursor:pointer; transition:all .2s ease;
        }
        .platform-page[data-tone='light'] .pill,
        :global(html.light) .platform-page .pill{
          background:rgba(2,6,23,.03);
        }
        .pill svg{ width:16px; height:16px; color:var(--txt-3); flex:0 0 auto; }
        .pill .nowrap{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .pill-on{ background:var(--primary); color:#fff; border-color:transparent; }
        .pill-on svg{ color:#fff; }

        /* SECTIONS */
        .section-container{ max-width:1200px; margin:0 auto; padding:0 24px; }
        .section-header{ text-align:center; margin-bottom:56px; }
        .section-title{
          font-size:clamp(32px,5vw,48px); font-weight:800; margin:0 0 10px;
          background:linear-gradient(to right, var(--txt), var(--txt-2)); -webkit-background-clip:text; background-clip:text; color:transparent;
        }
        .section-subtitle{ color:var(--txt-2); font-size:18px; line-height:1.6; margin:0 auto; max-width:760px; }

        /* VALUE */
        .value-section{ padding:110px 0 80px; }
        .cards-grid{ display:grid; gap:28px; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); }
        .card{
          background:var(--white-08); border:1px solid var(--white-12);
          border-radius:var(--radius-xl); padding:28px; transition:all .25s ease;
        }
        .card:hover{ transform:translateY(-6px); box-shadow:var(--shadow-2); background:var(--white-12); }
        .icon{ width:52px; height:52px; border-radius:16px; background:var(--primary); color:#fff; display:grid; place-items:center; margin-bottom:14px; }
        .card h3{ margin:0 0 8px; font-size:20px; }
        .card p{ margin:0; color:var(--txt-2); line-height:1.7; }

        /* FLOWS */
        .flows-section{ padding:100px 0; background:var(--white-02); }
        .scenarios-grid{ display:grid; gap:18px; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); }
        .scenario{
          background:var(--white-08); border:1px solid var(--white-12);
          border-radius:var(--radius-xl); padding:24px;
        }
        .scenario-head{ display:flex; align-items:center; gap:10px; margin-bottom:8px; }
        .scenario-head svg{ width:18px; height:18px; color:var(--primary); }
        .scenario h4{ margin:0; font-size:18px; }
        .scenario p{ margin:8px 0 0; color:var(--txt-2); line-height:1.7; }

        /* SEGMENT */
        .segment-section{ padding:90px 0; }
        .segment-card{
          background:var(--white-08); border:1px solid var(--white-12);
          border-radius:var(--radius-xl); padding:28px; max-width:900px; margin:0 auto;
        }
        .segment-card h3{ margin:0 0 10px; font-size:22px; }
        .bullets{ list-style:none; padding:0; margin:0; display:grid; gap:10px; }
        .bullets li{ position:relative; padding-left:18px; color:var(--txt-2); line-height:1.7; }
        .bullets li:before{ content:"•"; position:absolute; left:0; color:var(--primary); }

        /* INTEGRATIONS */
        .integrations-section{ padding:100px 0; background:var(--white-02); }
        .i-steps-scroll{ overflow-x:auto; -webkit-overflow-scrolling:touch; margin:0 auto 18px; max-width:1000px; }
        .i-steps-track{ display:inline-flex; gap:10px; padding:6px; }
        .i-step{
          white-space:nowrap; font-weight:800; font-size:13px; letter-spacing:.3px;
          padding:8px 12px; border-radius:999px; background:rgba(255,255,255,.05); border:1px solid var(--white-12); color:var(--txt-2);
        }
        .platform-page[data-tone='light'] .i-step,
        :global(html.light) .platform-page .i-step{
          background:rgba(2,6,23,.04);
        }
        .i-two-col{ display:grid; gap:18px; grid-template-columns:repeat(2, minmax(280px, 1fr)); }
        @media (max-width:900px){ .i-two-col{ grid-template-columns:1fr; } }
        .i-pane{ background:var(--white-08); border:1px solid var(--white-12); border-radius:var(--radius-xl); padding:24px; }
        .i-pane h4{ margin:0 0 6px; font-size:18px; }
        .i-pane p{ margin:0 0 10px; color:var(--txt-2); line-height:1.7; }
        .i-pane ul{ margin:0; padding-left:18px; color:var(--txt-2); line-height:1.7; }

        .i-outcome{
          margin-top:18px; display:grid; grid-template-columns:auto 1fr; gap:12px; align-items:center;
          border-radius:var(--radius-xl);
          background:radial-gradient(600px 200px at 0% 0%, rgba(100,108,255,.12), transparent), rgba(255,255,255,.04);
          border:1px solid var(--white-12); padding:18px 20px;
        }
        .platform-page[data-tone='light'] .i-outcome,
        :global(html.light) .platform-page .i-outcome{
          background:radial-gradient(600px 200px at 0% 0%, rgba(100,108,255,.12), transparent), rgba(2,6,23,.03);
        }
        .i-outcome-icon{ width:22px; height:22px; color:var(--primary); }
        .i-outcome p{ margin:0; color:var(--txt); line-height:1.7; }

        /* CTA */
        .cta-section{ padding:90px 0 120px; }
        .cta-wrap{
          display:grid; gap:20px; grid-template-columns:1.2fr auto; align-items:center;
          background:var(--white-08); border:1px solid var(--white-12); border-radius:var(--radius-xl); padding:28px;
        }
        .cta-copy h3{ margin:0 0 6px; font-size:26px; }
        .cta-copy p{ margin:0; color:var(--txt-2); }
        .cta-actions{ display:flex; gap:12px; flex-wrap:wrap; }
        .btn-primary, .btn-secondary{
          display:inline-flex; align-items:center; gap:8px; padding:14px 22px; border-radius:18px; font-weight:700; font-size:15px;
          border:none; cursor:pointer; transition:all .2s ease;
        }
        .btn-primary{ background:var(--primary); color:#fff; }
        .btn-primary:hover{ background:var(--primary-hover); transform:translateY(-2px); }
        .btn-secondary{ background:var(--white-08); color:var(--txt); border:1px solid var(--white-12); }
        .btn-secondary:hover{ background:var(--white-12); transform:translateY(-2px); }
        .btn-icon{ width:16px; height:16px; }

        @media (max-width:960px){
          .cta-wrap{ grid-template-columns:1fr; text-align:center; }
          .cta-actions{ justify-content:center; }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce){
          .hero-section { transform:none !important; opacity:1 !important; }
        }
      `}</style>
    </div>
  )
}
