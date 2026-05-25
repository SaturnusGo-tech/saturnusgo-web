'use client';

export default function NewsPullQuote({ text }: { text: string }) {
  return (
    <blockquote className="pull" aria-label="Pull quote">
      <span className="mark" aria-hidden>“</span>
      <p>{text}</p>

      <style jsx>{`
        .pull{
          --bg: color-mix(in oklab, var(--bg2), transparent 30%);
          --stroke: color-mix(in oklab, var(--border), white 10%);
          position: relative;
          margin: 10px 0 4px;
          padding: 14px 16px 14px 18px;
          border: 1px solid var(--stroke);
          border-radius: 16px;
          background: var(--bg);
        }
        .pull p{
          margin: 0;
          font-size: clamp(15.5px, 2.1vw, 17px);
          line-height: 1.6;
          color: var(--text);
          text-wrap: pretty;
        }
        .mark{
          position: absolute;
          left: 10px;
          top: 6px;
          font-size: 30px;
          line-height: 1;
          opacity: .26;
          filter: saturate(110%);
        }

        /* Узкие — чуть плотнее и без «блочности» */
        @media (max-width: 560px){
          .pull{ padding: 12px 14px 12px 16px; border-radius: 14px; }
          .pull p{ font-size: 15px; line-height: 1.58; }
          .mark{ left: 8px; top: 4px; font-size: 26px; }
        }

        @supports (backdrop-filter: blur(6px)){
          .pull{ backdrop-filter: blur(6px) saturate(120%); }
        }
      `}</style>
    </blockquote>
  );
}
