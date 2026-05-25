'use client';

type Props = {
  text: string;
  className?: string;
  /** 'auto' — по умолчанию: подстроится под html.light или [data-tone='light'] */
  tone?: 'auto' | 'light' | 'dark';
};

export default function ShimmerH1({ text, className = '', tone = 'auto' }: Props) {
  const toneClass =
    tone === 'light' ? 'rollout--light' : tone === 'dark' ? 'rollout--dark' : 'rollout--auto';

  return (
    <h1 className={`rollout-title ${toneClass} ${className}`} data-text={text}>
      {text}
      <style jsx>{`
        .rollout-title {
          position: relative;
          margin: 0;
          line-height: 1.06;
          font-size: clamp(22px, 2.6vw, 34px);
          font-weight: 800;
          letter-spacing: -0.01em;
          color: var(--base, #fff); /* цвет текста под шиммером */
        }

        .rollout-title::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            var(--g0, #ffffff) 0%,
            var(--g1, #ffffff) 40%,
            var(--g2, rgba(0, 0, 0, 0.55)) 50%,
            var(--g3, #ffffff) 60%,
            var(--g4, #ffffff) 100%
          );
          background-size: 220% 100%;
          background-position: -120% 0%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          mix-blend-mode: var(--blend, multiply);
          animation: shimmer-sweep 2000ms linear infinite;
          pointer-events: none;
        }

        @keyframes shimmer-sweep {
          to {
            background-position: 120% 0%;
          }
        }

        @media (max-width: 560px) {
          .rollout-title {
            font-size: clamp(22px, 6vw, 28px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .rollout-title::after {
            animation: none;
          }
        }

        /* ===== ЯВНО ТЁМНАЯ (по умолчанию) ===== */
        .rollout-title.rollout--dark {
          --base: #ffffff;
          --blend: multiply;
          --g0: #ffffff;
          --g1: #ffffff;
          --g2: rgba(0, 0, 0, 0.55); /* затемняющая полоса */
          --g3: #ffffff;
          --g4: #ffffff;
        }

        /* ===== ЯВНО СВЕТЛАЯ ===== */
        .rollout-title.rollout--light {
          --base: #0f172a; /* тёмный текст на светлом фоне */
          --blend: screen; /* осветляющий блик */
          --g0: rgba(255, 255, 255, 0);
          --g1: rgba(255, 255, 255, 0);
          --g2: rgba(255, 255, 255, 0.92); /* светлый блик по центру */
          --g3: rgba(255, 255, 255, 0);
          --g4: rgba(255, 255, 255, 0);
        }

        /* ===== AUTO (следует за html.light или data-tone="light") ===== */
        .rollout-title.rollout--auto {
          /* наследует тёмные значения по умолчанию */
          --base: #ffffff;
          --blend: multiply;
          --g0: #ffffff;
          --g1: #ffffff;
          --g2: rgba(0, 0, 0, 0.55);
          --g3: #ffffff;
          --g4: #ffffff;
        }

        :global(html.light) .rollout-title.rollout--auto,
        :global([data-tone='light']) .rollout-title.rollout--auto {
          --base: #0f172a;
          --blend: screen;
          --g0: rgba(255, 255, 255, 0);
          --g1: rgba(255, 255, 255, 0);
          --g2: rgba(255, 255, 255, 0.92);
          --g3: rgba(255, 255, 255, 0);
          --g4: rgba(255, 255, 255, 0);
        }
      `}</style>
    </h1>
  );
}
