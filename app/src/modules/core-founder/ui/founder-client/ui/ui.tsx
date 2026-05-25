// app/founder/FounderClient.tsx
'use client';

import Link from 'next/link';
import useReveal from '../../../../../shared/lib/useReveal';
import Section from '../../../../../shared/components/shared/sections/Section';
import SocialLinks from '../../../../../shared/components/shared/basement/SocialLinks';
import Footer from '../../../../../shared/components/shared/basement/Footer';

export default function FounderClient() {
  useReveal();

  return (
    <div className="founder no-card">
      {/* HERO — чистая типографика, без карточек */}
      <Section
        id="about"
        kicker="About the Founder"
        title="From Buenos Aires streets to a new class of travel superapp"
        subtitle="Why me, why now — and why SaturnusGo isn’t a clone but a new category product."
      >
        <div className="two-col">
          <div className="copy measure">
            <p className="lead">
              I moved to Argentina to start from zero — and ran head-first into a broken experience:
              one app for rides, another for hotels, another for events, another just to save places.
              Payments fail, cards don’t go through, “premium” adds nothing. Five apps for a single evening.
            </p>
            <p className="muted">
              My first instinct was “I’ll build a local taxi app.” But the world doesn’t need another clone.
              The real pain is fragmentation and the absence of trust. People need one continuous flow —
              rides, bookings, places, tickets and wallet working together from the first tap.
            </p>
          </div>

          <ul className="checklist">
            <li>Built SaturnusGo solo for 2+ years.</li>
            <li>12–16 hours a day; hundreds of design/code iterations.</li>
            <li>Pixel-level UX judgement; clear receipts over “wow effects”.</li>
            <li>Financial layer that works across borders and edge cases.</li>
            <li>Production-grade modular architecture (not a demo).</li>
            <li>Obsession with trust, predictability, honest interactions.</li>
          </ul>
        </div>

        {/* Pull-quote (чистый стиль, без плашек) */}
        <figure className="pullquote" role="group" aria-label="Founder quote">
  <blockquote cite="https://saturnusgo.com/founder">
    “Every founder knows the nights when nothing works and the days when no one cares.<br />
    That’s when you either quit — or keep going. SaturnusGo is what happens when you don’t quit.”
  </blockquote>
  <figcaption>— Mercury, Founder of SaturnusGo</figcaption>
</figure>

      </Section>

      {/* STORY — асимметричная сетка без плашек */}
      <Section
        id="story"
        kicker="Founder’s Story"
        title="Clones are easy. Building a coherent ecosystem is hard."
        subtitle="The pivot from “another taxi app” to a new category product."
      >
        <div className="two-col">
          <div className="copy measure">
            <h4>Start and reality</h4>
            <p className="muted">
              I began with a local taxi idea. It became obvious fast: the problem isn’t the “order ride”
              button; it’s the gaps between services. Route → ride → check-in → events → payment → receipts —
              this must be one motion, with no context switching or “will the card fail again?” anxiety.
            </p>
            <h4>Reframing</h4>
            <p className="muted">
              That’s how SaturnusGo emerged as an ecosystem: rides, places & collections, hotels, events,
              wallet, loyalty — in one UX. With a financial backbone that behaves consistently across countries.
            </p>
          </div>

          <div className="copy measure">
            <h4>The founder’s path</h4>
            <p className="muted">
              It was hard — regularly. Days when nothing works, nights when everything breaks. I kept moving:
              rewriting modules until they “clicked”, polishing micro-interactions so the interface feels
              honest and resilient. When depression hit, I treated it like a product problem — reduce chaos,
              regain control, step by step.
            </p>
            <p className="muted">
              That’s how my principles formed: earn trust first, hide complexity inside the system,
              keep the outside simple and predictable.
            </p>
          </div>
        </div>
      </Section>

      {/* WHAT’S BUILT — лёгкая “полоска” фич без карточек */}
      <Section
        id="built"
        kicker="What’s built"
        title="What is actually done"
        subtitle="Not a demo video — a live product stack."
      >
        <ul className="feature-list">
          <li>
            <h4>One continuous user flow</h4>
            <p>Doorstep → ride → bookings → events → wallet — no gaps or payment surprises.</p>
          </li>
          <li>
            <h4>Financial backbone</h4>
            <p>Local rails in LATAM/MENA, transparent receipts, bonuses/subscriptions, tokenized cards.</p>
          </li>
          <li>
            <h4>Trust by default</h4>
            <p>Verified partners & drivers, privacy by default, predictable UX patterns.</p>
          </li>
          <li>
            <h4>Engineering foundation</h4>
            <p>Modular architecture, offline-resilient flows, tight perf & animation budgets.</p>
          </li>
        </ul>
      </Section>

      {/* NOW — две колонки списков */}
      <Section
        id="now"
        kicker="Where we are now"
        title="The ecosystem is almost ready"
        subtitle="What separates SaturnusGo from the world: the driver app and launch resources."
      >
        <div className="two-col">
          <div className="copy">
            <h4>What remains</h4>
            <ul className="bullets clean">
              <li>Finish the production-ready driver app.</li>
              <li>Operational scaffolding to enter the first cities.</li>
              <li>Hire the core team across product, infra and ops.</li>
            </ul>
          </div>
          <div className="copy">
            <h4>What I’m looking for</h4>
            <ul className="bullets clean">
              <li>Partners and investors who share the vision.</li>
              <li>Local synergies: LATAM → UAE → Europe → Rest of the world.</li>
              <li>Resources for the launch and early scale-up.</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* PRINCIPLES — 3 колонки, линейные, без плашек */}
      <Section
        id="principles"
        kicker="Operating principles"
        title="How I make decisions as a founder"
        subtitle="Simple rules I follow every day."
      >
        <div className="three-col">
          <div>
            <h4>Trust → Metric #1</h4>
            <p className="muted">The best UX is the one people trust. Clear receipts beat fireworks.</p>
          </div>
          <div>
            <h4>One motion</h4>
            <p className="muted">Users shouldn’t think in “apps”. One coherent scenario from point A to life.</p>
          </div>
          <div>
            <h4>Complexity inside</h4>
            <p className="muted">Hide complexity in architecture; keep the outside simple and predictable.</p>
          </div>
        </div>
      </Section>

      {/* CONTACT / bottom-only CTA — КНОПКА 1:1 как в TopbarSocialCTA */}
      <Section
        id="contact"
        kicker="Let’s talk"
        title="Ready to bring SaturnusGo to the world"
        subtitle="If this resonates, I’ll show the live build and discuss the launch."
      >
        <div className="follow-wrap">
          <SocialLinks size="lg">
            <Link
              href="/investors"
              className="social__link social__link--cta"
              aria-label="For investors"
              title="For investors"
            >
              <span className="label">For investors</span>
            </Link>
          </SocialLinks>
        </div>
      </Section>

      <Footer/>

      {/* Local, page-scoped styles — чистая типографика + CTA 1:1 */}
      <style jsx global>{`
        .founder.no-card .two-col{
          display:grid; gap:16px;
          grid-template-columns:1.15fr 0.85fr;
        }
        @media (max-width: 980px){
          .founder.no-card .two-col{ grid-template-columns:1fr }
        }

        .founder.no-card .three-col{
          display:grid; gap:16px;
          grid-template-columns: repeat(3, minmax(0,1fr));
        }
        @media (max-width:1080px){
          .founder.no-card .three-col{ grid-template-columns: 1fr 1fr }
        }
        @media (max-width:680px){
          .founder.no-card .three-col{ grid-template-columns: 1fr }
        }

        .founder .measure{ max-width: 72ch }
        .founder .lead{
          font-size: clamp(18px, 0.6vw + 16px, 22px);
          line-height: 1.74;
          color: var(--text);
          letter-spacing: -0.005em;
        }
        .founder .muted{
          color: var(--text-2);
          line-height: 1.72;
          font-size: clamp(15.5px, 0.28vw + 14.5px, 17.5px);
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          font-feature-settings: "liga" 1, "kern" 1;
        }

        .founder .checklist{
          list-style: none; margin:0; padding:0; align-self:start;
          display:grid; gap:10px;
        }
        .founder .checklist li{
          position: relative; padding-left: 22px; color: var(--text-2);
        }
        .founder .checklist li::before{
          content: "✓"; position:absolute; left:0; top:0.1em;
          font-weight:700; line-height:1;
          color: color-mix(in oklab, var(--accent), white 8%);
        }

        .founder .feature-list{
          list-style:none; margin:0; padding:0;
          display:grid; gap:0;
          grid-template-columns: repeat(2, minmax(0,1fr));
        }
        .founder .feature-list li{
          padding:12px 0;
          border-top:1px solid color-mix(in oklab, var(--border), transparent 0%);
        }
        .founder .feature-list li:nth-child(1),
        .founder .feature-list li:nth-child(2){ border-top:none }
        @media (max-width:1080px){
          .founder .feature-list{ grid-template-columns: 1fr }
          .founder .feature-list li:nth-child(2){ border-top:1px solid color-mix(in oklab, var(--border), transparent 0%) }
        }
        .founder .feature-list h4{ margin:2px 0 6px }
        .founder .feature-list p{ margin:0; color:var(--text-2) }

        .founder .pullquote{
          margin: 100px 0 0;
          padding-left: 16px;
          border-left: 3px solid color-mix(in oklab, var(--accent), white 12%);
        }
        .founder .pullquote blockquote{
          margin:0; font-style: italic; color: var(--text);
          font-size: clamp(16.5px, 0.45vw + 15px, 20px);
          line-height: 1.68;
          letter-spacing: -0.005em;
        }
        .founder .pullquote figcaption{
          margin-top: 8px; color: var(--text-3); font-size: 13px;
        }

        .founder .bullets.clean{ color: var(--text-2) }
        .founder .bullets.clean li{ margin:8px 0 }

        /* === CTA: идентично TopbarSocialCTA === */
        :global(.social__link--cta){
          position: relative;
          isolation: isolate;
          white-space: nowrap;
          background:
            linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04)) padding-box,
            linear-gradient(135deg, #6a8bff66, #50e3c266) border-box;
          border: 1px solid transparent;
          background-clip: padding-box, border-box;
          color: rgba(255,255,255,0.98);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.06) inset,
            0 10px 28px rgba(0,0,0,0.24),
            0 0 14px rgba(74,123,217,.18);
          transition:
            transform .14s ease,
            box-shadow .18s ease,
            background .22s ease,
            filter .18s ease;
        }
        :global(.social__link--cta:hover){
          transform: translateY(-1px);
          background:
            linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.06)) padding-box,
            linear-gradient(135deg, #7a97ff88, #67f0d388) border-box;
          box-shadow:
            0 1px 0 rgba(255,255,255,0.08) inset,
            0 12px 32px rgba(0,0,0,0.30),
            0 0 22px rgba(104,170,255,.25);
          filter: brightness(1.02);
        }
        :global(.social__link--cta:active){
          transform: translateY(0);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.06) inset,
            0 8px 22px rgba(0,0,0,0.26),
            0 0 16px rgba(104,170,255,.2);
        }
        :global(.social__link--cta:focus-visible){
          outline: none;
          box-shadow:
            0 0 0 2px rgba(122,168,255,.22),
            0 10px 28px rgba(0,0,0,.28),
            0 0 22px rgba(104,170,255,.28);
        }
        /* На мобиле SocialLinks обычно скрывает label — для CTA оставляем */
        @media (max-width:560px){
          :global(.social .social__link--cta .label){ display:inline }
          :global(.social .social__link--cta){ padding:8px 12px }
        }
      `}</style>
    </div>
  );
}
