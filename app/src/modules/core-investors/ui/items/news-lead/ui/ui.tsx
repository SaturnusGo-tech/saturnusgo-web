'use client';

import { ReactNode } from 'react';

export default function NewsLead({ children }: { children: ReactNode }) {
  return (
    <p className="lead">
      {children}
      <style jsx>{`
        .lead{
          margin: 0;
          font-size: clamp(16px, 1.9vw, 18px);
          line-height: 1.65;
          color: var(--text);
          max-width: 72ch;
          text-wrap: pretty;
        }
        /* Газетный drop cap — деликатный на десктопе */
        .lead::first-letter{
          float: left;
          font-weight: 800;
          font-size: 2.35em;
          line-height: .9;
          padding-right: 8px;
          margin-top: 4px;
          letter-spacing: -0.02em;
        }

        /* Чуть компактнее на планшете */
        @media (max-width: 680px){
          .lead{ font-size: 16px; line-height: 1.7; max-width: 65ch; }
          .lead::first-letter{ font-size: 1.8em; margin-top: 2px; padding-right: 6px; }
        }

        /* На очень узких — отключаем drop cap (читаемость > стиль) */
        @media (max-width: 420px){
          .lead::first-letter{
            float: none;
            font-size: inherit;
            padding: 0;
            margin: 0;
            font-weight: inherit;
          }
        }

        @media (prefers-reduced-motion: reduce){
          .lead::first-letter{ transition: none; }
        }
      `}</style>
    </p>
  );
}
