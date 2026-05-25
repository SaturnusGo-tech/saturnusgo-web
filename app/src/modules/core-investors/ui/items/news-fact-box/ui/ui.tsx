'use client';

type Item = { label: string; value: string };

export default function NewsFactBox({ title, items }: { title: string; items: Item[] }) {
  return (
    <aside className="factbox" role="note" aria-labelledby="factbox-title">
      <h5 id="factbox-title" className="title">{title}</h5>
      <dl className="list">
        {items.map((it, i) => (
          <div className="row" key={i}>
            <dt>{it.label}</dt>
            <dd>{it.value}</dd>
          </div>
        ))}
      </dl>

      <style jsx>{`
        .factbox{
          --bg: color-mix(in oklab, var(--bg2), transparent 25%);
          --stroke: color-mix(in oklab, var(--border), white 10%);
          display: grid; gap: 10px;
          border: 1px solid var(--stroke);
          border-radius: 16px;
          padding: 12px;
          background: var(--bg);
        }
        @supports (backdrop-filter: blur(8px)){
          .factbox{ backdrop-filter: blur(8px) saturate(120%); }
        }

        .title{
          margin: 0;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: var(--text);
        }

        .list{ margin: 0; display: grid; gap: 8px; }

        .row{
          display: grid;
          grid-template-columns: 1fr;
          gap: 2px;
          padding: 8px 0;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .row:first-child{ border-top: 0; }

        dt{
          font-size: 12px;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: var(--text-3);
        }
        dd{
          margin: 0;
          font-size: 14.5px;
          color: var(--text);
        }

        /* Две колонки подписей на планшете и выше */
        @media (min-width: 520px){
          .row{
            grid-template-columns: 0.9fr 1.2fr;
            align-items: baseline;
          }
          dt{ margin-right: 10px; }
        }

        /* Узкие — плотнее паддинги и радиус */
        @media (max-width: 420px){
          .factbox{ padding: 10px; border-radius: 14px; }
        }
      `}</style>
    </aside>
  );
}
