"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

const partnerLogos = [
  {
    name: "Marriott",
    logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Marriott_logo_PNG1.png",
  },
  {
    name: "Hyatt",
    logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Hyatt_logo_PNG2.png",
  },
  {
    name: "Ritz-Carlton",
    logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Ritz-Carlton-Logo_PNG2.png",
  },
  {
    name: "Courtyard",
    logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Courtyard_logo_PNG2.png",
  },
  {
    name: "Accor",
    logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Accor_logo_PNG3.png",
  },
];

const partnershipTracks = [
  {
    index: "01",
    title: "Hotels and stays",
    text: "Connect properties, guest context, arrival rides, reservations, and local recommendations inside one city flow.",
    href: "/partners/benefits/platform",
  },
  {
    index: "02",
    title: "Restaurants and cafés",
    text: "Turn discovery into movement: places, pickup points, booking intent, delivery scenarios, and return trips.",
    href: "/partners/benefits/reach",
  },
  {
    index: "03",
    title: "Events and experiences",
    text: "Attach transport, tickets, route planning, and nearby city context to the moment when demand is already active.",
    href: "/partners/benefits/trusted",
  },
];

const processSteps = [
  {
    index: "01",
    title: "Apply",
    text: "Send the business profile, category, location, and the integration direction that matters most.",
  },
  {
    index: "02",
    title: "Align",
    text: "We review the fit, define the partner scenario, and agree on the first practical launch surface.",
  },
  {
    index: "03",
    title: "Launch",
    text: "The partner flow goes live with clear routing, visibility, and user actions inside SaturnusGo.",
  },
];

const faqs = [
  {
    question: "Who is the partner program for?",
    answer:
      "Hotels, restaurants, cafés, event venues, experience providers, and local service operators that can improve a city journey for SaturnusGo users.",
  },
  {
    question: "What can be integrated first?",
    answer:
      "The first step can be simple: listing, booking intent, a direct contact route, arrival transport, delivery context, or a curated place surface.",
  },
  {
    question: "Does every partner need a technical integration?",
    answer:
      "No. Some partners start with a lightweight listing and operational workflow. Deeper integrations can be added when the scenario is validated.",
  },
  {
    question: "How fast do you respond?",
    answer:
      "The application page is designed for a quick first review. A clear business profile and location details make the next step faster.",
  },
];

function FAQItem({ faq }: { faq: (typeof faqs)[number] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="partnerFaqItem">
      <button
        className="partnerFaqQuestion"
        type="button"
        onClick={() => setIsOpen((value) => !value)}
      >
        <span>{faq.question}</span>
        {isOpen ? (
          <ChevronUp aria-hidden="true" />
        ) : (
          <ChevronDown aria-hidden="true" />
        )}
      </button>
      {isOpen && <p className="partnerFaqAnswer">{faq.answer}</p>}
    </div>
  );
}

