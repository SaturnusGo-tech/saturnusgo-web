// app/mobile/MobileScreen.tsx
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';

// ВАЖНО: грузим MobileLottie только на клиенте
const MobileLottie = dynamic(() => import('../../mobile-lottie'), { ssr: false });

export default function MobileScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get('from') || '/';

  const [confirmOpen, setConfirmOpen] = useState(false);

  function continueAnyway() {
    try { localStorage.setItem('allowMobile', '1'); } catch {}
    router.replace(from);
  }

  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmOpen(false);
      if (e.key === 'Enter') continueAnyway();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmOpen]);

  return (
    <main className="mbl-wrap" aria-labelledby="mbl-title">
      <div className="mbl-bg" aria-hidden />

      {/* Lottie — теперь точно только на клиенте */}
      <MobileLottie />

      <p className="mbl-kicker">Optimized for desktop</p>
      <h1 id="mbl-title" className="mbl-title">Best viewed on desktop</h1>
      <p className="mbl-sub">This build is designed for wide screens.</p>

      <div className="mbl-cta">
        <button
          className="mbl-btn"
          onClick={() => setConfirmOpen(true)}
          aria-haspopup="dialog"
          aria-controls="confirm-mobile"
        >
          Continue anyway
        </button>
      </div>

      <p className="mbl-tagline" aria-live="polite">
        You can still explore, but some layouts may look broken on mobile.
      </p>

      {confirmOpen && (
        <div
          id="confirm-mobile"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          className="confirm"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmOpen(false); }}
        >
          <div className="confirm__panel">
            <h2 id="confirm-title" className="confirm__title">View on mobile?</h2>
            <p className="confirm__sub">
              The layout is optimized for desktop. You can continue, but some sections may render poorly.
            </p>
            <div className="confirm__actions">
              <button className="confirm__yes" onClick={continueAnyway}>Continue anyway</button>
              <button className="confirm__no" onClick={() => setConfirmOpen(false)}>No thanks</button>
            </div>
          </div>
        </div>
      )}

