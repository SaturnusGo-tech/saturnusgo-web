"use client";

// module section primitive
import { PropsWithChildren, ReactNode } from 'react';

export default function Section({
  id,
  kicker,
  title,
  subtitle,
  titleAside,   // ← НОВОЕ: то, что рендерится справа от h2
  children
}: PropsWithChildren<{
  id?: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  titleAside?: ReactNode;
}>) {
  return (
    <section id={id} className="section reveal">
      <div className="section__head">
        {kicker && <div className="kicker">{kicker}</div>}

        <div className="section__titleRow">
          <h2 className="section__title">{title}</h2>
          {titleAside && <div className="section__titleAside">{titleAside}</div>}
        </div>

        {subtitle && <p className="sub">{subtitle}</p>}
      </div>

      <div className="section__body">{children}</div>

      <style jsx>{`
        .section__titleRow{
          display:flex; align-items: baseline; gap:12px; flex-wrap:wrap;
        }
        .section__title{ margin:0 }
        .section__titleAside{ display:inline-flex; align-items:center }
        @media (max-width:680px){
          .section__titleRow{ gap:8px }
        }
      `}</style>
    </section>
  );
}
