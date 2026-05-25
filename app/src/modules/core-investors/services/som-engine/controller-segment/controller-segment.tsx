"use client";

// File: components/ControllerSegment.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Horizon } from '../types/types';

type Props = {
  value: Horizon;
  onChange: (h: Horizon) => void;
  className?: string;
  /** If true, the control floats to the right edge of its container */
  alignRight?: boolean;
  /** Optional aria-label for accessibility */
  ariaLabel?: string;
};

/**
 * iOS-style segmented control (3 / 5 / 10 years).
 * - Professional, blue palette (no purple), glassy track, animated thumb.
 * - Equal-width segments with full-bleed layout (no inner gaps at edges or between options).
 * - Keyboard accessible (Left/Right/Enter/Space).
 * - Right-aligned by default.
 */
export function ControllerSegment({
  value,
  onChange,
  className = '',
  alignRight = true,
  ariaLabel = 'Horizon selector',
}: Props) {
  const options: Horizon[] = [3, 5, 10];

  const wrapRef = useRef<HTMLDivElement>(null);
  const activeIndex = useMemo(() => Math.max(0, options.indexOf(value)), [options, value]);

  const [thumbStyle, setThumbStyle] = useState<{ width: number; x: number }>({ width: 0, x: 0 });

  const measure = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    // Use computed paddings to ensure true inner width
    const cs = getComputedStyle(wrap);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const inner = wrap.clientWidth - padL - padR;

    const per = inner / options.length; // exact equal width, decimals allowed (prevents 1px drift)
    const x = padL + activeIndex * per;

    setThumbStyle({ width: per, x });
  };

  useEffect(() => {
    measure();
  }, [activeIndex]);

  // Re-measure on resize/containment changes
  useEffect(() => {
    const ro = new ResizeObserver(() => measure());
    if (wrapRef.current) ro.observe(wrapRef.current);
    const onWin = () => measure();
    window.addEventListener('resize', onWin);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onWin);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectByStep = (step: number) => {
    const idx = options.indexOf(value);
    const next = options[Math.min(options.length - 1, Math.max(0, idx + step))];
    if (next !== undefined && next !== value) onChange(next);
  };

  return (
    <div className={`seg-wrap ${alignRight ? 'is-right' : ''} ${className ?? ''}`}>
      <div
        ref={wrapRef}
        className="seg"
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); selectByStep(1); }
          if (e.key === 'ArrowLeft')  { e.preventDefault(); selectByStep(-1); }
        }}
      >
        {/* animated thumb */}
        <div
          className="seg__thumb"
          style={{
            width: `${thumbStyle.width}px`,
            transform: `translateX(${thumbStyle.x}px)`,
          }}
          aria-hidden="true"
        />

        {options.map((h) => {
          const isActive = h === value;
          return (
            <button
              key={h}
              role="tab"
              aria-selected={isActive}
              className={`seg__btn ${isActive ? 'is-active' : ''}`}
              onClick={() => onChange(h)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(h);
                }
              }}
              type="button"
              tabIndex={isActive ? 0 : -1}
            >
              {h}y
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .seg-wrap {
          display: flex;
          justify-content: ${alignRight ? 'flex-end' : 'flex-start'};
          width: 100%;
        }

        /* Blue, professional palette — no purple */
        .seg {
          --seg-bg: rgba(16, 56, 120, 0.14);       /* subtle blue wash */
          --seg-stroke: rgba(16, 56, 120, 0.25);   /* blue stroke */
          --seg-thumb: rgba(255, 255, 255, 0.92);  /* light thumb */
          --seg-text: #0b1320;                     /* primary text */
          --seg-text-muted: rgba(11, 19, 32, 0.66);
          --seg-ring: rgba(0, 122, 255, 0.35);     /* blue focus ring */

          position: relative;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;                                  /* no gaps between cells */
          padding: 0;                              /* full-bleed to edges */
          border-radius: 14px;
          background: var(--seg-bg);
          border: 1px solid var(--seg-stroke);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          isolation: isolate;
          overflow: hidden;                        /* ensure thumb clips perfectly */
        }

        :global(html.dark) .seg {
          --seg-bg: rgba(6, 22, 44, 0.55);
          --seg-stroke: rgba(195, 220, 255, 0.12);
          --seg-thumb: rgba(240, 247, 255, 0.08);
          --seg-text: #eaf1ff;
          --seg-text-muted: rgba(234, 241, 255, 0.72);
          --seg-ring: rgba(0, 132, 255, 0.45);
        }

        .seg__thumb {
          position: absolute;
          inset: 0;                                /* flush to container, no inner gap */
          height: 100%;
          border-radius: inherit;
          background: var(--seg-thumb);
          box-shadow:
            0 1px 2px rgba(0, 0, 0, 0.08),
            0 0 0 1px rgba(0, 0, 0, 0.06) inset;
          transition: transform 260ms cubic-bezier(.2,.8,.2,1),
                      width 260ms cubic-bezier(.2,.8,.2,1);
          pointer-events: none;
          z-index: 0;
        }

        .seg__btn {
          position: relative;
          z-index: 1;
          min-width: 0;
          width: 100%;
          padding: 10px 16px;
          border: 0;
          background: transparent;
          color: var(--seg-text-muted);
          font-size: 13px;
          font-weight: 700;
          line-height: 1;
          border-radius: 0;                        /* cells meet seamlessly */
          cursor: pointer;
          outline: none;
          transition: color 140ms ease, transform 120ms ease;
          -webkit-tap-highlight-color: transparent;

          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
        }

        .seg__btn.is-active { color: var(--seg-text); }
        .seg__btn:hover { color: var(--seg-text); }
        .seg__btn:active { transform: translateY(0.5px); }

        .seg:focus-within {
          box-shadow: 0 0 0 3px var(--seg-ring);
        }

        @media (prefers-reduced-motion: reduce) {
          .seg__thumb { transition: none; }
          .seg__btn { transition: none; }
        }
      `}</style>
    </div>
  );
}
