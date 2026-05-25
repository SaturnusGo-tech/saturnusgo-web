'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

type Size = 'sm' | 'lg';

/** SSR-safe tone hook — 'light' | 'dark' */
function useTone(): 'light'|'dark' {
  const { resolvedTheme } = useTheme();
  const [tone, setTone] = useState<'light'|'dark'>('dark');

  useEffect(() => {
    let t: 'light'|'dark' =
      resolvedTheme === 'light' ? 'light'
      : resolvedTheme === 'dark' ? 'dark'
      : (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) ? 'dark'
      : (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) ? 'light'
      : 'dark';
    setTone(t);
  }, [resolvedTheme]);

  return tone;
}

export default function SocialLinks({
  size = 'sm',
  children,
  compact = false,
  scroll = false,
  className,
}: {
  size?: Size;
  children?: React.ReactNode;
  compact?: boolean;
  scroll?: boolean;
  className?: string;
}) {
  const tone = useTone();

  const classes = [
    'social',
    size === 'lg' ? 'social--lg' : '',
    compact ? 'is-compact' : '',
    scroll ? 'scroll-x' : '',
    className || '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} data-tone={tone} aria-label="Social links">
      <a
        className="social__link"
        href="https://x.com/saturnusgo?s=21"
        target="_blank"
        rel="noreferrer noopener"
        aria-label="X (Twitter)"
        title="X (Twitter)"
      >
        <span className="ico" aria-hidden="true"><IconX /></span>
        <span className="label">X</span>
      </a>

      <a
        className="social__link"
        href="https://www.instagram.com/saturnusgo?igsh=MTA4OXNuYTF5bGZmNw%3D%3D&utm_source=qr"
        target="_blank"
        rel="noreferrer noopener"
        aria-label="Instagram"
        title="Instagram"
      >
        <span className="ico" aria-hidden="true"><IconInstagram /></span>
        <span className="label">Instagram</span>
      </a>

      <a
        className="social__link"
        href="https://www.linkedin.com/in/mercury-rucks-1b1a11376?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app"
        target="_blank"
        rel="noreferrer noopener"
        aria-label="LinkedIn"
        title="LinkedIn"
      >
        <span className="ico" aria-hidden="true"><IconLinkedIn /></span>
        <span className="label">LinkedIn</span>
      </a>

      {children}

      <style jsx>{`
        .social {
          display:flex; align-items:center; gap:12px;
          ${scroll ? 'max-width:100%; flex-wrap:nowrap; overflow-x:auto; overflow-y:hidden; white-space:nowrap; -webkit-overflow-scrolling:touch;' : ''}
        }
        .social::-webkit-scrollbar{ display: none; }
        .social--lg { gap:14px; }

        /* ===== tokens (dark default) ===== */
        .social{
          --chip-bg: rgba(22,22,24,0.55);
          --chip-bg-hover: rgba(28,28,32,0.62);
          --chip-br: rgba(255,255,255,0.14);
          --chip-fg: rgba(255,255,255,0.92);
          --chip-focus: 0 0 0 2px rgba(122,168,255,.18), 0 10px 28px rgba(0,0,0,.28);
          --chip-shadow: 0 1px 0 rgba(255,255,255,.06) inset, 0 10px 28px rgba(0,0,0,.24);
        }

        /* ===== light overrides ===== */
        .social[data-tone="light"],
        :global(html.light) .social{
          --chip-bg: rgba(255,255,255,0.82);
          --chip-bg-hover: #ffffff;
          --chip-br: rgba(2,6,23,0.12);     /* slate-900 @12% */
          --chip-fg: #0f172a;               /* slate-900 */
          --chip-focus: 0 0 0 2px rgba(100,108,255,.20), 0 12px 30px rgba(2,6,23,.10);
          --chip-shadow: 0 1px 0 rgba(255,255,255,.65) inset, 0 10px 24px rgba(2,6,23,.08);
        }

        .social__link{
          --h: 40px; --radius: 999px; --padX: 12px;
          display:inline-flex; align-items:center; gap:10px;
          height:var(--h); padding:0 var(--padX); border-radius:var(--radius);
          color: var(--chip-fg);
          text-decoration:none;
          background: var(--chip-bg);
          border: 1px solid var(--chip-br);
          box-shadow: var(--chip-shadow);
          backdrop-filter: saturate(135%) blur(8px);
          -webkit-backdrop-filter: saturate(135%) blur(8px);
          transition: border-color .18s ease, box-shadow .18s ease, filter .18s ease, transform .08s ease, background .18s ease, color .18s ease;
          flex: 0 0 auto;
        }
        .social__link:hover{ filter:brightness(1.03); background: var(--chip-bg-hover); }
        .social__link:active{ transform:translateY(1px) }
        .social__link:focus-visible{
          outline:none;
          box-shadow: var(--chip-focus);
          border-color: color-mix(in oklab, var(--chip-br), white 25%);
        }

        .ico{ display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px }
        .ico :global(svg){ width:18px; height:18px; display:block }
        .label{ font-size:14px; line-height:1 }

        .social--lg .social__link{ --h: 46px; --padX: 16px; }
        .social--lg .ico{ width:22px; height:22px }
        .social--lg .ico :global(svg){ width:22px; height:22px }
        .social--lg .label{ font-size:16px }

        /* Compact: только иконки */
        .is-compact .label{ display:none; }
        .is-compact .social__link{ --h: 36px; --padX: 10px; gap:8px; }
        .is-compact .ico,
        .is-compact .ico :global(svg){ width:18px; height:18px; }

        @media (max-width: 560px){
          .is-compact .social__link{ --h: 34px; --padX: 8px; }
          .is-compact .ico,
          .is-compact .ico :global(svg){ width:16px; height:16px; }
          .social{ gap:8px; }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce){
          .social__link{ transition: none !important; }
        }
      `}</style>
    </div>
  );
}

/* Icons */
function IconX(){
  return (
    <svg viewBox="0 0 1200 1227" fill="currentColor" aria-hidden="true">
      <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"/>
    </svg>
  );
}
function IconInstagram(){
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/>
    </svg>
  );
}
function IconLinkedIn(){
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z"/>
    </svg>
  );
}
