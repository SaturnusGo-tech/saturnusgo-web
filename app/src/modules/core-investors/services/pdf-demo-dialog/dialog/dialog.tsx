"use client";

// components/cta/PdfDemoDialog.tsx
'use client';

import { useEffect } from 'react';
import { LoadingOrb } from '../../../../../shared/components/loading/LoadingOrb';

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
        <LoadingOrb size="brand" />
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

        .sr-only{ position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
      `}</style>
    </div>
  );
}
