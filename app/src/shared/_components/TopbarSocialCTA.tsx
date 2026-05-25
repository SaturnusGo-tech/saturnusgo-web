'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import SocialLinks from '../components/shared/basement/SocialLinks';

type Size = 'sm' | 'lg';

function useIsMobile(maxWidth = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width:${maxWidth}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, [maxWidth]);
  return isMobile;
}

export default function TopbarSocialCTA({
  size = 'sm',
  compact = true,
}: {
  size?: Size;
  compact?: boolean;
}) {
  const rawPath = (usePathname() || '').toLowerCase();
  const pathname = rawPath.replace(/\/+$/, '');

  const isFounder =
    pathname === '/founder' || pathname.startsWith('/founder/');
  const isInvestors =
    pathname === '/investors' || pathname.startsWith('/investors/') ||
    pathname === '/inversors' || pathname.startsWith('/inversors/');

  // CTA вычисление (как было)
  const target = isFounder ? 'investors' : isInvestors ? 'founder' : 'founder';
  const href   = target === 'investors' ? '/investors' : '/founder';
  const label  = target === 'investors' ? 'For investors' : 'About founder';

  const isInvestorsExact =
    pathname === '/investors' || pathname === '/inversors';

  const isMobile = useIsMobile(768);

  // На мобилке НЕ показываем кнопку "About founder"
  const showPrimaryCTA = !(isMobile && target === 'founder');

  const onOpenDeckClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    window.dispatchEvent(new Event('open-deck'));
  };

  return (
    <>
      <SocialLinks size={size} compact={compact} className="topbar-social">
        {showPrimaryCTA && (
          <Link
            href={href}
            className="social__link social__link--cta"
            aria-label={label}
            title={label}
          >
            <span className="label">{label}</span>
          </Link>
        )}

        {isInvestorsExact && (
          <button
            type="button"
            className="social__link social__link--cta social__link--deck"
            onClick={onOpenDeckClick}
            aria-haspopup="dialog"
            aria-label="Open investor deck"
            title="Open deck"
          >
            <span className="label">Open deck</span>
          </button>
        )}
      </SocialLinks>

      {/* Визуальные стили CTA, без мобильных правил, которые форсят лейблы */}
      <style jsx>{`
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

        :global(.social__link--deck){
          appearance: none;
          -webkit-appearance: none;
          background: none;
          border: none;
          font: inherit;
          color: inherit;
          padding: 0;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
