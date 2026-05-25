// app/pricing/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Wallet, Shield, Wand2, CheckCircle2, ArrowRight,
  Headphones, CreditCard, Lock, Crown
} from 'lucide-react';

const BackgroundEffects = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div
      className="absolute inset-0 opacity-[0.04]"
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

/* ---------- Seed-aligned features (marketing labels) ---------- */
const FEATURES = {
  CASHBACK_5: 'Cashback 5%',
  PRIORITY_DISPATCH: 'Priority dispatch',
  CASHBACK_10: 'Cashback 10%',
  AUTO_UPGRADE: 'Auto-upgrade to higher ride class (when available)',
  EARLY_ACCESS: 'Early access to new features',
  SUPPORT_PRIORITY: 'Priority support queue',
  BUSINESS_DISCOUNT: 'Business & premium category discounts',
  PERSONAL_SUPPORT_24_7: '24/7 personal support assistant',
  APP_BRANDING: 'Custom app branding (for fun)',
  TOPUP_BONUS: '+3% wallet top-up bonus',
  HOTEL_DISCOUNT: 'Exclusive hotel discounts',
} as const;

/* ---------- Flexible unlock prices (from seeder) ---------- */
const FLEX_PRICES: { title: string; price: number }[] = [
  { title: FEATURES.CASHBACK_5, price: 4 },
  { title: FEATURES.PRIORITY_DISPATCH, price: 8 },
  { title: FEATURES.CASHBACK_10, price: 12 },
  { title: FEATURES.AUTO_UPGRADE, price: 18 },
  { title: FEATURES.EARLY_ACCESS, price: 22 },
  { title: FEATURES.SUPPORT_PRIORITY, price: 26 },
  { title: FEATURES.BUSINESS_DISCOUNT, price: 30 },
  { title: FEATURES.TOPUP_BONUS, price: 35 },
  { title: FEATURES.HOTEL_DISCOUNT, price: 40 },
  { title: FEATURES.PERSONAL_SUPPORT_24_7, price: 45 },
  { title: FEATURES.APP_BRANDING, price: 50 },
];

type PlanKey = 'base' | 'standard' | 'pro' | 'flexible';

type Plan = {
  key: PlanKey;
  name: string;
  price?: number; // for non-flexible
  range?: [number, number]; // for flexible
  desc: string;
  icon: React.ComponentType<any>;
  badge?: string;
  features: string[];
  isFlexible?: boolean;
};

