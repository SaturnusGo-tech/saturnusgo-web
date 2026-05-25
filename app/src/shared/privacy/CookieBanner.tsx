'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

type Consent = 'granted' | 'denied';
type Stored = { v: Consent; ts: number; ttl: number };

const KEY = 'sg_consent_v1';
const TTL_DAYS = 180; // полгода

function now() { return Date.now(); }
function days(n: number) { return n * 24 * 60 * 60 * 1000; }

function readStored(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed || typeof parsed.ts !== 'number' || typeof parsed.ttl !== 'number') return null;
    if (parsed.ts + parsed.ttl < now()) return null; // expired
    return parsed;
  } catch { return null; }
}

function writeStored(v: Consent) {
  try {
    const data: Stored = { v, ts: now(), ttl: days(TTL_DAYS) };
    localStorage.setItem(KEY, JSON.stringify(data));
    // lightweight cookie to help on edge handlers/CDN if надо
    document.cookie = `sg_consent=${v}; Max-Age=${60*60*24*TTL_DAYS}; Path=/; SameSite=Lax`;
  } catch {}
}

function respectDNT(): Consent | null {
  try {
    // 1/'1'/true в разных браузерах
    const dnt = (navigator as any).doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;
    if (dnt === '1' || dnt === 1 || dnt === 'yes') return 'denied';
  } catch {}
  return null;
}

