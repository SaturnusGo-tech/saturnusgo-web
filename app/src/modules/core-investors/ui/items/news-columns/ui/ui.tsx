"use client";

// components/investors/NewsColumns.tsx
'use client';

type Section = { title: string; body: string };

export default function NewsColumns({ sections }: { sections: Section[] }) {
  return (
    <div className="cols" role="article" aria-label="Story">
      {sections.map((s) => (
        <section key={s.title} className="colsec" aria-labelledby={slug(s.title)}>
          <h4 id={slug(s.title)}>{s.title}</h4>
          <p>{s.body}</p>
        </section>
      ))}

      <style jsx>{`
        /* Mobile-first: одна колонка, аккуратная типографика */
        .cols{
          column-gap: 22px;          /* мобайл: просто запас на будущее */
        }

        /* Газетные 2 колонки только на десктопе */
        @media (min-width: 980px){
          .cols{ column-count: 2; column-gap: 26px; }
        }
        @media (min-width: 1280px){
          .cols{ column-gap: 28px; }
        }

        .colsec{
          break-inside: avoid;
          margin: 0 0 10px 0;
          padding-bottom: 10px;
          border-bottom: 1px dashed rgba(255,255,255,0.08);
        }
        .colsec:last-child{ border-bottom: 0; padding-bottom: 0; }

        /* Заголовок секции — компактный на телефоне */
        h4{
          margin: 0 0 4px 0;
          font-size: clamp(11px, 2.9vw, 12.5px);
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--text);
        }

        /* Копирайт — тоже компактнее; комфортный leading */
        p{
          margin: 0;
          font-size: clamp(12.5px, 3.6vw, 14px);
          line-height: 1.6;
          color: var(--text-2);
          text-wrap: pretty;
          hyphens: auto;
        }

        /* Чуть крупнее на «обычных» телефонах */
        @media (min-width: 480px){
          h4{ font-size: clamp(12px, 2.2vw, 13px); }
          p { font-size: clamp(13px, 2.4vw, 14.5px); line-height: 1.64; }
        }

        /* Десктоп: вернём прежнюю читабельность */
        @media (min-width: 980px){
          h4{ font-size: 13px; }
          p { font-size: 14.5px; line-height: 1.68; }
          .colsec{ padding-bottom: 12px; margin-bottom: 14px; }
        }

        /* Очень широкие: лёгкий апскейл */
        @media (min-width: 1280px){
          p{ font-size: 15px; }
        }
      `}</style>
    </div>
  );
}

function slug(s: string){
  return s.toLowerCase().replace(/[^a-z0-9]+/gi, '-');
}
