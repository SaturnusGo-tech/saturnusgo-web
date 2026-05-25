"use client"
import { useTheme } from "next-themes"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Users,
  Globe2,
  Ticket,
  Hotel,
  Car,
  Sparkles,
  Target,
  LineChart,
  Shield,
  CheckCircle,
  UtensilsCrossed,
  Coffee,
  Camera,
  Music,
  Gamepad2,
  TrendingUp,
  Clock,
  Star,
  ShoppingBag,
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

export default function ReachNewTravelersPage() {
  const heroRef = useRef<HTMLElement>(null)
  const router = useRouter()
  const [activePill, setActivePill] = useState("Tourists")
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const tone = mounted && resolvedTheme === "light" ? "light" : "dark"
  
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

  const pills = [
    { id: "Tourists", icon: Globe2, text: "Tourists" },
    { id: "Business", icon: Users, text: "Business Travelers" },
    { id: "Locals", icon: Target, text: "Locals" },
  ]

  return (
    <div className="reach-page" data-tone={tone}>

      <BackgroundEffects />

      <section ref={heroRef} className="hero-section">
        <div className="hero-content">
          <img
            src="https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/logo.png"
            alt="SaturnusGo"
            className="hero-logo-img"
          />
          <h1 className="hero-title">
            Reach New <span className="hero-accent">Travelers</span>
          </h1>
          <p className="hero-subtitle">
            Join SaturnusGo's growing ecosystem — designed to connect tourists, business travelers, and locals through
            integrated rides, hotels, restaurants, events, and activities in one comprehensive travel platform.
          </p>

          <div className="hero-benefits">
            <div className="benefit-item">
              <Sparkles className="benefit-icon" />
              <span>High-intent discovery</span>
            </div>
            <div className="benefit-item">
              <LineChart className="benefit-icon" />
              <span>Quality demand</span>
            </div>
            <div className="benefit-item">
              <Shield className="benefit-icon" />
              <span>Trusted flow</span>
            </div>
          </div>

          {/* Audience selector */}
          <div className="pill-scroll" role="tablist" aria-label="Audience Segments">
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

      {/* Stats Section */}
      <section className="stats-section">
        <div className="section-container">
          <div className="roadmap-header">
            <h2 className="roadmap-title">Our Growth Roadmap</h2>
            <p className="roadmap-subtitle">Planned milestones as we build the future of integrated travel</p>
          </div>
          <div className="stats-pills-container">
            <div className="stats-pill">
              <div className="stat-number">2.5M+</div>
              <div className="stat-label">Target monthly travelers</div>
            </div>
            <div className="stats-pill">
              <div className="stat-number">150+</div>
              <div className="stat-label">Cities in expansion plan</div>
            </div>
            <div className="stats-pill">
              <div className="stat-number">4.8★</div>
              <div className="stat-label">Partner satisfaction goal</div>
            </div>
            <div className="stats-pill">
              <div className="stat-number">85%</div>
              <div className="stat-label">Cross-service booking target</div>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">How travelers will find you</h2>
            <p className="section-subtitle">
              Your brand will appear naturally across core journeys with targeted messaging for every type of business
              as we build our integrated platform.
            </p>
          </div>

          {/* Journey Grid */}
          <div className="journey-grid">
            <div className="journey-card">
              <div className="journey-icon">
                <Hotel />
              </div>
              <h4>Stay + Events</h4>
              <p>Hotel listings with event cross-sell and loyalty perks</p>
            </div>

            <div className="journey-card">
              <div className="journey-icon">
                <UtensilsCrossed />
              </div>
              <h4>Dine + Explore</h4>
              <p>Restaurant recommendations with nearby attractions and activities</p>
            </div>

            <div className="journey-card">
              <div className="journey-icon">
                <Coffee />
              </div>
              <h4>Café + Work</h4>
              <p>Coffee shops with co-working spaces and business traveler amenities</p>
            </div>

            <div className="journey-card">
              <div className="journey-icon">
                <Ticket />
              </div>
              <h4>Events → Rides</h4>
              <p>Post-purchase pickup scheduling with venue suggestions</p>
            </div>

            <div className="journey-card">
              <div className="journey-icon">
                <Camera />
              </div>
              <h4>Tours + Activities</h4>
              <p>Guided experiences with transport and dining packages</p>
            </div>

            <div className="journey-card">
              <div className="journey-icon">
                <Car />
              </div>
              <h4>Airport → City</h4>
              <p>Arrival flow with hotel, restaurant and venue recommendations</p>
            </div>
          </div>

          <div className="audience-details">
            <div className="audience-card">
              {activePill === "Tourists" && (
                <>
                  <h3>
                    <Globe2 className="inline-icon" />
                    Tourists
                  </h3>
                  <div className="audience-features">
                    <span className="feature-tag">City & date planning</span>
                    <span className="feature-tag">Bundled suggestions</span>
                    <span className="feature-tag">Multi-language UI</span>
                    <span className="feature-tag">Local experiences</span>
                    <span className="feature-tag">Photo-worthy spots</span>
                  </div>
                  <div className="audience-stats">
                    <div className="audience-stat">
                      <Clock className="stat-icon" />
                      <span>3.2 days average stay</span>
                    </div>
                    <div className="audience-stat">
                      <ShoppingBag className="stat-icon" />
                      <span>$180 daily spend</span>
                    </div>
                  </div>
                </>
              )}
              {activePill === "Business" && (
                <>
                  <h3>
                    <Users className="inline-icon" />
                    Business Travelers
                  </h3>
                  <div className="audience-features">
                    <span className="feature-tag">Fast booking flows</span>
                    <span className="feature-tag">Policy compliance</span>
                    <span className="feature-tag">Reliable transfers</span>
                    <span className="feature-tag">Meeting venues</span>
                    <span className="feature-tag">Expense tracking</span>
                  </div>
                  <div className="audience-stats">
                    <div className="audience-stat">
                      <TrendingUp className="stat-icon" />
                      <span>40% higher conversion</span>
                    </div>
                    <div className="audience-stat">
                      <Star className="stat-icon" />
                      <span>Premium service preference</span>
                    </div>
                  </div>
                </>
              )}
              {activePill === "Locals" && (
                <>
                  <h3>
                    <Target className="inline-icon" />
                    Locals
                  </h3>
                  <div className="audience-features">
                    <span className="feature-tag">Weekend events</span>
                    <span className="feature-tag">Loyalty programs</span>
                    <span className="feature-tag">Dynamic offers</span>
                    <span className="feature-tag">Social dining</span>
                    <span className="feature-tag">Seasonal activities</span>
                  </div>
                  <div className="audience-stats">
                    <div className="audience-stat">
                      <Clock className="stat-icon" />
                      <span>2.5x monthly bookings</span>
                    </div>
                    <div className="audience-stat">
                      <Users className="stat-icon" />
                      <span>Group reservations</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Partner Types Section */}
      <section className="partner-types-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Perfect for every business</h2>
            <p className="section-subtitle">
              From hospitality to entertainment, SaturnusGo connects travelers with authentic local experiences.
            </p>
          </div>

          <div className="partner-types-grid">
            <div className="partner-type">
              <div className="partner-type-header">
                <Hotel className="partner-type-icon" />
                <h3>Hospitality</h3>
              </div>
              <ul className="partner-type-list">
                <li>Hotels & Resorts</li>
                <li>Boutique Properties</li>
                <li>Hostels & B&Bs</li>
                <li>Vacation Rentals</li>
              </ul>
            </div>

            <div className="partner-type">
              <div className="partner-type-header">
                <UtensilsCrossed className="partner-type-icon" />
                <h3>Food & Beverage</h3>
              </div>
              <ul className="partner-type-list">
                <li>Fine Dining Restaurants</li>
                <li>Local Cafés & Bistros</li>
                <li>Food Markets & Tours</li>
                <li>Bars & Nightlife</li>
              </ul>
            </div>

            <div className="partner-type">
              <div className="partner-type-header">
                <Camera className="partner-type-icon" />
                <h3>Experiences</h3>
              </div>
              <ul className="partner-type-list">
                <li>Guided City Tours</li>
                <li>Cultural Experiences</li>
                <li>Adventure Activities</li>
                <li>Photography Tours</li>
              </ul>
            </div>

            <div className="partner-type">
              <div className="partner-type-header">
                <Music className="partner-type-icon" />
                <h3>Entertainment</h3>
              </div>
              <ul className="partner-type-list">
                <li>Concert Venues</li>
                <li>Theaters & Shows</li>
                <li>Museums & Galleries</li>
                <li>Sports Events</li>
              </ul>
            </div>

            <div className="partner-type">
              <div className="partner-type-header">
                <Car className="partner-type-icon" />
                <h3>Transportation</h3>
              </div>
              <ul className="partner-type-list">
                <li>Ride Services</li>
                <li>Car Rentals</li>
                <li>Airport Transfers</li>
                <li>Bike & Scooter Rentals</li>
              </ul>
            </div>

            <div className="partner-type">
              <div className="partner-type-header">
                <Gamepad2 className="partner-type-icon" />
                <h3>Recreation</h3>
              </div>
              <ul className="partner-type-list">
                <li>Spas & Wellness</li>
                <li>Gaming & Entertainment</li>
                <li>Sports & Fitness</li>
                <li>Shopping Centers</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="integration-cta-section">
        <div className="section-container">
          <div className="integration-content">
            <div className="integration-info">
              <h2 className="section-title">Simple integration</h2>
              <p className="section-subtitle">
                Connect once — activate everywhere. Two clear paths that match your setup.
              </p>

              <div className="integration-options">
                <div className="option">
                  <CheckCircle className="option-icon" />
                  <div>
                    <h4>Direct API</h4>
                    <p>Lightweight REST/GraphQL adapter with full control</p>
                  </div>
                </div>
                <div className="option">
                  <CheckCircle className="option-icon" />
                  <div>
                    <h4>Through PMS/Channel</h4>
                    <p>Plug into existing systems via supported hubs</p>
                  </div>
                </div>
              </div>

              <div className="integration-outcome">
                <Sparkles className="outcome-icon" />
                <p>
                  Our planned integration will power hotel cards, restaurant listings, event bundles, activity bookings,
                  airport flows, and loyalty perks — all with consistent pricing and policy across every service type.
                </p>
              </div>
            </div>

            <div className="cta-card">
              <h3>Ready to grow with us?</h3>
              <p>
                Join SaturnusGo as we build the future of integrated travel and put your brand on the path to success.
              </p>
              <div className="cta-actions">
                <button className="btn-primary" onClick={() => router.push("/partners/apply")}>
                  Apply now <ArrowRight className="btn-icon" />
                </button>
                <button className="btn-secondary" onClick={() => router.push("/partners")}>
                  Back to partners
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .reach-page {
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

        .reach-page[data-tone='light'],
:global(html.light) .reach-page {
  --bg-0:#f6f8fb; --bg-1:#ffffff; --grid:rgba(2,6,23,.06);
  --txt:#0f172a; --txt-2:#475569; --txt-3:#64748b;
  --white-02:rgba(2,6,23,.02); --white-08:rgba(2,6,23,.06); --white-12:rgba(2,6,23,.12);

  background:
    radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.09), transparent),
    linear-gradient(135deg, var(--bg-0), var(--bg-1));
  color: var(--txt);
}
.reach-page[data-tone='light'] .pill,
:global(html.light) .reach-page .pill {
  background: rgba(2,6,23,.03);
}

/* Шаги в интеграции — светлая подложка */
.reach-page[data-tone='light'] .i-step,
:global(html.light) .reach-page .i-step {
  background: rgba(2,6,23,.04);
}

/* Лёгкая тень для логотипа в hero в светлой теме (опционально) */
.reach-page[data-tone='light'] .hero-logo-img,
:global(html.light) .reach-page .hero-logo-img {
  filter: drop-shadow(0 8px 16px rgba(2,6,23,.12));
}

        /* Enhanced Hero Section */
        .hero-section { 
          position: relative; min-height: 85vh; display:flex; align-items:center; justify-content:center; 
          padding: 92px 24px 80px; text-align:center; 
        }
        .hero-content { max-width: 920px; width: 100%; }
        .hero-logo-img { 
          max-width: 120px; height:auto; margin:0 auto 24px; display:block; 
          filter: drop-shadow(0 10px 20px rgba(0,0,0,.35)); 
        }
        .hero-title {
          font-size: clamp(44px, 7vw, 84px); font-weight: 850; letter-spacing: -0.02em; 
          line-height: 1.06; margin: 0 0 16px;
          background: linear-gradient(to right, var(--txt), var(--txt-2)); 
          -webkit-background-clip:text; background-clip:text; color: transparent;
        }
        .hero-accent { color: var(--primary); }
        .hero-subtitle { 
          font-size: 20px; line-height: 1.7; color: var(--txt-2); 
          max-width: 760px; margin: 0 auto 32px; 
        }

        /* Hero Benefits */
        .hero-benefits {
          display: flex; justify-content: center; gap: 32px; margin: 0 auto 32px;
          flex-wrap: wrap; max-width: 600px;
        }
        .benefit-item {
          display: flex; align-items: center; gap: 8px; color: var(--txt-2);
          font-weight: 600; font-size: 14px;
        }
        .benefit-icon { width: 18px; height: 18px; color: var(--primary); }

        /* Pill Navigation */
        .pill-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 0 auto; max-width: 920px; }
        .pill-track { display: inline-flex; gap: 12px; padding: 8px; justify-content: center; }
        .pill {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 18px; border-radius: 999px;
          background: rgba(255,255,255,0.04); border: 1px solid var(--white-12);
          color: var(--txt-2); font-weight: 700; white-space: nowrap; cursor: pointer; 
          transition: all .2s ease;
        }
        .pill svg { width: 16px; height: 16px; color: var(--txt-3); flex: 0 0 auto; }
        .pill-on { background: var(--primary); color: #fff; border-color: transparent; }
        .pill-on svg { color: #fff; }

        /* Stats Section */
        .stats-section { 
          padding: 60px 0; 
          background: linear-gradient(135deg, var(--white-02), transparent);
        }
        .roadmap-header { 
          text-align: center; margin-bottom: 32px; 
        }
        .roadmap-title {
          font-size: 28px; font-weight: 700; margin: 0 0 8px;
          color: var(--txt);
        }
        .roadmap-subtitle {
          color: var(--txt-2); font-size: 16px; margin: 0;
          font-style: italic;
        }
        
        /* New pill-style stats layout */
        .stats-pills-container {
          display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;
          max-width: 1000px; margin: 0 auto;
        }
        .stats-pill {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 20px 24px; border-radius: 999px;
          background: rgba(255,255,255,0.08); border: 1px solid var(--white-12);
          min-width: 200px; text-align: center;
          transition: all .25s ease;
        }
        .stats-pill:hover {
          transform: translateY(-4px); background: var(--white-12);
          box-shadow: 0 12px 32px rgba(0,0,0,.2);
        }
        .stats-pill .stat-number {
          font-size: 32px; font-weight: 800; color: var(--primary);
          line-height: 1;
        }
        .stats-pill .stat-label {
          font-size: 14px; font-weight: 600; color: var(--txt-2);
          line-height: 1.3;
        }

        /* How It Works Section */
        .how-it-works-section { padding: 100px 0; background: var(--white-02); }
        .section-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .section-header { text-align: center; margin-bottom: 48px; }
        .section-title {
          font-size: clamp(32px, 5vw, 48px); font-weight: 800; margin: 0 0 12px;
          background: linear-gradient(to right, var(--txt), var(--txt-2)); 
          -webkit-background-clip:text; background-clip:text; color: transparent;
        }
        .section-subtitle { 
          color: var(--txt-2); font-size: 18px; line-height: 1.6; 
          margin: 0 auto; max-width: 760px; 
        }

        /* Journey Grid */
        .journey-grid { 
          display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
          margin-bottom: 48px;
        }
        .journey-card {
          background: var(--white-08); border: 1px solid var(--white-12);
          border-radius: var(--radius-lg); padding: 24px; text-align: center;
          transition: all .25s ease;
        }
        .journey-card:hover { transform: translateY(-4px); background: var(--white-12); }
        .journey-icon { 
          width: 48px; height: 48px; border-radius: 12px; background: var(--primary); 
          color:#fff; display:grid; place-items:center; margin: 0 auto 16px; 
        }
        .journey-card h4 { margin: 0 0 8px; font-size: 18px; font-weight: 700; }
        .journey-card p { margin: 0; color: var(--txt-2); line-height: 1.6; }

        /* Audience Details */
        .audience-details { max-width: 800px; margin: 0 auto; }
        .audience-card {
          background: var(--white-08); border: 1px solid var(--white-12);
          border-radius: var(--radius-xl); padding: 32px; text-align: center;
        }
        .audience-card h3 { 
          margin: 0 0 20px; font-size: 24px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; gap: 12px;
        }
        .inline-icon { width: 24px; height: 24px; color: var(--primary); }
        .audience-features { 
          display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; 
          margin-bottom: 24px;
        }
        .feature-tag {
          padding: 8px 16px; background: rgba(100,108,255,.1); border: 1px solid rgba(100,108,255,.2);
          border-radius: 999px; font-size: 14px; font-weight: 600; color: var(--primary);
        }
        .audience-stats {
          display: flex; justify-content: center; gap: 24px; flex-wrap: wrap;
        }
        .audience-stat {
          display: flex; align-items: center; gap: 8px; color: var(--txt-2);
          font-size: 14px; font-weight: 600;
        }
        .stat-icon { width: 16px; height: 16px; color: var(--primary); }

        /* Partner Types Section */
        .partner-types-section { padding: 100px 0; }
        .partner-types-grid {
          display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          margin-top: 48px;
        }
        .partner-type {
          background: var(--white-08); border: 1px solid var(--white-12);
          border-radius: var(--radius-lg); padding: 24px;
          transition: all .25s ease;
        }
        .partner-type:hover { transform: translateY(-4px); background: var(--white-12); }
        .partner-type-header {
          display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
        }
        .partner-type-icon { 
          width: 24px; height: 24px; color: var(--primary); 
        }
        .partner-type h3 { 
          margin: 0; font-size: 18px; font-weight: 700; 
        }
        .partner-type-list {
          list-style: none; padding: 0; margin: 0;
        }
        .partner-type-list li {
          padding: 8px 0; color: var(--txt-2); font-size: 14px;
          border-bottom: 1px solid var(--white-08);
        }
        .partner-type-list li:last-child { border-bottom: none; }

        /* Integration + CTA Section */
        .integration-cta-section { padding: 100px 0; }
        .integration-content { 
          display: grid; gap: 48px; grid-template-columns: 1.2fr 1fr; 
          align-items: start; max-width: 1200px; margin: 0 auto;
        }
        @media (max-width: 960px) { 
          .integration-content { grid-template-columns: 1fr; gap: 32px; } 
        }

        .integration-options { display: grid; gap: 16px; margin: 24px 0; }
        .option {
          display: flex; gap: 16px; align-items: flex-start;
          padding: 20px; background: var(--white-08); border: 1px solid var(--white-12);
          border-radius: var(--radius-lg);
        }
        .option-icon { width: 20px; height: 20px; color: var(--primary); flex: 0 0 auto; margin-top: 2px; }
        .option h4 { margin: 0 0 4px; font-size: 16px; font-weight: 700; }
        .option p { margin: 0; color: var(--txt-2); line-height: 1.5; font-size: 14px; }

        .integration-outcome {
          display: flex; gap: 16px; align-items: flex-start;
          padding: 20px; border-radius: var(--radius-lg);
          background: radial-gradient(400px 150px at 0% 0%, rgba(100,108,255,.12), transparent),
            rgba(255,255,255,.04);
          border: 1px solid var(--white-12);
        }
        .outcome-icon { width: 20px; height: 20px; color: var(--primary); flex: 0 0 auto; margin-top: 2px; }
        .integration-outcome p { margin: 0; color: var(--txt); line-height: 1.6; font-size: 15px; }

        /* CTA Card */
        .cta-card {
          background: var(--white-08); border: 1px solid var(--white-12);
          border-radius: var(--radius-xl); padding: 32px; text-align: center;
        }
        .cta-card h3 { margin: 0 0 12px; font-size: 28px; font-weight: 800; }
        .cta-card p { margin: 0 0 24px; color: var(--txt-2); line-height: 1.6; }
        .cta-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

        /* Buttons */
        .btn-primary, .btn-secondary {
          display: inline-flex; align-items: center; gap: 8px; padding: 14px 24px; 
          border-radius: 18px; font-weight: 700; font-size: 15px;
          border: none; cursor: pointer; transition: all .2s ease;
        }
        .btn-primary { background: var(--primary); color: #fff; }
        .btn-primary:hover { background: var(--primary-hover); transform: translateY(-2px); }
        .btn-secondary { background: var(--white-08); color: var(--txt); border: 1px solid var(--white-12); }
        .btn-secondary:hover { background: var(--white-12); transform: translateY(-2px); }
        .btn-icon { width: 16px; height: 16px; }
      `}</style>
    </div>
  )
}
