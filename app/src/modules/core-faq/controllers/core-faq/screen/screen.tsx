// app/faq/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronUp, Mail, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

/* Background grid */
const BackgroundEffects = () => (
  <div className="bgfx absolute inset-0 overflow-hidden pointer-events-none">
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
);

/* Theme toggle */
function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const active = mounted ? resolvedTheme ?? theme : "dark";
  const isLight = active === "light";
  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
    >
      {isLight ? <Moon size={18} /> : <Sun size={18} />}
      <span>{isLight ? "Dark" : "Light"}</span>
    </button>
  );
}

/* FAQ item */
type QA = { question: string; answer: string };

function FAQItem({ qa, index }: { qa: QA; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.06, ease: "easeOut" }}
      className={`faq-item ${open ? "open" : ""}`}
    >
      <button
        type="button"
        className="faq-q"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{qa.question}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0, scale: open ? 1.08 : 1 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="faq-icon"
        >
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="faq-a-wrap"
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: { duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] },
                opacity: { duration: 0.2, delay: 0.08 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: { height: { duration: 0.25 }, opacity: { duration: 0.2 } },
            }}
          >
            <motion.p
              className="faq-a"
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {qa.answer}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* Data */
const logoSrc =
  "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/logo.png";

const FAQ_SECTIONS: { title: string; items: QA[] }[] = [
  {
    title: "General",
    items: [
      {
        question: "What is SaturnusGo?",
        answer:
          "SaturnusGo is a travel super-app that unifies ride-hailing, hotel & SPA bookings, wishlists with an AI weekend planner, event tickets, and a financial hub (wallet, cards, P2P transfers) in one clean experience.",
      },
      {
        question: "Where is SaturnusGo available?",
        answer:
          "We’re starting in South America (initially Argentina) and expanding next. We do not plan to launch in Russia/CIS. Availability may vary by city and partner network.",
      },
      {
        question: "Is SaturnusGo live now?",
        answer:
          "We’re in active development with staged rollouts and a public waitlist. Some screens show test data for demonstration. Partners and early users onboard progressively.",
      },
      {
        question: "Which languages does the app support?",
        answer:
          "English, Russian, and Spanish (with a focus on Argentine Spanish). More locales will be added as we expand.",
      },
    ],
  },
  {
    title: "Rides",
    items: [
      {
        question: "How do rides work?",
        answer:
          "Pick your pickup & destination on the map, choose a ride class in the animated panel, review a transparent price breakdown, then confirm. Saved Places and offline-first maps help you order faster.",
      },
      {
        question: "What ride classes are available?",
        answer:
          "Classes vary by city and demand. Dynamic pricing uses distance, time, vehicle class multipliers, and surge reasons. Subscriptions may auto-upgrade your class when available.",
      },
      {
        question: "Can I pay cash for a ride?",
        answer:
          "Yes, if you choose Cash as a payment method for that trip. If a card is attached to the TripID, the charge will be captured on trip completion instead.",
      },
      {
        question: "Why was my trip cancelled?",
        answer:
          "Trips can be cancelled only by the user or the driver. The system will not auto-cancel rides. If you experienced a different behavior, please report it via Support with time and trip details.",
      },
    ],
  },
  {
    title: "Hotels & SPA",
    items: [
      {
        question: "How does hotel booking work?",
        answer:
          "Search, filter, and book hotels with rich detail (photos, amenities, coordinates, social links). We integrate Hotelbeds data and provide a clear checkout with partial-payment options where available.",
      },
      {
        question: "What is partial payment?",
        answer:
          "You may pay a part now and the remainder later. If the remainder isn’t paid ~12 hours before check-in, the booking may auto-cancel per policy. Exact windows depend on the rate and partner rules.",
      },
      {
        question: "Can I book SPA resorts?",
        answer:
          "Yes. SPA-resorts are supported as a dedicated module, with similar flow to hotels and curated details on the place screen.",
      },
      {
        question: "How do I modify or cancel a booking?",
        answer:
          "This depends on your rate type and partner policies. Use the booking details screen to request changes or contact Support with your booking ID.",
      },
    ],
  },
  {
    title: "Wallet, Payments & Transfers",
    items: [
      {
        question: "Which payment methods are supported?",
        answer:
          "Bank cards and local payment methods (LATAM-ready) are supported. Apple Pay / Google Pay are enabled where allowed by region and device. Cash is supported for rides (when selected).",
      },
      {
        question: "Do you support P2P transfers?",
        answer:
          "Yes. You can send and request money from other users. Transfers appear in your transaction history with real-time status updates.",
      },
      {
        question: "How do bonuses work?",
        answer:
          "Subscriptions can grant bonus accrual on top-ups and trips (e.g., ~3% on balance top-ups and ~10% on rides, plan-dependent). Bonuses can be stored and used to pay for trips and services.",
      },
      {
        question: "Refunds & charge processing",
        answer:
          "Card charges are processed on trip completion or at booking time (for hotels/events). Refund timing depends on the payment network and partner policies.",
      },
    ],
  },
  {
    title: "Subscriptions & Loyalty",
    items: [
      {
        question: "What plans do you offer?",
        answer:
          "Base, Standard, Pro, and Flexibility. Perks include auto-upgrade of ride class (when available), priority, bonus accrual, and more. Exact benefits can vary by region.",
      },
      {
        question: "What is Flexibility and charity allocation?",
        answer:
          "Flexibility focuses on freedom of choice and social impact. 30% of the Flexibility subscription amount is directed to charity initiatives.",
      },
      {
        question: "Do subscriptions reduce business costs?",
        answer:
          "Perks are designed as user benefits without increasing the platform’s operational spend. They focus on value, transparency, and experience quality.",
      },
    ],
  },
  {
    title: "Wishlists, AI & Places",
    items: [
      {
        question: "What is the AI Weekend Planner?",
        answer:
          "It builds weekend routes from your wishlists, adds descriptions, and updates place cards. You’ll get a push notification when your plan is ready.",
      },
      {
        question: "How do Wishlists and Saved Places work?",
        answer:
          "Create lists, mark plans, and keep everything tidy. Saved Places has a dedicated sliding panel with smooth animations to quickly browse, filter, and navigate.",
      },
      {
        question: "Do place data and hotel data match?",
        answer:
          "Yes. We rigorously unify DTOs and interfaces so that API place data fully matches wishlist structures (category, coords, photos, socials, hours, etc.).",
      },
    ],
  },
  {
    title: "Events & Tickets",
    items: [
      {
        question: "Can I buy event tickets in SaturnusGo?",
        answer:
          "Yes. The Events module includes discovery, purchase, success screens, and QR code generation. Real APIs are being connected as partners finalize integration.",
      },
      {
        question: "Where are my tickets stored?",
        answer:
          "In your account → Events & Tickets. Each ticket has a QR and status. You’ll also receive push updates if anything changes.",
      },
    ],
  },
  {
    title: "Safety, Support & Privacy",
    items: [
      {
        question: "How do you handle safety?",
        answer:
          "We prioritize verified drivers & partners, clear receipts, SOS flows, and transparency. Family Safety features and controls are being expanded.",
      },
      {
        question: "I see negative reviews elsewhere—does the app crash by default?",
        answer:
          "No. Crashes or unexpected redirects are not reproducible under default conditions. Issues usually stem from specific accounts, partners, or migrations. Share affected users/companies and timestamps—we’ll investigate.",
      },
      {
        question: "How can I contact support?",
        answer:
          "Use the in-app Support screen or write to us via the contact links on the website. Provide trip/booking IDs or timestamps for faster resolution.",
      },
      {
        question: "How is my data handled?",
        answer:
          "We follow strict privacy practices and collect only what’s needed to deliver the service (rides, bookings, payments). See our Privacy Policy for details.",
      },
    ],
  },
  {
    title: "Partners & Developers",
    items: [
      {
        question: "How can my business partner with SaturnusGo?",
        answer:
          "Apply via the Partners section. We offer onboarding, technical integration (booking systems, payments), and in-app exposure with performance analytics.",
      },
      {
        question: "Do you provide an API?",
        answer:
          "We integrate with hotel suppliers, maps, and payments. Public APIs for partners are in development—contact us with your use case.",
      },
    ],
  },
];