/** SSR-safe tone: 'light' | 'dark' */
function useTone(): 'light'|'dark' {
  const { resolvedTheme } = useTheme();
  const [tone, setTone] = useState<'light'|'dark'>('dark');
  useEffect(() => {
    let t: 'light'|'dark' =
      resolvedTheme === 'light' ? 'light'
      : resolvedTheme === 'dark' ? 'dark'
      : (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    setTone(t);
  }, [resolvedTheme]);
  return tone;
}

export default function CookieBanner() {
  const tone = useTone();
  const [open, setOpen] = useState(false);
  const [mount, setMount] = useState(false);
  const wrapRef = useRef<HTMLDivElement|null>(null);

  // expose API
  useEffect(() => {
    (window as any).SG_CONSENT = (window as any).SG_CONSENT || {};
    (window as any).SG_CONSENT.open = () => setOpen(true);
    (window as any).SG_CONSENT.read = () => readStored()?.v ?? null;
    return () => { /* noop */ };
  }, []);

  // first paint: decide to show
  useEffect(() => {
    setMount(true); // avoid SSR mismatch
    // already stored?
    const stored = readStored();
    if (stored) { setOpen(false); return; }
    // respect DNT: auto-deny silently (можно включить показ, но мы не мешаем)
    const dnt = respectDNT();
    if (dnt) {
      writeStored('denied');
      setOpen(false);
      return;
    }
    // show after tiny delay to avoid layout jank
    const t = setTimeout(() => setOpen(true), 200);
    return () => clearTimeout(t);
  }, []);

  const onChoice = (v: Consent) => {
    writeStored(v);
    setOpen(false);
    // небольшой “сигнал” в окно — если у тебя аналитика слушает
    window.dispatchEvent(new CustomEvent('sg:consent', { detail: { value: v }}));
    // пример отключения GA, если используешь:
    if (v === 'denied') { (window as any)['ga-disable-G-XXXX'] = true; }
  };

  // prevent body scrolling while banner opened on very small screens? — тут не блокируем, баннер не модалка.

  // ARIA: это “region” с ролe="dialog" не нужно; у нас не блокирующее уведомление
  if (!mount) return null;

  return (
    <div ref={wrapRef} className={`cb__root ${open ? 'is-open' : ''}`} data-tone={tone} aria-live="polite">
      <div className="cb__inner" role="region" aria-label="Cookie consent">
        <div className="cb__text">
          <div className="cb__kicker">Cookies & data</div>
          <div className="cb__title">We respect your privacy</div>
          <p className="cb__p">
            We use cookies to personalize, improve, and measure. Choose “Accept” for a better experience or “Decline” to keep only essential cookies.
            <a className="cb__link" href="/partners/privacy" target="_self" rel="noopener"> Learn more</a>.
          </p>
        </div>

        <div className="cb__actions" role="group" aria-label="Cookie choices">
          <button className="cb__btn cb__btn--ghost" onClick={() => onChoice('denied')}>Decline</button>
          <button className="cb__btn cb__btn--primary" onClick={() => onChoice('granted')}>Accept</button>
        </div>
      </div>

      <style jsx>{`
        .cb__root{
          position: fixed; inset: auto 0 0 0; z-index: 1000;
          display: grid; place-items: center;
          pointer-events: none;
        }
        .cb__inner{
          pointer-events: auto;
          width: min(1020px, calc(100% - 24px));
          margin: 12px;
          border-radius: 18px;
          border: 1px solid var(--cb-br, rgba(255,255,255,.14));
          background: var(--cb-bg, rgba(22,22,24,.66));
          backdrop-filter: blur(18px) saturate(160%);
          -webkit-backdrop-filter: blur(18px) saturate(160%);
          box-shadow:
            0 12px 40px rgba(0,0,0,.35),
            0 1px 0 rgba(255,255,255,.06) inset;
          color: var(--cb-fg, rgba(255,255,255,.95));

          display: grid;
          grid-template-columns: 1fr auto;
          gap: 18px;
          padding: 16px 16px 16px 18px;

          transform: translateY(16px);
          opacity: 0;
          transition: transform .45s cubic-bezier(.2,.8,.2,1), opacity .45s ease;
        }
        .cb__root.is-open .cb__inner{ transform: translateY(0); opacity: 1; }

        .cb__text{ display: grid; gap: 6px; align-content: center; }
        .cb__kicker{
          font-size: 12px; letter-spacing: .14em; text-transform: uppercase;
          color: var(--cb-dim, rgba(255,255,255,.70));
        }
        .cb__title{
          font-weight: 700; font-size: 16px; letter-spacing: .1px;
        }
        .cb__p{
          margin: 0; font-size: 14px; line-height: 1.55; color: var(--cb-dim, rgba(255,255,255,.80));
        }
        .cb__link{
          color: var(--cb-link, #8fb3ff);
          text-decoration: none;
          border-bottom: 1px solid color-mix(in oklab, var(--cb-link,#8fb3ff), transparent 60%);
        }
        .cb__link:hover{ filter: brightness(1.05); }

        .cb__actions{
          display: flex; align-items: center; gap: 10px; justify-self: end;
        }
        .cb__btn{
          all: unset;
          display: inline-flex; align-items: center; justify-content: center;
          height: 40px; border-radius: 999px; padding: 0 16px; cursor: pointer;
          font-weight: 700; font-size: 14px; white-space: nowrap;
          transition: transform .08s ease, filter .18s ease, background .18s ease, box-shadow .18s ease, border-color .18s ease, color .18s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .cb__btn:active{ transform: translateY(1px); }
        .cb__btn:focus-visible{
          outline: none;
          box-shadow: 0 0 0 2px rgba(122,168,255,.22);
        }

        .cb__btn--primary{
          color: #0b0b0c;
          background: linear-gradient(180deg, #ffffff, #dfe5ff);
          border: 1px solid rgba(255,255,255,.85);
          box-shadow: 0 10px 24px rgba(0,0,0,.28);
        }
        .cb__btn--primary:hover{ filter: brightness(1.03); }

        .cb__btn--ghost{
          color: var(--cb-fg);
          background: color-mix(in oklab, var(--cb-bg, rgba(22,22,24,.66)), white 6%);
          border: 1px solid var(--cb-br, rgba(255,255,255,.16));
        }
        .cb__btn--ghost:hover{
          background: color-mix(in oklab, var(--cb-bg, rgba(22,22,24,.66)), white 10%);
        }

        /* Light overrides via data-tone or html.light */
        .cb__root[data-tone="light"],
        :global(html.light) .cb__root{
          --cb-bg: rgba(255,255,255,.82);
          --cb-br: rgba(2,6,23,.12);
          --cb-fg: #0f172a;  /* slate-900 */
          --cb-dim: #475569; /* slate-600 */
          --cb-link: #4f46e5; /* indigo-600 */
          box-shadow: none;
        }
        .cb__root[data-tone="light"] .cb__inner,
        :global(html.light) .cb__root .cb__inner{
          box-shadow:
            0 12px 40px rgba(2,6,23,.12),
            0 1px 0 rgba(255,255,255,.65) inset;
        }
        .cb__root[data-tone="light"] .cb__btn--primary{
          background: linear-gradient(180deg, #111827, #111827);
          color: #fff; border-color: rgba(17,24,39,.9);
        }
        .cb__root[data-tone="light"] .cb__btn--ghost{
          background: rgba(255,255,255,.9);
          color: #0f172a; border-color: rgba(2,6,23,.12);
        }

        /* Stack layout on small screens */
        @media (max-width: 700px){
          .cb__inner{ grid-template-columns: 1fr; gap: 12px; padding: 14px; }
          .cb__actions{ justify-self: stretch; }
          .cb__actions .cb__btn{ flex: 1 1 0; }
        }

        @media (prefers-reduced-motion: reduce){
          .cb__inner{ transition: none !important; }
          .cb__btn{ transition: none !important; }
        }
      `}</style>
    </div>
  );
}
