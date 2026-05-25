// app/features/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Layers, Link2, Shield, Sparkles, LineChart, Globe2, Users, Lock, FileCode,
  GitBranch, Bell, Webhook, Puzzle, Database, Languages, Accessibility, Wallet,
  Building2, CheckCircle2, Timer, FileCheck2, LifeBuoy, ShieldCheck, MapPin,
  Settings2, Wand2, Activity, Cloud, BookOpenCheck
} from 'lucide-react';

/* Background grid — unified with other screens */
const BackgroundEffects = () => (
  <div className="bgfx absolute inset-0 overflow-hidden pointer-events-none">
    <div
      className="absolute inset-0 opacity-[0.015]"
      style={{
        backgroundImage: `
          linear-gradient(var(--grid) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    />
  </div>
);

type Feature = {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<any>;
  category: 'Core' | 'Modules' | 'Developer' | 'Security' | 'Trust & Safety' | 'Operations' | 'Analytics' | 'Enterprise';
  status: 'Available';
};

export default function FeaturesPage() {
  const heroRef = useRef<HTMLElement>(null);

  // Parallax (gentle, same feel as FAQ/Partners)
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          const h = el.offsetHeight || 1;
          const p = Math.min(y / (h * 0.7), 1);
          el.style.transform = `translateY(${p * 12}px)`;
          el.style.opacity = `${Math.max(1 - p * 0.18, 0.92)}`;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Theme
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const tone = mounted && resolvedTheme === 'light' ? 'light' : 'dark';

  const categories = [
    { id: 'Core', label: 'Core' },
    { id: 'Modules', label: 'Modules' },
    { id: 'Developer', label: 'Developer' },
    { id: 'Security', label: 'Security' },
    { id: 'Trust & Safety', label: 'Trust & Safety' },
    { id: 'Operations', label: 'Operations' },
    { id: 'Analytics', label: 'Analytics' },
    { id: 'Enterprise', label: 'Enterprise' },
  ] as const;

  const [active] = useState<(typeof categories)[number]['id']>('Core');

  // Data
  const FEATURES: Feature[] = [
    // Core
    { id: 'core-unified', title: 'Unified discovery', desc: 'One surface to explore mobility, stays, dining, events, and activities in a single flow.', icon: Layers, category: 'Core', status: 'Available' },
    { id: 'core-itinerary', title: 'Itinerary builder', desc: 'Plan by city and dates; save places, compare options, and keep everything in one view.', icon: MapPin, category: 'Core', status: 'Available' },
    { id: 'core-i18n', title: 'Multi-language UI', desc: 'Localized interface and content for key markets, including RTL support.', icon: Languages, category: 'Core', status: 'Available' },
    { id: 'core-a11y', title: 'Accessibility', desc: 'Keyboard navigation, contrast-safe colors, screen-reader labels, motion-safe defaults.', icon: Accessibility, category: 'Core', status: 'Available' },

    // Modules
    { id: 'mod-rides', title: 'Rides (surface)', desc: 'Request, schedule, and post-event pickup flows for venues and airports.', icon: CarIcon, category: 'Modules', status: 'Available' },
    { id: 'mod-stays', title: 'Stays (surface)', desc: 'Hotel cards with policy clarity, loyalty hooks, and bundled suggestions.', icon: Building2, category: 'Modules', status: 'Available' },
    { id: 'mod-dining', title: 'Dining (surface)', desc: 'Restaurants with menus, availability windows, and contextual add-ons.', icon: UtensilsIcon, category: 'Modules', status: 'Available' },
    { id: 'mod-events', title: 'Events (surface)', desc: 'Tickets with seating, timing, and after-event routing into rides and dining.', icon: TicketIcon, category: 'Modules', status: 'Available' },
    { id: 'mod-activities', title: 'Activities (surface)', desc: 'Guided tours and experiences packaged with transport and recommendations.', icon: Sparkles, category: 'Modules', status: 'Available' },

    // Developer
    { id: 'dev-apis', title: 'REST & GraphQL APIs', desc: 'Consistent resources, pagination, id semantics, and robust error design.', icon: FileCode, category: 'Developer', status: 'Available' },
    { id: 'dev-webhooks', title: 'Webhooks', desc: 'Signed events with retries, replay, and idempotency for reliable sync.', icon: Webhook, category: 'Developer', status: 'Available' },
    { id: 'dev-sdks', title: 'SDKs', desc: 'Type-safe SDKs for modern stacks to accelerate partner integrations.', icon: Puzzle, category: 'Developer', status: 'Available' },
    { id: 'dev-sandbox', title: 'Sandbox', desc: 'Isolated environment with seed data and example payloads for validation.', icon: GitBranch, category: 'Developer', status: 'Available' },
    { id: 'dev-versioning', title: 'Versioning & change windows', desc: 'Stable releases, deprecation notices, and migration guides with examples.', icon: FileCheck2, category: 'Developer', status: 'Available' },

    // Security
    { id: 'sec-transport', title: 'Encryption in transit & at rest', desc: 'TLS everywhere and encrypted storage for sensitive records.', icon: Lock, category: 'Security', status: 'Available' },
    { id: 'sec-rbac', title: 'RBAC & least privilege', desc: 'Granular roles, service accounts, and scoped tokens for automation.', icon: Shield, category: 'Security', status: 'Available' },
    { id: 'sec-audit', title: 'Audit logs', desc: 'Event trails across key actions and configuration changes.', icon: BookOpenCheck, category: 'Security', status: 'Available' },
    { id: 'sec-sso', title: 'SSO (SAML/OAuth2)', desc: 'Single Sign-On for organizations with strong session hygiene.', icon: ShieldCheck, category: 'Security', status: 'Available' },

    // Trust & Safety
    { id: 'ts-verify', title: 'Partner verification', desc: 'Structured onboarding, document checks, and recurring validations.', icon: CheckCircle2, category: 'Trust & Safety', status: 'Available' },
    { id: 'ts-privacy', title: 'Privacy controls', desc: 'Minimal collection, explicit scopes, and clear retention behaviors.', icon: Shield, category: 'Trust & Safety', status: 'Available' },
    { id: 'ts-ux', title: 'Clear policies', desc: 'Pricing, fees, and policies shown up front — the same truth everywhere.', icon: FileCheck2, category: 'Trust & Safety', status: 'Available' },
    { id: 'ts-escalation', title: 'Support & escalation', desc: 'In-flow help, evidence-based disputes, and fair resolution paths.', icon: LifeBuoy, category: 'Trust & Safety', status: 'Available' },

    // Operations
    { id: 'ops-portal', title: 'Partner portal', desc: 'Inventory, pricing, policy, and content management in one place.', icon: Settings2, category: 'Operations', status: 'Available' },
    { id: 'ops-health', title: 'Health & alerts', desc: 'Real-time status, circuit breakers, and paging on critical signals.', icon: Bell, category: 'Operations', status: 'Available' },
    { id: 'ops-catalog', title: 'Catalog API', desc: 'Sync items, media, and constraints with conflict resolution.', icon: Database, category: 'Operations', status: 'Available' },
    { id: 'ops-pay', title: 'Payments orchestration', desc: 'Tokenized payments via certified processors; consistent receipts.', icon: Wallet, category: 'Operations', status: 'Available' },

    // Analytics
    { id: 'an-dash', title: 'Dashboards', desc: 'From views to conversions — understand funnel quality by city and date.', icon: LineChart, category: 'Analytics', status: 'Available' },
    { id: 'an-cohort', title: 'Cohorts & segments', desc: 'Slice by audience type and session intent to guide product bets.', icon: Users, category: 'Analytics', status: 'Available' },
    { id: 'an-export', title: 'Data export', desc: 'Self-serve CSV/Parquet exports and scheduled reports.', icon: Activity, category: 'Analytics', status: 'Available' },

    // Enterprise
    { id: 'ent-sla', title: 'SLAs & incident reports', desc: 'Response windows and post-incident summaries in 24–48h.', icon: Timer, category: 'Enterprise', status: 'Available' },
    { id: 'ent-i18n', title: 'Localization program', desc: 'Languages, currencies, formats, and regional nuances.', icon: Globe2, category: 'Enterprise', status: 'Available' },
    { id: 'ent-white', title: 'White-label themes', desc: 'Brandable surfaces with safe defaults and accessible color ramps.', icon: Wand2, category: 'Enterprise', status: 'Available' },
    { id: 'ent-cloud', title: 'Regional hosting options', desc: 'Data residency and regional failover strategies evaluated per need.', icon: Cloud, category: 'Enterprise', status: 'Available' },
  ];

  return (
    <div className="features-page" data-tone={tone}>
      <BackgroundEffects />

      {/* HERO — aligned like other pages */}
      <section ref={heroRef} className="hero">
        <div className="hero-inner">
         
          <h1 className="hero-title">Platform Features</h1>
          <p className="hero-sub">A clear overview of capabilities available today across surfaces and platform layers.</p>

          {/* Category pills (contrast-fixed for light mode, centered, edge-fade) */}
          <div className="pill-scroll" role="tablist" aria-label="Feature categories">
            <div className="pill-track">
              {categories.map(c => (
                <a
                  key={c.id}
                  role="tab"
                  aria-selected={active === c.id}
                  className={`pill ${active === c.id ? 'pill-on' : ''}`}
                  href={`#${c.id.toLowerCase()}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.querySelector<HTMLElement>(`[data-cat='${c.id}']`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  title={c.label}
                >
                  <span className="nowrap">{c.label}</span>
                </a>
              ))}
            </div>
            <div className="pill-fade pill-fade-left" aria-hidden="true" />
            <div className="pill-fade pill-fade-right" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* FEATURE SECTIONS — unified spacing/typography */}
      {categories.map(cat => {
        const items = FEATURES.filter(f => f.category === cat.id);
        return (
          <section key={cat.id} id={cat.id.toLowerCase()} data-cat={cat.id} className="grid-section">
            <div className="section-container">
              <div className="section-header">
                <h2 className="section-title">{cat.label}</h2>
                <p className="section-subtitle">Everything in this section is available.</p>
              </div>
              <div className="grid">
                {items.map(({ id, title, desc, icon: Icon, status }) => (
                  <div key={id} className="card" data-status={status}>
                    <div className="card-head">
                      <div className="card-icon"><Icon /></div>
                      <span className="badge b-available">{status}</span>
                    </div>
                    <h3 className="card-title">{title}</h3>
                    <p className="card-desc">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* HOW IT FITS */}
      <section className="flows-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">How the pieces connect</h2>
            <p className="section-subtitle">
              A modular architecture: core surfaces on top, partner integrations in the middle, and a secure foundation underneath.
            </p>
          </div>

          <div className="flows-grid">
            <div className="flow">
              <div className="flow-icon"><Layers /></div>
              <h4>Core surfaces</h4>
              <p>Discovery, itinerary, and localized UI provide a consistent customer experience.</p>
            </div>
            <div className="flow">
              <div className="flow-icon"><Link2 /></div>
              <h4>Partner integrations</h4>
              <p>Direct API or via ecosystem hubs; webhooks for real-time sync; clear change management.</p>
            </div>
            <div className="flow">
              <div className="flow-icon"><Shield /></div>
              <h4>Foundation</h4>
              <p>RBAC, audit trails, encryption, and privacy controls — security built in, not bolted on.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="section-container cta-wrap">
          <div className="cta-copy">
            <h3>Interested in partnering or investing?</h3>
            <p>We can walk you through the live stack and integration paths.</p>
          </div>
          <div className="cta-actions">
            <a className="btn-primary" href="mailto:partners@saturnusgo.com">Contact partnerships</a>
            <a className="btn-secondary" href="mailto:invest@saturnusgo.com">Investor relations</a>
          </div>
        </div>
      </section>

      {/* STYLES — matches tokens/ramps used on FAQ/Partners; fixes light-mode pill contrast and hero alignment */}
      <style jsx global>{`
        /* ============================
           TOKENS — DARK (default)
        =============================*/
        .features-page {
          --bg-0:#0a0b0d; --bg-1:#0f1115; --grid:rgba(255,255,255,.035);
          --txt:#e7e9ee; --txt-2:#c2c6cf; --txt-3:#9aa0a6;
          --ink:#e9ebf2; --ink-2:#cbd1dc;
          --primary:#646cff; --primary-hover:#5a63f0;
          --rule:rgba(255,255,255,.10);
          --ring:rgba(100,108,255,.25);
          --white-02:rgba(255,255,255,.02); --white-04:rgba(255,255,255,.04);
          --white-06:rgba(255,255,255,.06); --white-08:rgba(255,255,255,.08); --white-12:rgba(255,255,255,.12);
          --radius-lg:20px; --radius-xl:28px;
          --shadow-1:0 10px 30px rgba(0,0,0,.28), 0 1px 0 rgba(255,255,255,.02) inset;
          --shadow-2:0 24px 60px -20px rgba(0,0,0,.5);

          min-height:100vh; position:relative;
          color:var(--txt);
          background:
            radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.08), transparent),
            linear-gradient(135deg,var(--bg-0), var(--bg-1));
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, system-ui, sans-serif;
        }

        /* ============================
           TOKENS — LIGHT
        =============================*/
        .features-page[data-tone='light'],
        :global(html.light) .features-page {
          --bg-0:#f6f8fb; --bg-1:#ffffff; --grid:rgba(2,6,23,.06);
          --txt:#0f172a; --txt-2:#475569; --txt-3:#64748b;
          --ink:#0b1220; --ink-2:#334155;
          --rule:rgba(2,6,23,.12);
          --white-02:rgba(2,6,23,.02); --white-04:rgba(2,6,23,.04);
          --white-06:rgba(2,6,23,.06); --white-08:rgba(2,6,23,.08); --white-12:rgba(2,6,23,.12);
          --shadow-1:0 10px 30px rgba(2,6,23,.08), 0 1px 0 rgba(255,255,255,1) inset;
          --shadow-2:0 24px 60px -20px rgba(2,6,23,.18);

          background:
            radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.09), transparent),
            linear-gradient(135deg,var(--bg-0), var(--bg-1));
          color:var(--txt);
        }

        /* HERO — centered like other pages; fixed top offset under header */
        .hero{
          min-height:85vh;
          display:flex; align-items:center; justify-content:center;
          padding:92px 24px 56px; /* header-safe */
          text-align:center; position:relative;
        }
        .hero-inner{max-width:980px; width:100%}
        .hero-logo{
          max-width:140px; height:auto; margin:0 auto 18px; display:block;
          filter:drop-shadow(0 10px 20px rgba(0,0,0,.35))
        }
        .features-page[data-tone='light'] .hero-logo,
        :global(html.light) .features-page .hero-logo {
          filter: drop-shadow(0 8px 16px rgba(2,6,23,.12))
        }
        .hero-title{
          font-size:clamp(44px,7vw,84px); font-weight:850; letter-spacing:-.02em; line-height:1.04; margin:0 0 10px;
          background:linear-gradient(to right, var(--txt), var(--txt-2));
          -webkit-background-clip:text; background-clip:text; color:transparent;
          -webkit-text-fill-color: transparent;
        }
        .hero-sub{
          color:var(--txt-2); font-size:18px; max-width:760px; margin:0 auto 14px;
        }

        /* Pills — centered; light-mode contrast fixed; edge fades */
        .pill-scroll{
          position:relative;
          display:flex; justify-content:center;
          overflow-x:auto; -webkit-overflow-scrolling:touch;
          margin: 12px auto 0; max-width: 980px;
          scrollbar-width: none;
          mask-image: linear-gradient(to right, transparent 0, black 28px, black calc(100% - 28px), transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0, black 28px, black calc(100% - 28px), transparent 100%);
        }
        .pill-scroll::-webkit-scrollbar{ display:none; }
        .pill-track{
          display:flex; justify-content:center; flex-wrap:wrap;
          gap:12px; padding:8px 10px; width:100%;
        }
        .pill{
          display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:999px;
          background: var(--white-06); border:1px solid var(--white-12);
          color:var(--txt); font-weight:800; font-size:13px; letter-spacing:.2px; white-space:nowrap; cursor:pointer; transition:all .2s ease;
          box-shadow: var(--shadow-1);
        }
        .features-page[data-tone='dark'] .pill { background: var(--white-04); color: var(--txt-2); }
        .pill:hover{ transform: translateY(-1px); }
        .pill-on{ background: var(--primary) !important; color:#fff !important; border-color:transparent }
        .nowrap{white-space:nowrap}
        .pill-fade{
          position:absolute; top:0; bottom:0; width:28px; pointer-events:none;
          background: linear-gradient(to right, var(--bg-1), transparent);
        }
        .pill-fade-left{ left:0; }
        .pill-fade-right{ right:0; transform: scaleX(-1); }

        /* Sections */
        .grid-section{padding:40px 0 44px}
        .grid-section:first-of-type{padding-top:18px}
        .section-container{max-width:1200px; margin:0 auto; padding:0 24px}
        .section-header{text-align:center; margin-bottom:22px}
        .section-title{
          font-size:clamp(28px,4.5vw,40px); font-weight:850; margin:0 0 6px;
          background:linear-gradient(to right, var(--txt), var(--txt-2)); -webkit-background-clip:text; background-clip:text; color:transparent;
          -webkit-text-fill-color: transparent;
        }
        .section-subtitle{color:var(--txt-2); max-width:760px; margin:0 auto}
        .grid{display:grid; gap:20px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))}
        .card{
          background: var(--white-08); border:1px solid var(--white-12); border-radius: var(--radius-xl); padding: 20px;
          transition: transform .25s ease, background .25s ease, box-shadow .25s ease;
        }
        .features-page[data-tone='dark'] .card:hover{ transform: translateY(-6px); background: var(--white-12); box-shadow: var(--shadow-2) }
        .features-page[data-tone='light'] .card:hover{ transform: translateY(-4px); background: var(--white-12); box-shadow: var(--shadow-1) }
        .card-head{display:flex; align-items:center; justify-content:space-between; margin-bottom:10px}
        .card-icon{width:38px; height:38px; border-radius:12px; background: var(--primary); color:#fff; display:grid; place-items:center}
        .card-icon :global(svg){width:18px; height:18px}
        .badge{
          display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:800; letter-spacing:.2px;
          border:1px solid var(--white-12); background:color-mix(in oklab, var(--primary) 20%, transparent); color:#fff;
        }
        .card-title{margin:0 0 6px; font-size:18px; font-weight:800; color:var(--txt)}
        .card-desc{margin:0; color:var(--txt-2); line-height:1.65; font-size:14.5px}

        /* How it fits */
        .flows-section{padding:64px 0; background: var(--white-02)}
        .flows-grid{display:grid; gap:18px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); margin-top:12px}
        .flow{background: var(--white-08); border:1px solid var(--white-12); border-radius: var(--radius-xl); padding:20px}
        .flow-icon{width:38px; height:38px; border-radius:12px; background: var(--primary); color:#fff; display:grid; place-items:center; margin-bottom:8px}
        .flow-icon :global(svg){width:18px; height:18px}
        .flow h4{margin:0 0 4px; font-size:16px}
        .flow p{margin:0; color:var(--txt-2); line-height:1.65; font-size:14.5px}

        /* CTA */
        .cta-section{padding:80px 0 120px}
        .cta-wrap{
          display:grid; gap:20px; grid-template-columns: 1.2fr auto; align-items:center;
          background: var(--white-08); border:1px solid var(--white-12); border-radius: var(--radius-xl); padding: 24px;
        }
        .cta-copy h3{margin:0 0 6px; font-size:26px; text-align:center}
        .cta-copy p{margin:0; color:var(--txt-2); text-align:center}
        .cta-actions{display:flex; gap:12px; flex-wrap:wrap; justify-content:center}
        .btn-primary, .btn-secondary{
          display:inline-flex; align-items:center; gap:8px; padding:14px 22px; border-radius:18px; font-weight:800; font-size:15px; border:none; cursor:pointer; text-decoration:none;
        }
        .btn-primary{background: var(--primary); color:#fff}
        .btn-primary:hover{background: var(--primary-hover); transform: translateY(-2px)}
        .btn-secondary{background: var(--white-08); color: var(--txt); border:1px solid var(--white-12)}
        .btn-secondary:hover{background: var(--white-12); transform: translateY(-2px)}
        @media (max-width: 960px){
          .cta-wrap{grid-template-columns:1fr; text-align:center}
          .cta-actions{justify-content:center}
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce){
          .hero { transform:none !important; opacity:1 !important; }
        }
      `}</style>
    </div>
  );
}

/* Minimal inline icons to avoid extra deps */
function CarIcon(props: any){
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...props}>
      <path fill="currentColor" d="M5.5 11h13l-1.2-3.6a2 2 0 0 0-1.9-1.4H8.6a2 2 0 0 0-1.9 1.4L5.5 11Zm12.5 2H6a2 2 0 0 0-2 2v3h2v-1h12v1h2v-3a2 2 0 0 0-2-2Z" />
      <path d="M7.5 6h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}
function UtensilsIcon(props: any){
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...props}>
      <path fill="currentColor" d="M7 3c.6 0 1 .4 1 1v6a2 2 0 1 1-2 0V4c0-.6.4-1 1-1Zm4 0h1a3 3 0 0 1 3 3v5h2v10h-2v-6h-2v6h-2V3Z"/>
    </svg>
  );
}
function TicketIcon(props: any){
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...props}>
      <path fill="currentColor" d="M3 9a2 2 0 0 0 0 6h18v-3a2 2 0 0 1 0-4V5H3v4Z"/>
      <path fill="currentColor" d="M6 7h2v10H6z"/>
    </svg>
  );
}