<style jsx>{`
        .mbl-wrap{
          min-height:100dvh;
          display:grid;
          grid-template-rows: auto auto auto auto auto 1fr;
          justify-items:center;
          align-content:start;
          text-align:center;
          padding: max(24px, env(safe-area-inset-top)) 20px 24px;
          position:relative;
          overflow:hidden;
        }
        .mbl-bg{
          position:fixed; inset:0; pointer-events:none; z-index:-1;
          background:
            radial-gradient(1200px 600px at 40% 10%, #2E2E2E33 0%, transparent 60%),
            radial-gradient(900px 420px at 10% 80%, #2E2E2E33 0%, transparent 65%),
            radial-gradient(700px 360px at 90% 30%, rgba(74,123,217,.22) 0%, transparent 70%),
            var(--bg, #111214);
        }
        .mbl-anim{
          width: clamp(220px, 48vw, 340px);
          height: clamp(220px, 48vw, 340px);
          margin-top: clamp(8px, 3.5vh, 22px);
          margin-bottom: 10px;
          filter: drop-shadow(0 22px 46px rgba(0,0,0,.35));
          position: relative;
        }
        .mbl-anim::after{
          content:'';
          position:absolute; inset:-10% -18% -26% -18%;
          background:
            radial-gradient(60% 40% at 50% 10%, rgba(255,255,255,.10), transparent 60%),
            radial-gradient(55% 40% at 50% 70%, rgba(74,123,217,.18), transparent 70%);
          filter: blur(18px) saturate(120%);
          z-index:-1;
          animation: mblGlow 6s ease-in-out infinite alternate;
        }
        @keyframes mblGlow{
          from{ transform: translateY(0) scale(1) }
          to{   transform: translateY(6px) scale(1.02) }
        }

        .mbl-kicker{
          text-transform:uppercase;
          letter-spacing:.12em;
          font-size:12px;
          color:var(--text-3, #70707A);
          margin: 6px 0;
        }
        .mbl-title{
          margin: 6px 0 8px;
          font-size: clamp(26px, 7.5vw, 44px);
          line-height:1.12;
          letter-spacing:-0.01em;
          text-wrap: balance;
          text-shadow: 0 1px 0 rgba(0,0,0,.25);
        }
        .mbl-sub{
          color: var(--text-2, #A9A9B1);
          font-size: clamp(14px, 4.2vw, 18px);
          margin: 0 0 16px;
        }

        .mbl-cta{ display:flex; gap:12px; align-items:center; justify-content:center; width:100%; }
        .mbl-btn{
          -webkit-tap-highlight-color: transparent;
          appearance:none; border:none; cursor:pointer;
          height: 46px; padding: 0 18px; border-radius: 999px;
          font-weight: 800; letter-spacing: .02em; color:#fff;
          background: linear-gradient(180deg, #5f8ef1, #3b6bdb);
          box-shadow: 0 10px 24px rgba(74,123,217,.28), inset 0 1px 0 rgba(255,255,255,.12);
          transition: transform .12s ease, filter .18s ease, box-shadow .18s ease;
        }
        .mbl-btn:active{ transform: translateY(1px) }
        .mbl-btn:focus-visible{
          outline:none;
          box-shadow:
            0 0 0 3px rgba(122,168,255,.30),
            0 10px 24px rgba(74,123,217,.28),
            inset 0 1px 0 rgba(255,255,255,.12);
        }
        @media (min-width: 980px){ .mbl-btn{ display:none; } }

        .mbl-tagline{
          margin: 10px 0 0;
          font-size: 13px;
          color: color-mix(in oklab, var(--text-2, #A9A9B1), white 6%);
          max-width: 520px;
        }

        /* ===== Confirm dialog ===== */
        .confirm{
          position: fixed; inset: 0; display:grid; place-items:center; z-index: 50;
          background: color-mix(in oklab, var(--bg, #111214), transparent 32%);
          backdrop-filter: blur(8px) saturate(115%);
          animation: fadeIn .18s ease-out both;
        }
        @keyframes fadeIn{ from{ opacity:0 } to{ opacity:1 } }

        .confirm__panel{
          width: min(94vw, 560px);
          margin: 0 18px;
          border-radius: 24px;
          padding: 22px 18px;
          background: var(--bg2, #1A1B1F);
          border: 1px solid var(--border, #31323A);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.06) inset,
            0 20px 54px rgba(0,0,0,0.38);
          animation: slideUp .2s cubic-bezier(.2,.8,.2,1) both;
        }
        @keyframes slideUp{ from{ transform: translateY(6px); opacity:0 } to{ transform:none; opacity:1 } }

        .confirm__title{
          margin: 2px 0 6px;
          font-size: clamp(18px, 5.4vw, 22px);
          font-weight: 800;
          letter-spacing: -0.01em;
        }
        .confirm__sub{
          margin: 0 0 14px;
          font-size: 14.5px;
          color: var(--text-2, #A9A9B1);
          text-wrap: pretty;
        }
        .confirm__actions{
          display:flex; gap:10px; justify-content:center; flex-wrap:wrap;
        }

        /* Primary (accent gradient) */
        .confirm__yes{
          all: unset; cursor: pointer;
          height: 44px; padding: 0 18px; border-radius: 999px;
          font-weight: 800; letter-spacing: .01em; color: #fff;
          background: linear-gradient(180deg, #5f8ef1, #3b6bdb);
          box-shadow: 0 10px 24px rgba(74,123,217,.28), inset 0 1px 0 rgba(255,255,255,.12);
          transition: transform .12s ease, filter .18s ease, box-shadow .18s ease;
        }
        .confirm__yes:active{ transform: translateY(1px); }
        .confirm__yes:focus-visible{
          outline:none;
          box-shadow:
            0 0 0 3px rgba(122,168,255,.30),
            0 10px 24px rgba(74,123,217,.28),
            inset 0 1px 0 rgba(255,255,255,.12);
        }

        /* Secondary (outlined) */
        .confirm__no{
          all: unset; cursor: pointer;
          height: 44px; padding: 0 16px; border-radius: 999px;
          font-weight: 700; color: var(--text, #ECECEC);
          background: transparent;
          border: 1px solid color-mix(in oklab, var(--border, #31323A), white 10%);
          transition: transform .12s ease, background-color .18s ease, border-color .18s ease;
        }
        .confirm__no:hover{
          background: color-mix(in oklab, var(--bg, #111214), white 4%);
          border-color: color-mix(in oklab, var(--border, #31323A), white 18%);
        }
        .confirm__no:active{ transform: translateY(1px); }
        .confirm__no:focus-visible{ outline: 2px solid rgba(122,168,255,.35); outline-offset: 2px; }
      `}</style>
    </main>
  );
}
