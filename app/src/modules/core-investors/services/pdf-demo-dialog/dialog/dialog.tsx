"use client";

// components/cta/PdfDemoDialog.tsx
'use client';

import { useEffect } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  remember?: boolean;
  onToggleRemember?: (v: boolean) => void;
};

export default function PdfDemoDialog({ open, onClose, onConfirm }: Props) {
  if (!open) return null;

  useEffect(() => {
    const t = window.setTimeout(() => {
      try { onConfirm?.(); } finally { onClose?.(); }
    }, 1000);
    return () => window.clearTimeout(t);
  }, [onConfirm, onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Opening deck" className="deckdlg" data-test="pdf-loader-overlay">
      <div className="deckdlg__center" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true">
          <div className="spinner__ring" />
          <div className="spinner__orb" />
          <div className="spinner__core" />
        </div>
        <span className="sr-only">Opening…</span>
      </div>

      <style jsx>{`
        .deckdlg{
          position: fixed; inset: 0; display:grid; place-items:center; z-index: 70;
          background: color-mix(in oklab, var(--bg, #0D0E11), transparent 24%);
          backdrop-filter: blur(10px) saturate(125%);
          animation: deckFade .18s ease-out both;
          pointer-events: auto;
        }
        @keyframes deckFade{ from{ opacity:0 } to{ opacity:1 } }

        .deckdlg__center{ display:grid; place-items:center; gap: 0.5rem; }

        .spinner{
          position: relative; width: 116px; height: 116px; filter: drop-shadow(0 14px 28px rgba(0,0,0,.35));
        }
        .spinner__ring{
          position:absolute; inset:0; border-radius:50%;
          background: conic-gradient(from 0turn,#6aa7ff 0%,#6aa7ff 20%,#b07aff 45%,#7ed1ff 60%,#6aa7ff 100%);
          -webkit-mask: radial-gradient(farthest-side, transparent calc(50% - 9px), #000 calc(50% - 8px));
                  mask: radial-gradient(farthest-side, transparent calc(50% - 9px), #000 calc(50% - 8px));
          animation: spin 1.05s linear infinite;
          box-shadow: 0 0 1px rgba(255,255,255,.3) inset;
        }
        .spinner__ring::after{
          content:""; position:absolute; inset:0; border-radius:50%;
          background: conic-gradient(from 0turn, rgba(255,255,255,0) 0%, rgba(255,255,255,.85) 12%, rgba(255,255,255,0) 22%);
          -webkit-mask: radial-gradient(farthest-side, transparent calc(50% - 9px), #000 calc(50% - 8px));
                  mask: radial-gradient(farthest-side, transparent calc(50% - 9px), #000 calc(50% - 8px));
          filter: blur(1.5px);
          animation: spin 1.05s linear infinite;
          opacity: .9;
        }
        .spinner__orb{
          position:absolute; inset:0; border-radius:50%;
          animation: spin 1.05s linear infinite;
        }
        .spinner__orb::before{
          content:""; position:absolute; left:50%; top:50%;
          width: 12px; height: 12px; border-radius:50%;
          background: #fff;
          transform: translate(-50%, -50%) translateY(-51px);
          box-shadow: 0 0 0 3px rgba(138,177,255,.20), 0 0 14px rgba(138,177,255,.65);
        }
        .spinner__core{
          position:absolute; inset: 26px; border-radius:50%;
          background:
            radial-gradient(40% 40% at 30% 30%, rgba(255,255,255,.35) 0%, rgba(255,255,255,.08) 100%),
            color-mix(in oklab, var(--bg2, #15171C), white 3%);
          border: 1px solid color-mix(in oklab, var(--border, #2B2D34), white 18%);
          box-shadow:
            inset 0 10px 28px rgba(255,255,255,.05),
            inset 0 -6px 18px rgba(0,0,0,.35),
            0 10px 30px rgba(0,0,0,.25);
          backdrop-filter: blur(6px) saturate(125%);
        }

        @keyframes spin { to { transform: rotate(1turn); } }

        @media (prefers-reduced-motion: reduce){
          .spinner__ring, .spinner__ring::after, .spinner__orb{ animation: none; }
          .spinner{ animation: pulse .9s ease-in-out infinite alternate; }
          @keyframes pulse { from { transform: scale(.98); opacity:.9 } to{ transform: scale(1); opacity:1 } }
        }

        .sr-only{ position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
      `}</style>
    </div>
  );
}
