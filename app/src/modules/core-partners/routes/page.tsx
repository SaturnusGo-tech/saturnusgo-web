"use client"

import { useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { ArrowRight, Users, Zap, Shield, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"

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

const partnerLogos = [
  { name: "Marriott", logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Marriott_logo_PNG1.png" },
  { name: "Hyatt", logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Hyatt_logo_PNG2.png" },
  { name: "Ritz-Carlton", logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Ritz-Carlton-Logo_PNG2.png" },
  { name: "Courtyard", logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Courtyard_logo_PNG2.png" },
  { name: "Accor", logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Accor_logo_PNG3.png" },
]

const benefits = [
  {
    icon: Users,
    title: "Reach New Travelers",
    description:
      "Connect with SaturnusGo’s global user base — tourists, business travelers, and locals who book rides, hotels, and events in one app.",
    href: "/partners/benefits/reach",
  },
  {
    icon: Zap,
    title: "Integrated Super-App Platform",
    description:
      "Be part of a unified travel ecosystem: ride-hailing, hotel booking, event tickets, payments, and loyalty — all connected in real time.",
    href: "/partners/benefits/platform",
  },
  {
    icon: Shield,
    title: "Trusted Partnership",
    description:
      "Work with a platform built on transparency, seamless UX, and dedicated partner support — ensuring long-term growth and stability.",
    href: "/partners/benefits/trusted",
  },
]

const steps = [
  { number: "01", title: "Apply to Join", description: "Tell us about your business and how you’d like to collaborate within the SaturnusGo ecosystem." },
  { number: "02", title: "Alignment & Setup", description: "We’ll review your application and integrate your services — from booking systems to payment flows." },
  { number: "03", title: "Go Live", description: "Once connected, your brand becomes available to SaturnusGo users — ready for bookings, rides, and engagement." },
]

const faqs = [
  { question: "What is the SaturnusGo Partner Program?", answer: "It’s our way to collaborate with hotels, event organizers, and service providers who want to be part of the all-in-one travel super-app." },
  { question: "Who can join the program?", answer: "Hotels, resorts, event venues, restaurants, and service providers that share our vision of seamless travel and hospitality." },
  { question: "What kind of services can partners integrate?", answer: "Accommodation booking, event ticketing, ride services, local experiences, or complementary lifestyle services." },
  { question: "What support will I get as a partner?", answer: "Dedicated onboarding, technical integration support, marketing exposure inside the app, and access to performance analytics." },
  { question: "How do I become a partner?", answer: "Click the 'Apply Now' button and fill in the form. Our team will review your application and get back to you within a few days." },
]

const FAQItem = ({ faq }: { faq: (typeof faqs)[0]; index: number }) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="faq-item">
      <button className="faq-question" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        <span>{faq.question}</span>
        {isOpen ? <ChevronUp className="faq-icon" /> : <ChevronDown className="faq-icon" />}
      </button>
      {isOpen && (
        <div className="faq-answer">
          <p>{faq.answer}</p>
        </div>
      )}
    </div>
  )
}

export default function PartnerProgramPage() {
  const heroRef = useRef<HTMLElement>(null)
  const router = useRouter()

  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const tone = mounted && resolvedTheme === "light" ? "light" : "dark"

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY
          const heroHeight = hero.offsetHeight || 1
          const progress = Math.min(scrollY / (heroHeight * 0.6), 1)
          hero.style.transform = `translateY(${progress * 12}px)`
          hero.style.opacity = `${Math.max(1 - progress * 0.18, 0.85)}`
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const marqueeLogos = [...partnerLogos, ...partnerLogos]

  return (
    <div className="partner-program" data-tone={tone}>
      <BackgroundEffects />

      {/* Hero (raised content + inline partners row) */}
      <section ref={heroRef} className="hero-section">
        <div className="hero-content">
          <div className="hero-logo">
            <img
              src="https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/logo.png"
              alt="SaturnusGo logo"
              className="hero-logo-img"
            />
          </div>

          <h1 className="hero-title">
            Partner with
            <span className="hero-company">SaturnusGo</span>
          </h1>

          <p className="hero-subtitle">
            Unlock growth together by joining forces with SaturnusGo, where innovation meets collaboration for
            unparalleled success.
          </p>

          <div className="hero-actions">
            <button className="btn-primary" onClick={() => router.push("/partners/apply")}>
              Apply Now
              <ArrowRight className="btn-icon" />
            </button>
            <button onClick={() => router.push("/partners/listing")} className="btn-secondary">Our Partners</button>
          </div>

          {/* Compact partners row INSIDE hero to be visible above the fold */}
         
        </div>
      </section>

      {/* Trusted By (full marquee) */}
      <section className="trusted-section">
        <div className="trusted-content">
          <h2 className="trusted-title">TRUSTED BY MANY</h2>
          <div className="test-brands-badge">
            <span className="badge-icon">⚠️</span>
            <span className="badge-text">
              The listed brands are test examples and are shown only to demonstrate how partners will be displayed in the future.
            </span>
          </div>
          <div className="brand-marquee">
            <div className="brand-track">
              {marqueeLogos.map((partner, i) => (
                <div key={`${partner.name}-${i}`} className="brand-item">
                  <img
                    src={partner.logo || "/placeholder.svg"}
                    alt={`${partner.name} logo`}
                    className="brand-logo"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Partner */}
      <section className="benefits-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Why partner with SaturnusGo?</h2>
            <p className="section-subtitle">
              Elevate your organization with SaturnusGo, gaining a dynamic partnership that empowers you with
              cutting-edge solutions and limitless opportunities.
            </p>
          </div>

          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div key={index} className="benefit-card">
                <div className="benefit-icon">
                  <benefit.icon />
                </div>
                <h3 className="benefit-title">{benefit.title}</h3>
                <p className="benefit-description">{benefit.description}</p>
                <button className="benefit-link" onClick={() => benefit.href && router.push(benefit.href)}>
                  Learn More
                  <ArrowRight className="link-icon" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Join */}
      <section className="steps-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">How to join</h2>
            <p className="section-subtitle">
              Learn about the straightforward steps to become a SaturnusGo partner and start the collaboration process.
            </p>
            <button className="btn-primary" onClick={() => router.push("/partners/apply")}>
              Apply Now
              <ArrowRight className="btn-icon" />
            </button>
          </div>

          <div className="steps-grid">
            {steps.map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-number">{step.number}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Partner FAQS</h2>
            <p className="section-subtitle">
              You have questions about the SaturnusGo Partner Program? We have answers!
            </p>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <FAQItem key={index} faq={faq} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img
              src="https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/logo.png"
              alt="SaturnusGo logo"
              className="footer-logo-img"
            />
          </div>

          <div className="footer-links">
            <div className="link-group">
              <h4 className="link-title">Company</h4>
              <Link href="/partners/about" className="footer-link">About Us</Link>
              <a href="/partners/careers" className="footer-link">Careers</a>
              <a href="/partners/contacts" className="footer-link">Contact</a>
              <a href="/partners/news" className="footer-link">News</a>
            </div>

            <div className="link-group">
              <h4 className="link-title">Partners</h4>
              <a href="#" className="footer-link">Partner Program</a>
              <a href="#" className="footer-link">Partner Portal</a>
              <a href="#" className="footer-link">Resources</a>
              <a href="#" className="footer-link">Support</a>
            </div>

            <div className="link-group">
              <h4 className="link-title">Legal</h4>
              <Link href="/partners/privacy" className="footer-link">Privacy Policy</Link>
              <Link href="/partners/terms" className="footer-link">Terms of Service</Link>
              <Link href="/partners/cookies" className="footer-link">Cookie Policy</Link>
              <Link href="/partners/compliance" className="footer-link">Compliance</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>Copyright 2025 SaturnusGo. All rights reserved.</p>
        </div>
      </footer>

      {/* Styles */}
      <style jsx global>{`
        /* ================================
           TOKENS — DARK (default)
        ==================================*/
        .partner-program {
          --bg-0: #0a0b0d;
          --bg-1: #0f1115;
          --grid: rgba(255, 255, 255, 0.035);
          --txt: #e7e9ee;
          --txt-2: #c2c6cf;
          --txt-3: #9aa0a6;

          --white-02: rgba(255, 255, 255, 0.02);
          --white-08: rgba(255, 255, 255, 0.08);
          --white-12: rgba(255, 255, 255, 0.12);

          --primary: #646cff;
          --primary-hover: #5a63f0;

          --radius-md: 14px;
          --radius-lg: 20px;
          --radius-xl: 28px;

          --shadow-1: 0 10px 30px rgba(0, 0, 0, 0.28), 0 1px 0 rgba(255, 255, 255, 0.02) inset;
          --shadow-2: 0 24px 60px -20px rgba(0, 0, 0, 0.5);

          --marquee-duration: 30s;

          position: relative;
          width: 100%;
          min-height: 100vh;
          background: linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 50%, var(--bg-0) 100%);
          color: var(--txt);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* ================================
           TOKENS — LIGHT OVERRIDES
        ==================================*/
        .partner-program[data-tone='light'],
        :global(html.light) .partner-program {
          --bg-0: #f6f8fb;
          --bg-1: #ffffff;
          --grid: rgba(2, 6, 23, 0.06);

          --txt: #0f172a;
          --txt-2: #475569;
          --txt-3: #64748b;

          --white-02: rgba(2, 6, 23, 0.02);
          --white-08: rgba(2, 6, 23, 0.06);
          --white-12: rgba(2, 6, 23, 0.12);

          --shadow-1: 0 10px 30px rgba(2, 6, 23, 0.08), 0 1px 0 rgba(255, 255, 255, 1) inset;
          --shadow-2: 0 24px 60px -20px rgba(2, 6, 23, 0.18);

          background: linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 50%, var(--bg-0) 100%);
          color: var(--txt);
        }

        /* ===== HERO (raised to show buttons above the fold) ===== */
        .hero-section {
          position: relative;
          min-height: clamp(600px, 86svh, 900px); /* выше контент, меньше "пустоты" */
          display: flex;
          align-items: flex-start;               /* вместо center */
          justify-content: center;
          padding: clamp(56px, 8svh, 96px) 24px 48px; /* учёт safe-area + ранний старт контента */
          text-align: center;
        }
        .hero-content { max-width: 880px; width: 100%; margin: 0 auto; }
        .hero-logo { margin-bottom: 20px; }
        .hero-logo-img { max-width: 120px; height: auto; margin: 0 auto 10px; }

        .hero-title {
          font-size: clamp(44px, 7.2vw, 84px);
          font-weight: 800;
          line-height: 1.06;
          margin: 0 0 8px;
          background: linear-gradient(to right, var(--txt), var(--txt-2));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .hero-company { display: block; color: var(--primary); margin-top: 4px; }

        .hero-subtitle {
          font-size: clamp(17px, 2.1vw, 20px);
          line-height: 1.6;
          color: var(--txt-2);
          margin: 0 auto 18px;                  /* меньше отступ — кнопки выше */
          max-width: 640px;
        }

        .hero-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 14px;                   /* ближе к партнёрам */
        }

        /* Buttons */
        .btn-primary, .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 24px;
          border-radius: var(--radius-lg);
          font-weight: 700;
          font-size: 15px;
          text-decoration: none;
          transition: all 0.2s ease;
          cursor: pointer;
          border: none;
        }
        .btn-primary { background: var(--primary); color: white; }
        .btn-primary:hover { background: var(--primary-hover); transform: translateY(-2px); box-shadow: var(--shadow-2); }
        .btn-secondary { background: var(--white-08); color: var(--txt); border: 1px solid var(--white-12); }
        .btn-secondary:hover { background: var(--white-12); transform: translateY(-2px); }
        .btn-icon, .link-icon { width: 16px; height: 16px; }

        /* ===== Compact partners row inside hero ===== */
        .hero-partners { margin-top: 8px; }
        .hero-partners-title {
          font-size: 11px;
          letter-spacing: 0.18em;
          font-weight: 800;
          color: var(--txt-3);
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .hero-brand-row {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .hero-brand {
          width: 120px;
          height: 56px;
          border-radius: 16px;
          background: var(--white-08);
          border: 1px solid var(--white-12);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
        }
        .hero-brand:hover { transform: translateY(-3px); box-shadow: var(--shadow-2); background: var(--white-12); }
        .hero-brand img { max-width: 90px; max-height: 40px; object-fit: contain; }

        /* Trusted By Section (full) */
        .trusted-section { padding: 64px 24px; text-align: center; }
        .trusted-content { max-width: 1200px; margin: 0 auto; }
        .trusted-title {
          font-size: 13px; font-weight: 800; letter-spacing: 2px; color: var(--txt-3);
          margin-bottom: 32px; text-transform: uppercase;
        }

        .test-brands-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 20px; border-radius: var(--radius-lg); margin-bottom: 28px;
          background: color-mix(in oklab, #f59e0b 15%, transparent);
          border: 1px solid color-mix(in oklab, #f59e0b 35%, transparent);
          max-width: 720px; text-align: left;
        }
        .partner-program[data-tone='light'] .test-brands-badge,
        :global(html.light) .partner-program .test-brands-badge {
          background: color-mix(in oklab, #f59e0b 10%, white);
          border-color: color-mix(in oklab, #f59e0b 35%, white);
        }
        .badge-icon { font-size: 16px; flex-shrink: 0; }
        .badge-text { font-size: 14px; color: #f59e0b; font-weight: 600; line-height: 1.4; }

        .brand-marquee {
          --mask-edge: 10%;
          width: 100%;
          overflow: hidden;
          mask: linear-gradient(90deg, transparent 0%, black var(--mask-edge), black calc(100% - var(--mask-edge)), transparent 100%);
          -webkit-mask: linear-gradient(90deg, transparent 0%, black var(--mask-edge), black calc(100% - var(--mask-edge)), transparent 100%);
        }
        .brand-track { display: inline-flex; gap: 48px; width: max-content; animation: marquee var(--marquee-duration) linear infinite; will-change: transform; }
        .brand-marquee:hover .brand-track { animation-play-state: paused; }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        .brand-item {
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          width: 160px; height: 80px; border-radius: var(--radius-xl);
          background: var(--white-08); border: 1px solid var(--white-12); transition: all 0.25s ease;
        }
        .brand-item:hover { transform: translateY(-3px); box-shadow: var(--shadow-2); }
        .brand-logo { max-width: 120px; max-height: 50px; object-fit: contain; filter: contrast(1.05); }

        /* Section Styles */
        .section-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .section-header { text-align: center; margin-bottom: 64px; }
        .section-title {
          font-size: clamp(32px, 5vw, 48px); font-weight: 800; margin-bottom: 12px;
          background: linear-gradient(to right, var(--txt), var(--txt-2));
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .section-subtitle { font-size: 18px; line-height: 1.6; color: var(--txt-2); max-width: 680px; margin: 0 auto 32px; }

        /* Benefits */
        .benefits-section { padding: 110px 0; }
        .benefits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 32px; }
        .benefit-card {
          padding: 36px; background: var(--white-08); border: 1px solid var(--white-12);
          border-radius: var(--radius-xl); text-align: center; transition: all 0.3s ease;
        }
        .benefit-card:hover { transform: translateY(-8px); box-shadow: var(--shadow-2); background: var(--white-12); }
        .benefit-icon {
          width: 60px; height: 60px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;
          background: var(--primary); border-radius: var(--radius-lg); color: white;
        }
        .benefit-icon svg { width: 30px; height: 30px; }
        .benefit-title { font-size: 22px; font-weight: 700; margin-bottom: 10px; color: var(--txt); }
        .benefit-description { font-size: 16px; line-height: 1.6; color: var(--txt-2); margin-bottom: 18px; }
        .benefit-link {
          display: inline-flex; align-items: center; gap: 8px; color: var(--primary);
          font-weight: 700; text-decoration: none; background: none; border: none; cursor: pointer; transition: all 0.2s ease;
        }
        .benefit-link:hover { color: var(--primary-hover); transform: translateX(4px); }

        /* Steps */
        .steps-section { padding: 110px 0; background: var(--white-02); }
        .steps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; }
        .step-card { text-align: center; }
        .step-number { font-size: 42px; font-weight: 800; color: var(--primary); margin-bottom: 10px; }
        .step-title { font-size: 22px; font-weight: 700; margin-bottom: 10px; color: var(--txt); }
        .step-description { font-size: 16px; line-height: 1.6; color: var(--txt-2); }

        /* FAQ */
        .faq-section { padding: 110px 0; }
        .faq-list { max-width: 800px; margin: 0 auto; }
        .faq-item { border-bottom: 1px solid var(--white-12); }
        .faq-question {
          width: 100%; display: flex; justify-content: space-between; align-items: center;
          padding: 22px 0; background: none; border: none; color: var(--txt);
          font-size: 18px; font-weight: 700; text-align: left; cursor: pointer; transition: color 0.2s ease;
        }
        .faq-question:hover { color: var(--primary); }
        .faq-icon { width: 20px; height: 20px; color: var(--txt-3); }
        .faq-answer { padding-bottom: 22px; animation: fadeIn 0.3s ease; }
        .faq-answer p { font-size: 16px; line-height: 1.6; color: var(--txt-2); margin: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

        /* Footer */
        .footer { padding: 80px 0 40px; background: var(--white-02); border-top: 1px solid var(--white-12); }
        .footer-content {
          max-width: 1200px; margin: 0 auto; padding: 0 24px; display: grid;
          grid-template-columns: 1fr 2fr; gap: 64px; align-items: start;
        }
        .footer-links { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 40px; }
        .link-group { display: flex; flex-direction: column; gap: 12px; }
        .link-title { font-size: 16px; font-weight: 700; color: var(--txt); margin-bottom: 8px; }
        .footer-link { color: var(--txt-2); text-decoration: none; font-size: 14px; transition: color 0.2s ease; }
        .footer-link:hover { color: var(--primary); }
        .footer-logo-img { max-width: 100px; height: auto; }

        .footer-bottom {
          max-width: 1200px; margin: 0 auto; padding: 40px 24px 0; border-top: 1px solid var(--white-12); text-align: center;
        }
        .footer-bottom p { color: var(--txt-3); font-size: 14px; margin: 0; }

        /* ===== Footer — layout fix ===== */
.partner-program {
  --footer-pad-top: clamp(36px, 5vw, 56px);
  --footer-pad-bottom: clamp(14px, 2.2vw, 24px);
  --footer-gap: clamp(28px, 3vw, 48px);
  --footer-line-gap: clamp(18px, 2.2vw, 26px);
}

/* компактнее поля секции футера */
.footer {
  padding: var(--footer-pad-top) 0 var(--footer-pad-bottom) !important;
}

/* меньше межколоночный и межблочный зазор */
.footer-content {
  gap: var(--footer-gap) !important;
  align-items: start;
}

/* отодвигаем блок ссылок от разделительной линии снизу */
.footer-links {
  gap: clamp(28px, 3vw, 40px) !important;
  margin-bottom: var(--footer-line-gap) !important;
}

/* разделительная линия + копирайт справа внизу */
.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  border-top: 1px solid var(--white-12);
  padding: 14px 24px calc(8px + env(safe-area-inset-bottom)) !important;
  display: flex;
  justify-content: flex-end;     /* вправо */
  align-items: center;
  text-align: right;
}

/* сам текст копирайта */
.footer-bottom p {
  margin: 0;
  color: var(--txt-3);
  font-size: 14px;
}

/* логотип в футере чуть компактнее, чтобы не раздувал высоту */
.footer-logo-img { max-width: 88px; }

/* Мобильная адаптация: копирайт по центру, мягче поля */
@media (max-width: 768px) {
  .footer {
    padding: clamp(28px, 6vw, 40px) 0 clamp(10px, 4vw, 18px) !important;
  }
  .footer-bottom {
    justify-content: center;
    text-align: center;
  }
}

/* === Footer: spacing & logo centering — final overrides === */
.partner-listing {
  /* больше отступа от верхней линии футера до заголовков разделов */
  --footer-pad-top: clamp(64px, 6vw, 96px);
  /* немного больше отступ снизу футера */
  --footer-pad-bottom: clamp(28px, 4vw, 48px);
  /* опускаем нижний ограничитель (линия в .footer-bottom) */
  --footer-line-gap: clamp(24px, 3vw, 36px);
}

/* применяем обновлённые переменные */
.footer {
  padding-top: var(--footer-pad-top) !important;
  padding-bottom: var(--footer-pad-bottom) !important;
}

/* лёгкий зазор перед сеткой ссылок, чтобы заголовки не «липли» к верхней границе */
.footer-links {
  margin-top: clamp(8px, 1.6vw, 14px) !important;
}

/* нижний ограничитель: чуть позже по вертикали и больше внутренний отступ сверху */
.footer-bottom {
  margin-top: var(--footer-line-gap) !important;
  padding-top: clamp(20px, 2.4vw, 28px) !important;
}

/* логотип — к визуальному центру своей колонки */
.footer-logo {
  align-self: center;                 /* центр по вертикали внутри grid-строки */
  display: flex;
  align-items: center;                /* центрируем сам img по оси контейнера */
  min-height: 100%;                   /* тянем колонку для ровного центрирования */
}

/* чуть крупнее можно оставить текущий размер; при необходимости — подстройка */
.footer-logo-img {
  max-width: 100px;                   /* ваш исходный размер */
  /* при желании — мягкая оптика: небольшое смещение вниз
     раскомментировать при необходимости
  transform: translateY(4px);
  */
}

/* мобильные — сохраняем баланс отступов */
@media (max-width: 768px) {
  .partner-listing {
    --footer-pad-top: clamp(40px, 7vw, 56px);
    --footer-pad-bottom: clamp(16px, 5vw, 28px);
    --footer-line-gap: clamp(18px, 5vw, 26px);
  }
  .footer-logo { align-self: center; }
  .footer-bottom { text-align: center; justify-content: center; }
}


        /* ===== Tuning: balanced spacing for "Trusted by many" ===== */
.partner-program {
  /* токены под интервал и шаг логотипов */
  --trusted-gap-title-badge: clamp(10px, 0.9vw, 16px);
  --trusted-gap-badge-marquee: clamp(14px, 1.1vw, 22px);
  --brand-gap: clamp(28px, 2.2vw, 40px);
}

/* управляем только нужными промежутками через соседние селекторы */
.trusted-content { row-gap: 0; }

.trusted-title + .test-brands-badge {
  margin-top: var(--trusted-gap-title-badge) !important;
}

.test-brands-badge + .brand-marquee {
  margin-top: var(--trusted-gap-badge-marquee) !important;
}

/* чуть свободнее расстояние между логотипами */
.brand-track { gap: var(--brand-gap); }

/* мягче сама пилюля — визуально легче, не «липнет» к соседям */
.test-brands-badge {
  padding: 12px 16px;
  line-height: 1.45;
}

/* секцию немного приподнимем, чтобы блок читался ровно */
.trusted-section {
  padding-top: clamp(44px, 6svh, 64px);
  padding-bottom: clamp(44px, 6svh, 64px);
}

@media (max-width: 768px) {
  .partner-program {
    --brand-gap: clamp(22px, 6vw, 30px);
    --trusted-gap-title-badge: clamp(8px, 2.2vw, 12px);
    --trusted-gap-badge-marquee: clamp(10px, 2.8vw, 16px);
  }
}

        /* Responsive */
        @media (max-width: 860px) {
          .hero-section { min-height: 78svh; padding-top: clamp(36px, 6svh, 64px); }
          .hero-brand { width: 108px; height: 52px; border-radius: 14px; }
          .hero-brand img { max-width: 82px; max-height: 36px; }
        }
        @media (max-width: 768px) {
          .hero-actions { flex-direction: column; align-items: center; }
          .btn-primary, .btn-secondary { width: 100%; max-width: 300px; }
          .benefits-grid { grid-template-columns: 1fr; }
          .steps-grid { grid-template-columns: 1fr; }
          .footer-content { grid-template-columns: 1fr; gap: 40px; text-align: center; }
          .footer-links { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  )
}
