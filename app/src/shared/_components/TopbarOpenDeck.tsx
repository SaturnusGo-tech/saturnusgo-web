// app/src/shared/_components/TopbarOpenDeck.tsx
'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';

/** Кнопка-«пилюля» открытия Deck. Стили — те же, что у .social__link--cta */
export default function TopbarOpenDeck() {
  const pathname = (usePathname() || '').toLowerCase();
  const isInvestorsExact = pathname === '/investors';
  if (!isInvestorsExact) return null; // строгий показ только на /investors

  const onClick = useCallback<React.MouseEventHandler<HTMLButtonElement>>((e) => {
    e.preventDefault();
    window.dispatchEvent(new Event('open-deck'));
  }, []);

  return (
    <button
      type="button"
      className="social__link social__link--cta"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label="Open investor deck"
    >
      <span className="label">Open deck</span>

      {/* локальная подстраховка на случай, если глобальные стили .social применены только к <a> */}
      <style jsx>{`
        :global(.social button.social__link){
          display:inline-flex; align-items:center; justify-content:center;
          padding:8px 12px; border-radius:999px;
          background: var(--bg2); border:1px solid var(--border);
          color: var(--text); text-decoration:none; font-size:13px;
          transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
          height:auto; /* совпадает с <a> */
        }
        :global(.social button.social__link:hover){ transform: translateY(-2px); box-shadow:0 10px 20px rgba(0,0,0,.25) }
        @media (max-width:560px){
          :global(.social button.social__link){ padding:8px } /* как у anchor */
        }
      `}</style>
    </button>
  );
}