/* ---------- Plans (your prices) ---------- */
const PLANS: Plan[] = [
  {
    key: 'base',
    name: 'Base',
    price: 7.99,
    desc: 'Essential perks to get you moving.',
    icon: Wallet,
    features: [
      FEATURES.CASHBACK_5,
      FEATURES.PRIORITY_DISPATCH,
    ],
  },
  {
    key: 'standard',
    name: 'Standard',
    price: 14.99,
    desc: 'More benefits and early access.',
    icon: Shield,
    badge: 'Most popular',
    features: [
      FEATURES.CASHBACK_5,
      FEATURES.PRIORITY_DISPATCH,
      FEATURES.CASHBACK_10,
      FEATURES.AUTO_UPGRADE,
      FEATURES.EARLY_ACCESS,
      FEATURES.SUPPORT_PRIORITY,
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 29.99,
    desc: 'Everything unlocked for power users.',
    icon: Crown,
    features: [
      FEATURES.CASHBACK_5,
      FEATURES.PRIORITY_DISPATCH,
      FEATURES.CASHBACK_10,
      FEATURES.AUTO_UPGRADE,
      FEATURES.EARLY_ACCESS,
      FEATURES.SUPPORT_PRIORITY,
      FEATURES.BUSINESS_DISCOUNT,
      FEATURES.PERSONAL_SUPPORT_24_7,
      FEATURES.APP_BRANDING,
      FEATURES.TOPUP_BONUS,
      FEATURES.HOTEL_DISCOUNT,
    ],
  },
  {
    key: 'flexible',
    name: 'Flexible',
    range: [4, 69],
    desc: 'Build-your-own subscription. Pay only for what you unlock.',
    icon: Wand2,
    isFlexible: true,
    features: FLEX_PRICES.map(f => `${f.title} — from $${f.price.toFixed(0)}`),
  },
];

export default function PricingPage() {
  const heroRef = useRef<HTMLElement>(null);

  // subtle parallax (disabled by prefers-reduced-motion)
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          const h = el.offsetHeight || 1;
          const p = Math.min(y / (h * 0.6), 1);
          el.style.transform = `translateY(${p * 14}px)`;
          el.style.opacity = `${Math.max(1 - p * 0.22, 0.88)}`;
          ticking = false;
        });
        ticking = true;
      }
    };
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!media.matches) window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // theme hook (dark/light)
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const tone = mounted && resolvedTheme === 'light' ? 'light' : 'dark';

  return (
    <div className="pricing-page" data-tone={tone}>
      <BackgroundEffects />

      {/* HERO */}
      <section ref={heroRef} className="hero">
        <div className="hero-inner">
          <img
            src="https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/logo.png"
            alt="SaturnusGo"
            className="hero-logo"
          />
          <h1 className="hero-title">Pricing</h1>
          <p className="hero-sub">
            Four clear options — pick a ready plan or compose your own with Flexible. Everything here is available today.
          </p>
          <div className="hero-cta">
            <a className="btn-primary" href="/subscribe">
              Start now <ArrowRight className="btn-icon" />
            </a>
            <a className="btn-secondary" href="mailto:partners@saturnusgo.com">
              Contact sales
            </a>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section className="plans-section" aria-label="Subscription plans">
        <div className="section-container">
          <div className="plans-grid">
            {PLANS.map((p) => {
              const Icon = p.icon;
              const isPopular = Boolean(p.badge);
              return (
                <article key={p.key} className={`plan ${isPopular ? 'plan--highlight' : ''}`} aria-labelledby={`plan-${p.key}-title`}>
                  {p.badge && <div className="plan-badge" aria-label="plan badge">{p.badge}</div>}

                  <header className="plan-head">
                    <div className="plan-icon" aria-hidden="true"><Icon /></div>
                    <h3 id={`plan-${p.key}-title`} className="plan-name">{p.name}</h3>
                    <p className="plan-desc">{p.desc}</p>

                    <div className="plan-price" aria-label="price">
                      {p.isFlexible ? (
                        <>
                          <span className="price-num">From ${p.range?.[0]}</span>
                          <span className="price-range">to ${p.range?.[1]}</span>
                        </>
                      ) : (
                        <>
                          <span className="price-num">${p.price?.toFixed(2)}</span>
                          <span className="price-per">/mo</span>
                        </>
                      )}
                    </div>
                  </header>

                  <ul className="plan-features">
                    {p.isFlexible ? (
                      FLEX_PRICES.map(item => (
                        <li key={item.title} className="pf pf-flex">
                          <span className="pf-left">
                            <CheckCircle2 className="pf-ico" aria-hidden="true" />
                            {item.title}
                          </span>
                          <span className="pf-tag">${item.price.toFixed(0)}</span>
                        </li>
                      ))
                    ) : (
                      p.features.map(f => (
                        <li key={f} className="pf">
                          <CheckCircle2 className="pf-ico" aria-hidden="true" />
                          {f}
                        </li>
                      ))
                    )}
                  </ul>

                  <div className="plan-actions">
                    {p.isFlexible ? (
                      <a className="btn-primary" href="/subscribe/flexible">
                        Build your plan <ArrowRight className="btn-icon" />
                      </a>
                    ) : (
                      <a className="btn-primary" href={`/subscribe/${p.key}`}>
                        Choose {p.name} <ArrowRight className="btn-icon" />
                      </a>
                    )}
                    <a className="btn-secondary" href="mailto:partners@saturnusgo.com">
                      Talk to us
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          <p className="legal-note">
            Prices in USD. Taxes may apply. Flexible total depends on selected unlocks.
          </p>
        </div>
      </section>

      {/* TRUST PERKS (short row, clean) */}
      <section className="perks-section" aria-label="Highlights">
        <div className="section-container">
          <div className="perks-grid">
            <div className="perk">
              <div className="perk-ico" aria-hidden="true"><CreditCard /></div>
              <h4>No hidden fees</h4>
              <p>Clear, upfront pricing across all plans.</p>
            </div>
            <div className="perk">
              <div className="perk-ico" aria-hidden="true"><Headphones /></div>
              <h4>Priority support</h4>
              <p>Fast help when you need it most.</p>
            </div>
            <div className="perk">
              <div className="perk-ico" aria-hidden="true"><Lock /></div>
              <h4>Built-in privacy</h4>
              <p>Secure by default for peace of mind.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" aria-label="Call to action">
        <div className="section-container cta-wrap">
          <div className="cta-copy">
            <h3>Ready to get started?</h3>
            <p>Pick a plan or compose a Flexible bundle — everything is available now.</p>
          </div>
          <div className="cta-actions">
            <a className="btn-primary" href="/subscribe">View plans in app</a>
            <a className="btn-secondary" href="mailto:partners@saturnusgo.com">Contact sales</a>
          </div>
        </div>
      </section>

      {/* STYLES */}
      <style jsx global>{`
        /* ============================
           TOKENS — DARK (default)
        =============================*/
        .pricing-page{
          --bg-0:#0a0b0d; --bg-1:#0f1115; --grid:rgba(255,255,255,.06);
          --text:#e7e9ee; --text-2:#c2c6cf; --text-3:#9aa0a6;
          --ink:#e9ebf2; --ink-2:#cbd1dc;
          --primary:#646cff; --primary-hover:#5a63f0;
          --border: rgba(255,255,255,.12);
          --surface: rgba(255,255,255,.08);
          --surface-2: rgba(255,255,255,.12);
          --ring:rgba(100,108,255,.25);
          --radius-lg:20px; --radius-xl:28px;
          --elev-1: 0 24px 60px -20px rgba(0,0,0,.5);

          min-height:100vh; position:relative;
          color:var(--text);
          background:
            radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.08), transparent),
            linear-gradient(135deg,var(--bg-0), var(--bg-1));
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* ============================
           TOKENS — LIGHT OVERRIDES
        =============================*/
        .pricing-page[data-tone='light'],
        :global(html.light) .pricing-page {
          --bg-0:#f6f8fb; --bg-1:#ffffff; --grid:rgba(2,6,23,.06);
          --text:#0f172a; --text-2:#475569; --text-3:#64748b;
          --ink:#0b1220; --ink-2:#334155;
          --border: rgba(2,6,23,.12);
          --surface: #ffffff;
          --surface-2: #f8fafc;
          --elev-1: 0 8px 24px rgba(2,6,23,.08);
          background:
            radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.08), transparent),
            linear-gradient(135deg,var(--bg-0), var(--bg-1));
        }

        /* HERO (centered as requested) */
        .hero{
          min-height:72vh; display:grid; place-items:center; padding:92px 24px 36px;
          text-align:center; position:relative;
        }
        .hero-inner{max-width:980px; width:100%}
        .hero-logo{
          max-width:140px; height:auto; margin:0 auto 18px; display:block;
          filter:drop-shadow(0 10px 20px rgba(0,0,0,.35));
        }
        .pricing-page[data-tone='light'] .hero-logo,
        :global(html.light) .pricing-page .hero-logo { filter: drop-shadow(0 8px 16px rgba(2,6,23,.12)) }
        .hero-title{
          font-size:clamp(44px,7vw,84px); font-weight:850; letter-spacing:-.02em; line-height:1.04; margin:0 0 8px;
          background:linear-gradient(to right, var(--ink), var(--ink-2));
          -webkit-background-clip:text; background-clip:text; color:transparent;
        }
        .hero-sub{color:var(--text-2); font-size:18px; max-width:760px; margin:0 auto 16px}
        .hero-cta{display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-top:6px}

        /* PLANS */
        .plans-section{padding:60px 0 24px}
        .section-container{max-width:1200px; margin:0 auto; padding:0 24px}
        .plans-grid{
          display:grid; gap:22px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          align-items:stretch;
        }

        .plan{
          position:relative;
          background: var(--surface);
          border:1px solid var(--border);
          border-radius: var(--radius-xl);
          padding:22px;
          display:flex; flex-direction:column;
          transition:transform .25s ease, background .25s ease, box-shadow .25s ease, border-color .25s ease;
        }
        .pricing-page[data-tone='dark'] .plan:hover{ transform: translateY(-6px); background: var(--surface-2); box-shadow: var(--elev-1) }
        .pricing-page[data-tone='light'] .plan:hover{ transform: translateY(-4px); background: var(--surface-2) } /* light: softer */

        .plan--highlight{
          outline: 2px solid color-mix(in srgb, var(--primary) 32%, transparent);
          outline-offset: 0px;
        }
        .plan-badge{
          position:absolute; top:12px; right:12px;
          padding:6px 10px; border-radius:999px; font-size:12px; font-weight:800; letter-spacing:.2px;
          background:color-mix(in srgb, var(--primary) 24%, transparent); color:#fff; border:1px solid transparent;
        }

        .plan-head{ text-align:center; margin-bottom:12px }
        .plan-icon{ width:42px; height:42px; border-radius:12px; background: var(--primary); color:#fff; display:grid; place-items:center; margin: 0 auto 8px }
        .plan-icon :global(svg){ width:18px; height:18px }
        .plan-name{ margin:0 0 4px; font-size:20px; font-weight:850; color:var(--text) }
        .plan-desc{ margin:0 0 10px; color:var(--text-2); font-size:14.5px }
        .plan-price{ display:flex; align-items:baseline; justify-content:center; gap:8px; margin-bottom:6px }
        .price-num{ font-size:32px; font-weight:900; color:var(--primary) }
        .price-per, .price-range{ color:var(--text-2); font-weight:700; letter-spacing:.2px }

        .plan-features{
          list-style:none; margin:10px 0 16px; padding:0; display:grid; gap:10px;
        }
        .pf{ display:flex; gap:10px; align-items:flex-start; color:var(--text-2); font-size:14.5px; line-height:1.6 }
        .pf-ico{ width:16px; height:16px; color:var(--primary); flex:0 0 auto; margin-top:2px }
        .pf-flex{ justify-content:space-between; align-items:center }
        .pf-left{ display:flex; gap:10px; align-items:flex-start }
        .pf-tag{
          padding:6px 10px; border-radius:999px; border:1px solid var(--border); background: var(--surface);
          font-size:12px; font-weight:800; color:var(--text-2);
        }

        .plan-actions{
          margin-top:auto; display:flex; gap:10px; flex-wrap:wrap; justify-content:center;
        }
        .btn-primary, .btn-secondary{
          display:inline-flex; align-items:center; gap:8px; padding:12px 18px; border-radius:16px;
          font-weight:800; font-size:14px; border:none; cursor:pointer; text-decoration:none;
        }
        .btn-primary{ background: var(--primary); color:#fff }
        .btn-primary:hover{ background: var(--primary-hover); transform: translateY(-2px) }
        .btn-secondary{ background: var(--surface); color: var(--text); border:1px solid var(--border) }
        .btn-secondary:hover{ background: var(--surface-2); transform: translateY(-2px) }
        .btn-icon{ width:16px; height:16px }

        .legal-note{
          text-align:center; color:var(--text-3); font-size:12.5px; margin:16px 0 0;
        }

        /* PERKS */
        .perks-section{ padding:60px 0; background:
          linear-gradient(180deg, transparent 0%, rgba(255,255,255,.02) 100%)
        }
        .perks-grid{ display:grid; gap:18px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) }
        .perk{ background: var(--surface); border:1px solid var(--border); border-radius: var(--radius-xl); padding:18px }
        .perk-ico{ width:36px; height:36px; border-radius:12px; background: var(--primary); color:#fff; display:grid; place-items:center; margin-bottom:8px }
        .perk-ico :global(svg){ width:16px; height:16px }
        .perk h4{ margin:0 0 4px; font-size:16px }
        .perk p{ margin:0; color:var(--text-2); font-size:14.5px; line-height:1.6 }

        /* CTA */
        .cta-section{ padding:80px 0 120px }
        .cta-wrap{
          display:grid; gap:20px; grid-template-columns: 1.2fr auto; align-items:center;
          background: var(--surface); border:1px solid var(--border); border-radius: var(--radius-xl); padding: 24px;
        }
        .cta-copy h3{ margin:0 0 6px; font-size:26px; text-align:center }
        .cta-copy p{ margin:0; color:var(--text-2); text-align:center }
        .cta-actions{ display:flex; gap:12px; flex-wrap:wrap; justify-content:center }
        @media (max-width: 960px){
          .cta-wrap{ grid-template-columns:1fr; text-align:center }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce){
          .hero { transform:none !important; opacity:1 !important; }
        }
      `}</style>
    </div>
  );
}