export default function PartnerProgramPage() {
  const router = useRouter();
  const logos = useMemo(() => [...partnerLogos, ...partnerLogos], []);

  useEffect(() => {
    const updateScroll = () => {
      const progress = Math.min(window.scrollY / 560, 1);
      document.documentElement.style.setProperty(
        "--partners-scroll",
        progress.toFixed(3),
      );
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScroll);
      document.documentElement.style.removeProperty("--partners-scroll");
    };
  }, []);

  return (
    <main className="partnerProgramPage">
      <section className="partnerHero" aria-labelledby="partners-title">
        <div className="partnerHeroGrid" />
        <div className="partnerHeroInner">
          <p className="partnerEyebrow">SaturnusGo / Partners</p>
          <h1 id="partners-title" className="partnerHeroTitle">
            Partner layer for city movement.
          </h1>
          <p className="partnerHeroText">
            SaturnusGo connects rides, delivery, places, and local demand. The
            partner program gives hotels, restaurants, venues, and city
            operators a clean way to enter that flow.
          </p>
          <div className="partnerHeroActions">
            <button
              className="partnerPrimaryButton"
              type="button"
              onClick={() => router.push("/partners/apply")}
            >
              Apply to partner
              <ArrowRight aria-hidden="true" />
            </button>
            <button
              className="partnerSecondaryButton"
              type="button"
              onClick={() => router.push("/partners/listing")}
            >
              View partners
            </button>
          </div>
        </div>
      </section>

      <section className="partnerTicker" aria-label="Partner examples">
        <p className="partnerTickerLabel">Partner display preview</p>
        <div className="partnerLogoMarquee" aria-hidden="true">
          <div className="partnerLogoTrack">
            {logos.map((partner, index) => (
              <img
                key={`${partner.name}-${index}`}
                src={partner.logo}
                alt=""
                loading="lazy"
              />
            ))}
          </div>
        </div>
        <p className="partnerTickerNote">
          Brand examples are used only to show how partner visibility can look
          in the product.
        </p>
      </section>

      <section
        className="partnerEditorialSection"
        aria-labelledby="partner-tracks-title"
      >
        <div className="partnerSectionIntro">
          <p className="partnerEyebrow">Partnership tracks</p>
          <h2 id="partner-tracks-title">Where partners fit into SaturnusGo.</h2>
        </div>
        <div className="partnerTextRows">
          {partnershipTracks.map((track) => (
            <Link
              key={track.index}
              className="partnerTextRow"
              href={track.href}
            >
              <span className="partnerRowIndex">{track.index}</span>
              <span className="partnerRowTitle">{track.title}</span>
              <span className="partnerRowText">{track.text}</span>
            </Link>
          ))}
        </div>
      </section>

      <section
        className="partnerEditorialSection"
        aria-labelledby="partner-process-title"
      >
        <div className="partnerSectionIntro">
          <p className="partnerEyebrow">Process</p>
          <h2 id="partner-process-title">
            Simple enough to start, structured enough to scale.
          </h2>
        </div>
        <div className="partnerTextRows partnerProcessRows">
          {processSteps.map((step) => (
            <div key={step.index} className="partnerTextRow">
              <span className="partnerRowIndex">{step.index}</span>
              <span className="partnerRowTitle">{step.title}</span>
              <span className="partnerRowText">{step.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="partnerCtaBand" aria-labelledby="partner-cta-title">
        <p className="partnerEyebrow">Next step</p>
        <h2 id="partner-cta-title">Send the partner profile.</h2>
        <p>
          The form asks only for the information needed to understand the
          business type, location, contact person, and first integration
          direction.
        </p>
        <button
          className="partnerPrimaryButton"
          type="button"
          onClick={() => router.push("/partners/apply")}
        >
          Open application
          <ArrowRight aria-hidden="true" />
        </button>
      </section>

      <section
        className="partnerEditorialSection partnerFaqSection"
        aria-labelledby="partner-faq-title"
      >
        <div className="partnerSectionIntro">
          <p className="partnerEyebrow">FAQ</p>
          <h2 id="partner-faq-title">Common questions.</h2>
        </div>
        <div className="partnerFaqList">
          {faqs.map((faq) => (
            <FAQItem key={faq.question} faq={faq} />
          ))}
        </div>
      </section>

      <style jsx global>{`
        .partnerProgramPage {
          --partners-scroll: 0;
          --partner-bg: #080a0d;
          --partner-bg-soft: #0e1116;
          --partner-text: #f4f0e8;
          --partner-muted: rgba(244, 240, 232, 0.66);
          --partner-faint: rgba(244, 240, 232, 0.42);
          --partner-line: rgba(244, 240, 232, 0.12);
          --partner-line-soft: rgba(244, 240, 232, 0.07);
          --partner-surface: rgba(244, 240, 232, 0.055);
          --partner-surface-strong: rgba(244, 240, 232, 0.1);
          --partner-radius: 28px;
          margin-top: calc(var(--app-header-h, 96px) * -1);
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 52% -18%,
              rgba(244, 240, 232, 0.09),
              transparent 34rem
            ),
            linear-gradient(
              135deg,
              var(--partner-bg),
              var(--partner-bg-soft) 46%,
              var(--partner-bg)
            );
          color: var(--partner-text);
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .partnerHero {
          position: relative;
          min-height: 100svh;
          display: flex;
          align-items: center;
          padding: clamp(120px, 16svh, 188px) clamp(22px, 6vw, 88px)
            clamp(70px, 10svh, 120px);
        }

        .partnerHeroGrid {
          position: absolute;
          inset: 0;
          opacity: calc(0.18 - var(--partners-scroll, 0) * 0.1);
          background-image:
            linear-gradient(rgba(244, 240, 232, 0.035) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(244, 240, 232, 0.035) 1px,
              transparent 1px
            );
          background-size: 72px 72px;
          transform: translate3d(0, calc(var(--partners-scroll, 0) * -24px), 0);
        }

        .partnerHeroInner {
          position: relative;
          z-index: 1;
          max-width: 1120px;
        }

        .partnerEyebrow {
          margin: 0 0 24px;
          color: var(--partner-faint);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.34em;
          line-height: 1.4;
          text-transform: uppercase;
        }

        .partnerHeroTitle {
          max-width: 980px;
          margin: 0;
          color: var(--partner-text);
          font-size: clamp(72px, 12vw, 164px);
          font-weight: 900;
          letter-spacing: -0.085em;
          line-height: 0.84;
          transform: translate3d(0, calc(var(--partners-scroll, 0) * -16px), 0);
        }

        .partnerHeroText {
          max-width: 690px;
          margin: clamp(30px, 4vw, 52px) 0 0;
          color: var(--partner-muted);
          font-size: clamp(18px, 1.7vw, 23px);
          line-height: 1.58;
        }

        .partnerHeroActions,
        .partnerCtaBand .partnerPrimaryButton {
          margin-top: 34px;
        }

        .partnerHeroActions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .partnerPrimaryButton,
        .partnerSecondaryButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 54px;
          padding: 0 23px;
          border-radius: 999px;
          border: 1px solid transparent;
          font-size: 13px;
          font-weight: 850;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition:
            transform 180ms ease,
            background 180ms ease,
            border-color 180ms ease,
            color 180ms ease;
        }

        .partnerPrimaryButton {
          background: var(--partner-text);
          color: #080a0d;
        }

        .partnerSecondaryButton {
          background: transparent;
          color: var(--partner-text);
          border-color: var(--partner-line);
        }

        .partnerPrimaryButton:hover,
        .partnerSecondaryButton:hover {
          transform: translateY(-2px);
        }

        .partnerPrimaryButton svg,
        .partnerSecondaryButton svg {
          width: 16px;
          height: 16px;
        }

        .partnerTicker {
          padding: 34px 0 52px;
          border-top: 1px solid var(--partner-line-soft);
          border-bottom: 1px solid var(--partner-line-soft);
        }

        .partnerTickerLabel,
        .partnerTickerNote {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 clamp(22px, 6vw, 88px);
          color: var(--partner-faint);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .partnerTickerNote {
          margin-top: 20px;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: none;
        }

        .partnerLogoMarquee {
          width: 100%;
          margin-top: 26px;
          overflow: hidden;
          mask-image: linear-gradient(
            90deg,
            transparent,
            #000 12%,
            #000 88%,
            transparent
          );
        }

        .partnerLogoTrack {
          display: flex;
          width: max-content;
          align-items: center;
          gap: clamp(48px, 7vw, 116px);
          animation: partnerLogoRail 34s linear infinite;
        }

        .partnerLogoTrack img {
          display: block;
          width: clamp(92px, 12vw, 154px);
          max-height: 58px;
          object-fit: contain;
          filter: grayscale(1) brightness(1.7) contrast(0.8);
          opacity: 0.52;
        }

        @keyframes partnerLogoRail {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        .partnerEditorialSection {
          max-width: 1180px;
          margin: 0 auto;
          padding: clamp(84px, 10vw, 136px) clamp(22px, 6vw, 88px);
        }

        .partnerSectionIntro {
          display: grid;
          grid-template-columns: minmax(160px, 0.48fr) minmax(0, 1fr);
          gap: clamp(22px, 5vw, 72px);
          align-items: end;
          margin-bottom: clamp(36px, 5vw, 72px);
        }

        .partnerSectionIntro h2,
        .partnerCtaBand h2 {
          margin: 0;
          max-width: 850px;
          color: var(--partner-text);
          font-size: clamp(44px, 7vw, 94px);
          font-weight: 900;
          letter-spacing: -0.07em;
          line-height: 0.94;
        }

        .partnerTextRows {
          border-top: 1px solid var(--partner-line);
        }

        .partnerTextRow {
          display: grid;
          grid-template-columns: 72px minmax(180px, 0.42fr) minmax(0, 1fr);
          gap: clamp(20px, 4vw, 64px);
          align-items: baseline;
          padding: clamp(24px, 4vw, 42px) 0;
          border-bottom: 1px solid var(--partner-line);
          color: inherit;
          text-decoration: none;
        }

        .partnerTextRow:hover .partnerRowTitle {
          color: var(--partner-text);
        }

        .partnerRowIndex {
          color: var(--partner-faint);
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.18em;
        }

        .partnerRowTitle {
          color: rgba(244, 240, 232, 0.78);
          font-size: clamp(24px, 3vw, 42px);
          font-weight: 880;
          letter-spacing: -0.04em;
          line-height: 1;
          transition: color 180ms ease;
        }

        .partnerRowText {
          color: var(--partner-muted);
          font-size: clamp(16px, 1.35vw, 19px);
          line-height: 1.62;
        }

        .partnerCtaBand {
          max-width: 1180px;
          margin: 0 auto clamp(40px, 8vw, 90px);
          padding: clamp(56px, 7vw, 90px) clamp(22px, 6vw, 88px);
          border-top: 1px solid var(--partner-line);
          border-bottom: 1px solid var(--partner-line);
        }

        .partnerCtaBand p:not(.partnerEyebrow) {
          max-width: 650px;
          margin: 28px 0 0;
          color: var(--partner-muted);
          font-size: clamp(17px, 1.5vw, 21px);
          line-height: 1.65;
        }

        .partnerFaqSection {
          padding-top: clamp(60px, 7vw, 96px);
        }

        .partnerFaqList {
          border-top: 1px solid var(--partner-line);
        }

        .partnerFaqItem {
          border-bottom: 1px solid var(--partner-line);
        }

        .partnerFaqQuestion {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 25px 0;
          border: 0;
          background: transparent;
          color: var(--partner-text);
          font: inherit;
          font-size: clamp(18px, 1.6vw, 24px);
          font-weight: 820;
          letter-spacing: -0.03em;
          text-align: left;
          cursor: pointer;
        }

        .partnerFaqQuestion svg {
          width: 20px;
          height: 20px;
          color: var(--partner-faint);
          flex: 0 0 auto;
        }

        .partnerFaqAnswer {
          max-width: 720px;
          margin: -4px 0 26px;
          color: var(--partner-muted);
          font-size: 16px;
          line-height: 1.7;
        }

        @media (max-width: 860px) {
          .partnerHero {
            min-height: auto;
            padding-top: 116px;
          }

          .partnerHeroTitle {
            font-size: clamp(58px, 17vw, 108px);
          }

          .partnerSectionIntro,
          .partnerTextRow {
            grid-template-columns: 1fr;
          }

          .partnerTextRow {
            gap: 12px;
          }

          .partnerHeroActions {
            width: 100%;
          }

          .partnerPrimaryButton,
          .partnerSecondaryButton {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .partnerLogoTrack {
            animation: none;
          }

          .partnerHeroTitle,
          .partnerHeroGrid {
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}