/* Page */
export default function FaqSaturnusGo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const tone = mounted && resolvedTheme === "light" ? "light" : "dark";

  const flatCount = useMemo(
    () => FAQ_SECTIONS.reduce((acc, s) => acc + s.items.length, 0),
    []
  );

  const heroRef = useRef<HTMLElement>(null);
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
          el.style.opacity = `${Math.max(1 - p * 0.22, 0.8)}`;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="faq-program" data-tone={tone}>
      <BackgroundEffects />

      {/* Hero — EXACT header style from Reach page (centered) */}
      <header ref={heroRef} className="hero-section">
      <div className="hero-content">
  <h1 className="hero-title">
    Frequently Asked Questions
    <span className="hero-accent"> — SaturnusGo</span>
  </h1>
  <p className="hero-sub">
    Everything about rides, hotels, wallet, subscriptions, wishlists, AI planner, events, and more —
    in one place. Styled to match our Partners screen.
  </p>
</div>

      </header>

      {/* FAQ Sections */}
      <main className="faq-wrap" data-count={flatCount}>
        {FAQ_SECTIONS.map((section, si) => {
          const base = FAQ_SECTIONS.slice(0, si).reduce((a, s) => a + s.items.length, 0);
          return (
            <section key={section.title} className="faq-section">
              <div className="section-head">
                <h2 className="section-title">{section.title}</h2>
                <div className="section-line" />
              </div>
              <div className="faq-list">
                {section.items.map((qa, i) => (
                  <FAQItem key={qa.question} qa={qa} index={base + i} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4 }}
          className="contact-cta"
        >
          <div className="cta-icon">
            <Mail size={18} />
          </div>
          <div className="cta-text">
            <p className="cta-title">Still have questions?</p>
            <p className="cta-sub">We’re here to help — reach out and we’ll get back to you.</p>
          </div>
          <Link href="/support" className="cta-button">
            Contact Support
          </Link>
        </motion.div>
      </main>

      {/* Styles */}
      <style jsx global>{`
        /* TOKENS — DARK */
        .faq-program {
          --bg-0: #0a0b0d;
          --bg-1: #0f1115;
          --grid: rgba(255, 255, 255, 0.035);

          --txt: #e7e9ee;
          --txt-2: #c2c6cf;
          --txt-3: #9aa0a6;

          --white-02: rgba(255, 255, 255, 0.02);
          --white-06: rgba(255, 255, 255, 0.06);
          --white-08: rgba(255, 255, 255, 0.08);
          --white-12: rgba(255, 255, 255, 0.12);

          --primary: #646cff;
          --primary-hover: #5a63f0;

          --radius-md: 14px;
          --radius-lg: 20px;
          --radius-xl: 28px;

          --shadow-1: 0 10px 30px rgba(0, 0, 0, 0.28), 0 1px 0 rgba(255, 255, 255, 0.02) inset;
          --shadow-2: 0 24px 60px -20px rgba(0, 0, 0, 0.5);

          position: relative;
          width: 100%;
          min-height: 100vh;
          background:
            radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.08), transparent),
            linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 50%, var(--bg-0) 100%);
          color: var(--txt);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, system-ui, sans-serif;
        }

        /* TOKENS — LIGHT */
        .faq-program[data-tone="light"],
        :global(html.light) .faq-program {
          --bg-0: #f6f8fb;
          --bg-1: #ffffff;
          --grid: rgba(2, 6, 23, 0.06);

          --txt: #0f172a;
          --txt-2: #475569;
          --txt-3: #64748b;

          --white-02: rgba(2, 6, 23, 0.02);
          --white-06: rgba(2, 6, 23, 0.06);
          --white-08: rgba(2, 6, 23, 0.08);
          --white-12: rgba(2, 6, 23, 0.12);

          --shadow-1: 0 10px 30px rgba(2, 6, 23, 0.08), 0 1px 0 rgba(255, 255, 255, 1) inset;
          --shadow-2: 0 24px 60px -20px rgba(2, 6, 23, 0.18);

          background:
            radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.09), transparent),
            linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 50%, var(--bg-0) 100%);
          color: var(--txt);
        }

        /* THEME TOGGLE */
        .theme-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--white-08);
          border: 1px solid var(--white-12);
          border-radius: 999px;
          cursor: pointer;
          color: var(--txt);
          font-weight: 700;
          box-shadow: var(--shadow-1);
        }
        .theme-toggle:hover { background: var(--white-12); }

        /* HERO — EXACTLY as “Reach New Travelers” */
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
          max-width: 120px;
          height: auto;
          margin: 0 auto 24px;
          display: block;
          filter: drop-shadow(0 10px 20px rgba(0,0,0,.35));
        }
        .faq-program[data-tone='light'] .hero-logo-img,
        :global(html.light) .faq-program .hero-logo-img {
          filter: drop-shadow(0 8px 16px rgba(2,6,23,.12));
        }
        .hero-title {
          font-size: clamp(44px, 7vw, 84px);
          font-weight: 850;
          letter-spacing: -0.02em;
          line-height: 1.06;
          margin: 0 0 16px;
          background: linear-gradient(to right, var(--txt), var(--txt-2));
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
          margin: 0 auto 0;
        }

        /* FAQ sections */
        .faq-wrap {
          max-width: 1100px;
          margin: clamp(10px, 1.5svh, 16px) auto clamp(60px, 10svh, 80px);
          padding: 0 20px;
        }
        .faq-section { padding: clamp(28px, 4svh, 40px) 0; }
        .section-head { margin-bottom: 18px; }
        .section-title {
          font-size: clamp(22px, 3.6vw, 30px);
          font-weight: 900;
          letter-spacing: -0.01em;
          margin: 0 0 10px;
          background: linear-gradient(to right, var(--txt), var(--txt-2));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .section-line { height: 1px; width: 100%; background: var(--white-12); }

        .faq-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        .faq-item {
          border: 1px solid var(--white-12);
          border-radius: var(--radius-lg);
          background: var(--white-02);
          transition: background .2s ease, border-color .2s ease, box-shadow .2s ease;
        }
        .faq-item:hover { background: var(--white-06); }
        .faq-item.open { box-shadow: var(--shadow-1); }

        .faq-q {
          width: 100%;
          padding: 18px 18px;
          background: none;
          border: none;
          color: var(--txt);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 17px;
          font-weight: 800;
          text-align: left;
          cursor: pointer;
        }
        .faq-icon { display: inline-flex; padding: 4px; border-radius: 999px; color: var(--txt-3); }

        .faq-a-wrap { overflow: hidden; border-top: 1px solid var(--white-12); }
        .faq-a { padding: 14px 18px 18px; color: var(--txt-2); font-size: 15px; line-height: 1.7; margin: 0; }

        /* Contact CTA */
        .contact-cta {
          position: relative;
          z-index: 1;
          margin: clamp(34px, 6svh, 56px) auto 0;
          padding: 18px;
          max-width: 900px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 14px;
          align-items: center;
          background: var(--white-08);
          border: 1px solid var(--white-12);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-1);
        }
        .cta-icon {
          width: 40px; height: 40px;
          display: inline-flex; align-items: center; justify-content: center;
          border-radius: 12px; background: var(--primary); color: #fff;
        }
        .cta-text { min-width: 0; }
        .cta-title { margin: 0 0 2px; font-weight: 900; color: var(--txt); letter-spacing: .01em; }
        .cta-sub { margin: 0; color: var(--txt-2); font-size: 14px; }
        .cta-button {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 12px 16px; border-radius: 14px; background: var(--primary);
          color: white; font-weight: 800; text-decoration: none; white-space: nowrap;
          position: relative; z-index: 2; pointer-events: auto; touch-action: manipulation; -webkit-tap-highlight-color: transparent; min-height: 44px; cursor: pointer;
        }
        .cta-button:hover { background: var(--primary-hover); }

        /* Responsive */
        @media (max-width: 860px) {
          .contact-cta { grid-template-columns: 1fr; text-align: center; }
          .cta-button { width: 100%; }
          .faq-q { font-size: 16px; }
          .faq-a { font-size: 14.5px; }
        }
      `}</style>
    </div>
  );
}
