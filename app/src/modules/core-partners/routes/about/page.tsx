// app/about/page.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  ArrowRight,
  Globe2,
  Heart,
  Layers,
  LineChart,
  Rocket,
  Shield,
  Sparkles,
  Users2,
  Building2,
  MapPin,
  Smartphone,
  Timer,
  Quote,
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

export default function AboutPage() {
  const router = useRouter()
  const heroRef = useRef<HTMLElement>(null)

  // light/dark tone (SSR-safe)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const tone = mounted && resolvedTheme === "light" ? "light" : "dark"

  // parallax hero
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
          el.style.transform = `translateY(${p * 16}px)`
          el.style.opacity = `${Math.max(1 - p * 0.22, 0.8)}`
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const [openFAQ, setOpenFAQ] = useState<number | null>(0)

  return (
    <div className="about-page" data-tone={tone}>
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
            About <span className="hero-company">SaturnusGo</span>
          </h1>
          <p className="hero-subtitle">
            We’re building a travel super-app where rides, hotels, events, and payments work together as one seamless
            experience — so people don’t have to think, it just works.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => router.push("/partners/apply")}>
              Partner with us <ArrowRight className="btn-icon" />
            </button>
            <button
              className="btn-secondary"
              onClick={() => document.getElementById("mission")?.scrollIntoView({ behavior: "smooth" })}
            >
              Our mission
            </button>
          </div>
        </div>
      </section>

      {/* KEY PILLARS */}
      <section className="pillars-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">What we stand for</h2>
            <p className="section-subtitle">
              Three product truths guide every decision we make — from architecture to the last pixel of the interface.
            </p>
          </div>

          <div className="pillars-grid">
            <div className="pillar-card">
              <div className="pillar-icon">
                <Sparkles />
              </div>
              <h3>Seamless by default</h3>
              <p>
                The best interface is the one you don’t notice. Flows are designed to remove friction, not rearrange it.
              </p>
            </div>
            <div className="pillar-card">
              <div className="pillar-icon">
                <Layers />
              </div>
              <h3>One connected system</h3>
              <p>
                Rides, hotels, events, loyalty, and payments live in one architecture — real-time, consistent, reliable.
              </p>
            </div>
            <div className="pillar-card">
              <div className="pillar-icon">
                <Shield />
              </div>
              <h3>Trust at the core</h3>
              <p>
                Clear pricing, transparent policies, and dependable support. We earn trust by design, not by promise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section id="mission" className="mission-section">
        <div className="section-container mission-grid">
          <div className="mission-card">
            <h2 className="section-title">Our mission</h2>
            <p className="lead">
              Make smart travel effortless for everyone — unifying mobility, stays, experiences, and payments into a
              single, elegant flow.
            </p>
            <ul className="bullets">
              <li>
                <Smartphone /> One app. All essentials for the trip.
              </li>
              <li>
                <Timer /> Less planning time, more living time.
              </li>
              <li>
                <Heart /> Human-grade UX that simply “gets out of the way”.
              </li>
            </ul>
          </div>

          <div className="mission-card">
            <h2 className="section-title">Our vision</h2>
            <p className="lead">
              A world where great service is the standard — and every city feels native the moment you arrive.
            </p>
            <ul className="bullets">
              <li>
                <Globe2 /> Global network of hospitality partners.
              </li>
              <li>
                <Users2 /> Community-powered recommendations with real utility.
              </li>
              <li>
                <LineChart /> Sustainable growth through product quality and loyalty.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* STORY / TIMELINE */}
      <section className="story-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Our story</h2>
            <p className="section-subtitle">
              Built by an engineer-founder who believes that world-class service is both an art and an engineering
              discipline.
            </p>
          </div>

          <div className="timeline">
            <div className="t-item">
              <div className="t-badge">2023</div>
              <h4>First commit</h4>
              <p>
                The SaturnusGo journey begins. React Native front-end, NestJS + Postgres back-end, real-time
                architecture, and a relentless focus on UX.
              </p>
            </div>
            <div className="t-item">
              <div className="t-badge">2024</div>
              <h4>From MVP to Super-App</h4>
              <p>
                Hotels, wishlist + AI routes, events, wallet & transfers, subscriptions & loyalty — one coherent system,
                not a collection of features.
              </p>
            </div>
            <div className="t-item">
              <div className="t-badge">2025</div>
              <h4>Partner-ready</h4>
              <p>
                Onboarding flows for hotels and venues, booking orchestration, pricing transparency, and partner
                analytics — ready to scale with hospitality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS / PROOF */}
      <section className="metrics-section">
        <div className="section-container metrics-grid">
          <div className="metric-card">
            <div className="metric-num">1</div>
            <div className="metric-label">engineer-founder</div>
          </div>
          <div className="metric-card">
            <div className="metric-num">2+</div>
            <div className="metric-label">years of full-time building</div>
          </div>
          <div className="metric-card">
            <div className="metric-num">5</div>
            <div className="metric-label">core modules connected</div>
          </div>
          <div className="metric-card">
            <div className="metric-num">∞</div>
            <div className="metric-label">focus on UX quality</div>
          </div>
        </div>
      </section>

      {/* GEOS / FOOTPRINT */}
      <section className="footprint-section">
        <div className="section-container footprint-grid">
          <div className="footprint-card">
            <h3>
              <MapPin /> Initial focus
            </h3>
            <p>South America first — hospitality-driven markets where service quality and convenience matter most.</p>
          </div>
          <div className="footprint-card">
            <h3>
              <Building2 /> Hospitality partners
            </h3>
            <p>Hotels, resorts, event venues, restaurants — brands that share our standards for service and experience.</p>
          </div>
          <div className="footprint-card">
            <h3>
              <Rocket /> What’s next
            </h3>
            <p>Deeper partner integrations, loyalty economy, and expansion to new cities with high travel density.</p>
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="quote-section">
        <div className="section-container">
          <div className="quote-card">
            <Quote className="quote-icon" />
            <p>
              “Great service is invisible — everything just happens at the right moment. That’s the product we’re
              building: where the interface dissolves and the trip becomes effortless.”
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Questions we get</h2>
            <p className="section-subtitle">Short, practical answers about who we are and how we work.</p>
          </div>

          <div className="faq-list">
            {FAQS.map((item, i) => (
              <div key={i} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  aria-expanded={openFAQ === i}
                >
                  <span>{item.q}</span>
                  <span className="faq-toggle">{openFAQ === i ? "−" : "+"}</span>
                </button>
                {openFAQ === i && (
                  <div className="faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="section-container cta-wrap">
          <div className="cta-copy">
            <h3>Let’s build remarkable service together</h3>
            <p>Join the SaturnusGo ecosystem and put your brand in the flow of seamless travel.</p>
          </div>
          <div className="cta-actions">
            <button className="btn-primary" onClick={() => router.push("/partners/apply")}>
              Apply now <ArrowRight className="btn-icon" />
            </button>
            <button className="btn-secondary" onClick={() => router.push("/partners")}>
              Explore partners
            </button>
          </div>
        </div>
      </section>

      {/* STYLES */}
      <style jsx global>{`
        /* ================================
           TOKENS — DARK (default)
        ==================================*/
        .about-page {
          --bg-0: #0a0b0d;
          --bg-1: #0f1115;
          --grid: rgba(255, 255, 255, 0.035);

          --txt: #e7e9ee;
          --txt-2: #c2c6cf;
          --txt-3: #9aa0a6;

          --white-02: rgba(255, 255, 255, 0.02);
          --white-04: rgba(255, 255, 255, 0.04);
          --white-08: rgba(255, 255, 255, 0.08);
          --white-12: rgba(255, 255, 255, 0.12);

          --primary: #646cff;
          --primary-hover: #5a63f0;

          --radius-lg: 20px;
          --radius-xl: 28px;

          --shadow-2: 0 24px 60px -20px rgba(0, 0, 0, 0.5);

          min-height: 100vh;
          background:
            radial-gradient(1200px 600px at 50% -10%, rgba(100, 108, 255, 0.08), transparent),
            linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 50%, var(--bg-0) 100%);
          color: var(--txt);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* ================================
           TOKENS — LIGHT OVERRIDES
           (по data-атрибуту и по html.light)
        ==================================*/
        .about-page[data-tone='light'],
        :global(html.light) .about-page {
          --bg-0: #f6f8fb;
          --bg-1: #ffffff;
          --grid: rgba(2, 6, 23, 0.06);

          --txt: #0f172a;   /* slate-900 */
          --txt-2: #475569; /* slate-600 */
          --txt-3: #64748b; /* slate-500 */

          --white-02: rgba(2, 6, 23, 0.02);
          --white-04: rgba(2, 6, 23, 0.04);
          --white-08: rgba(2, 6, 23, 0.06);
          --white-12: rgba(2, 6, 23, 0.12);

          --shadow-2: 0 24px 60px -20px rgba(2, 6, 23, 0.18);

          background:
            radial-gradient(1200px 600px at 50% -10%, rgba(100, 108, 255, 0.10), transparent),
            linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 50%, var(--bg-0) 100%);
          color: var(--txt);
        }

        /* HERO */
        .hero-section {
          position: relative;
          min-height: 78vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 92px 24px 56px;
          text-align: center;
        }
        .hero-content { max-width: 900px; width: 100%; }
        .hero-logo-img {
          max-width: 120px;
          height: auto;
          margin: 0 auto 24px;
          display: block;
          filter: drop-shadow(0 10px 20px rgba(0,0,0,0.35));
        }
        .about-page[data-tone='light'] .hero-logo-img,
        :global(html.light) .about-page .hero-logo-img {
          filter: drop-shadow(0 8px 16px rgba(2,6,23,0.08));
        }
        .hero-title {
          font-size: clamp(44px, 7vw, 84px);
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.06;
          margin: 0 0 12px;
          background: linear-gradient(to right, var(--txt), var(--txt-2));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .hero-company { color: var(--primary); }
        .hero-subtitle {
          font-size: 20px;
          line-height: 1.7;
          color: var(--txt-2);
          max-width: 720px;
          margin: 0 auto 28px;
        }
        .hero-actions {
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
        }
        .btn-primary, .btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 22px; border-radius: 18px; font-weight: 700; font-size: 15px;
          border: none; cursor: pointer; transition: all .2s ease;
        }
        .btn-primary { background: var(--primary); color: #fff; }
        .btn-primary:hover { background: var(--primary-hover); transform: translateY(-2px); }
        .btn-secondary { background: var(--white-08); color: var(--txt); border: 1px solid var(--white-12); }
        .btn-secondary:hover { background: var(--white-12); transform: translateY(-2px); }
        .btn-icon { width: 16px; height: 16px; }

        /* SECTIONS */
        .section-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .section-header { text-align: center; margin-bottom: 56px; }
        .section-title {
          font-size: clamp(32px, 5vw, 48px); font-weight: 800; margin: 0 0 10px;
          background: linear-gradient(to right, var(--txt), var(--txt-2));
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .section-subtitle { color: var(--txt-2); font-size: 18px; line-height: 1.6; margin: 0 auto; max-width: 760px; }

        /* PILLARS */
        .pillars-section { padding: 110px 0 80px; }
        .pillars-grid {
          display: grid; gap: 28px;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }
        .pillar-card {
          background: var(--white-08); border: 1px solid var(--white-12);
          border-radius: var(--radius-xl); padding: 32px; text-align: left;
          transition: all .25s ease;
        }
        .pillar-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-2); background: var(--white-12); }
        .pillar-icon {
          width: 56px; height: 56px; border-radius: 16px; background: var(--primary);
          color: #fff; display: grid; place-items: center; margin-bottom: 16px;
        }
        .pillar-card h3 { margin: 0 0 8px; font-size: 22px; }
        .pillar-card p { margin: 0; color: var(--txt-2); line-height: 1.7; }

        /* MISSION */
        .mission-section { padding: 110px 0; background: var(--white-02); }
        .mission-grid { display: grid; gap: 28px; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
        .mission-card {
          background: var(--white-08); border: 1px solid var(--white-12);
          border-radius: var(--radius-xl); padding: 32px 32px 28px;
        }
        .lead { font-size: 18px; line-height: 1.7; color: var(--txt); margin: 6px 0 16px; }
        .bullets { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
        .bullets li { display: flex; align-items: center; gap: 10px; color: var(--txt-2); }
        .bullets svg { width: 18px; height: 18px; color: var(--primary); flex: 0 0 auto; }

        /* STORY */
        .story-section { padding: 110px 0 90px; }
        .timeline { display: grid; gap: 18px; }
        .t-item {
          position: relative; padding: 22px 22px 20px 22px;
          background: var(--white-08); border: 1px solid var(--white-12); border-radius: var(--radius-xl);
        }
        .t-badge {
          position: absolute; top: -12px; left: 16px;
          background: var(--primary); color: #fff; padding: 6px 10px; border-radius: 999px; font-weight: 700; font-size: 12px;
        }
        .t-item h4 { margin: 8px 0 6px; font-size: 20px; }
        .t-item p { margin: 0; color: var(--txt-2); line-height: 1.7; }

        /* METRICS */
        .metrics-section { padding: 90px 0; background: var(--white-02); }
        .metrics-grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
        .metric-card {
          background: var(--white-08); border: 1px solid var(--white-12);
          border-radius: var(--radius-xl); padding: 28px; text-align: center;
        }
        .metric-num { font-size: 40px; font-weight: 800; margin-bottom: 6px; color: var(--primary); }
        .metric-label { color: var(--txt-2); font-weight: 600; letter-spacing: .2px; }

        /* FOOTPRINT */
        .footprint-section { padding: 110px 0; }
        .footprint-grid { display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
        .footprint-card {
          background: var(--white-08); border: 1px solid var(--white-12); border-radius: var(--radius-xl);
          padding: 28px;
        }
        .footprint-card h3 { display: flex; align-items: center; gap: 10px; margin: 0 0 8px; font-size: 20px; }
        .footprint-card p { margin: 0; color: var(--txt-2); line-height: 1.7; }

        /* QUOTE */
        .quote-section { padding: 90px 0; background: var(--white-02); }
        .quote-card {
          max-width: 900px; margin: 0 auto; padding: 32px 28px;
          background: var(--white-08); border: 1px solid var(--white-12); border-radius: var(--radius-xl);
          text-align: center;
        }
        .quote-icon { width: 28px; height: 28px; color: var(--primary); margin-bottom: 12px; }
        .quote-card p { margin: 0; font-size: 20px; line-height: 1.8; color: var(--txt); }

        /* FAQ */
        .faq-section { padding: 110px 0; }
        .faq-list { max-width: 820px; margin: 0 auto; }
        .faq-item { border-bottom: 1px solid var(--white-12); }
        .faq-question {
          width: 100%; padding: 22px 0; display: flex; justify-content: space-between; align-items: center;
          background: none; border: none; color: var(--txt); font-size: 18px; font-weight: 700; text-align: left; cursor: pointer;
        }
        .faq-toggle { color: var(--txt-3); font-size: 22px; line-height: 1; }
        .faq-answer { padding: 0 0 18px; color: var(--txt-2); line-height: 1.7; }

        /* CTA */
        .cta-section { padding: 90px 0 120px; }
        .cta-wrap {
          display: grid; gap: 20px; grid-template-columns: 1.2fr auto; align-items: center;
          background: var(--white-08); border: 1px solid var(--white-12); border-radius: var(--radius-xl); padding: 28px;
        }
        .cta-copy h3 { margin: 0 0 6px; font-size: 26px; }
        .cta-copy p { margin: 0; color: var(--txt-2); }
        .cta-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        @media (max-width: 900px) {
          .cta-wrap { grid-template-columns: 1fr; text-align: center; }
          .cta-actions { justify-content: center; }
        }

        /* RESPONSIVE */
        @media (max-width: 860px) {
          .hero-subtitle { font-size: 18px; }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce){
          .hero-section { transform: none !important; opacity: 1 !important; }
        }
      `}</style>
    </div>
  )
}

const FAQS = [
  {
    q: "What is SaturnusGo in one sentence?",
    a: "An all-in-one travel super-app that connects rides, hotels, events, payments, and loyalty in a single seamless experience.",
  },
  {
    q: "How do you work with partners?",
    a: "We integrate directly with hotels and venues, providing booking orchestration, transparent pricing, and partner analytics.",
  },
  {
    q: "What makes your UX different?",
    a: "We design for zero friction — fewer steps, clear language, and real-time state so the interface gets out of the way.",
  },
  {
    q: "Which markets are you focusing on first?",
    a: "We’re starting with South America and expanding to hospitality-dense cities where great service is valued.",
  },
  {
    q: "How can we get in touch?",
    a: "Apply on the Partners page or use the contact section in the app; we respond quickly and guide you through onboarding.",
  },
]
