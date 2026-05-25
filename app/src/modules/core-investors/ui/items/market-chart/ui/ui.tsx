"use client";

// core-investors market chart
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

type BarKey = 'TAM' | 'SAM' | 'SOM';
type Bar = { key: BarKey; label: string; valPctOfTAM: number };
type TextPosition = 'above' | 'below';

type MarketScope = 'ride-hailing' | 'shared-mobility' | 'smart-mobility' | 'custom';
type SamMetric = 'GMV' | 'OperatorRevenue';
type SourceLink = { label: string; href: string };

export type MarketChartProps = {
  className?: string;
  offsetTop?: number;
  showText?: boolean;
  textPosition?: TextPosition;
  title?: string;

  /** Left axis max (% of TAM) */
  leftMaxPct?: number;

  /** Right axis max ($M); if omitted, auto-computed */
  rightMaxM?: number;

  /** Visual-only scaling of the SOM bar (does not affect math) */
  somScale?: number;
  showSomScaleNote?: boolean;

  /** Right axis label */
  rightAxisLabel?: string;

  /** Custom line points ($M), e.g. [80, 200, 380, 625] */
  arrTargetsM?: number[];

  /** Market values (safe defaults will be used if omitted) */
  marketUSD?: {
    TAM: number;
    TAMYear?: string;
    SAM: number;
    SAMYear?: string;
    SOM?: number;
  };

  /** Callout annotations */
  callout?: {
    somUsersM?: number;
    arpuUSD?: number;
    penetrationPct?: number;
  };

  /** Labels / semantics */
  marketScope?: MarketScope;
  samMetric?: SamMetric;
  takeRate?: number;

  /** Sources (rendered below) */
  sources?: SourceLink[];

  /**
   * If provided, SOM = SAM × somShareOfSAM (Y3).
   * Example: 0.015 = 1.5% of SAM.
   */
  somShareOfSAM?: number;

  /** Rationale note (rendered above sources) */
  rationale?: string;

  /**
   * Triggers a clean build animation whenever this value changes.
   * Pass horizon or `${horizon}-${Math.round(som)}` from the parent.
   */
  rebuildKey?: string | number;
};

/* ---------- helpers ---------- */

function formatMoneyShort(usd: number): string {
  const abs = Math.abs(usd);
  if (abs >= 1e12) return `$${(usd / 1e12).toFixed(1)}T`;
  if (abs >= 1e9)  return `$${(usd / 1e9).toFixed(1)}B`;
  if (abs >= 1e6)  return `$${(usd / 1e6).toFixed(0)}M`;
  if (abs >= 1e3)  return `$${(usd / 1e3).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

/** Soft staircase to final point ($M) */
function buildDefaultArrTargets(finalM: number): number[] {
  const y0 = Math.max(5, Math.round(finalM * 0.10));
  const y1 = Math.max(y0 + 1, Math.round(finalM * 0.35));
  const y2 = Math.max(y1 + 1, Math.round(finalM * 0.65));
  const y3 = Math.round(finalM);
  return [y0, y1, y2, y3];
}

/** Safe defaults (replace with prod values) */
const DEFAULT_MARKET = {
  TAM: 1.7e12,
  TAMYear: 'Global',
  SAM: 1.0514e11,
  SAMYear: '2033e',
  SOM: 6.25e8,
};

export default function MarketChart({
  className = '',
  offsetTop = 70,
  showText = true,
  textPosition = 'below',
  title = '',

  leftMaxPct = 100,
  rightMaxM,
  somScale = 1,
  showSomScaleNote = true,
  rightAxisLabel = 'Right: $M (ARR)',

  arrTargetsM,
  marketUSD,
  callout,
  marketScope = 'custom',
  samMetric = 'GMV',
  takeRate,
  sources = [],
  somShareOfSAM,
  rationale,

  rebuildKey,
}: MarketChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const [inView, setInView] = useState(false);
  const [built, setBuilt] = useState(false);               // drives rebuild animation
  const [pathLen, setPathLen] = useState(1);               // actual line length for dash animation

  const [w, setW] = useState(920);
  const [h, setH] = useState(380);

  const { resolvedTheme } = useTheme();
  const tone = resolvedTheme === 'light' ? 'light' : 'dark';

  // Resize & in-view observers
  useEffect(() => {
    const el = wrapRef.current!;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);

    const ro = new ResizeObserver(([entry]) => {
      const cw = Math.max(300, Math.floor(entry.contentRect.width));
      const isMob = cw <= 560;
      const ratio = isMob ? (320 / 920) : (380 / 920);
      const ch = Math.round(cw * ratio);
      setW(cw); setH(ch);
    });
    ro.observe(el);

    return () => { io.disconnect(); ro.disconnect(); };
  }, []);

  const isMobile = w <= 560;

  /* === Value sources (with defaults) === */
  const MARKET = useMemo(() => {
    const m = marketUSD ?? DEFAULT_MARKET;
    return {
      TAM: m.TAM,
      TAMYear: m.TAMYear ?? '',
      SAM: m.SAM,
      SAMYear: m.SAMYear ?? '',
      SOM: typeof m.SOM === 'number' ? m.SOM : DEFAULT_MARKET.SOM,
    };
  }, [marketUSD]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && !marketUSD) {
      // eslint-disable-next-line no-console
      console.warn('MarketChart: marketUSD prop is missing — using DEFAULT_MARKET');
    }
  }, [marketUSD]);

  /* === SOM value === */
  const SOM_VALUE = useMemo(() => {
    if (typeof somShareOfSAM === 'number' && isFinite(somShareOfSAM) && somShareOfSAM > 0) {
      return MARKET.SAM * somShareOfSAM;
    }
    return MARKET.SOM;
  }, [somShareOfSAM, MARKET.SAM, MARKET.SOM]);

  /* === Right-side line data === */
  const SOM_TARGET_M = Math.max(1, Math.round(SOM_VALUE / 1e6)); // in $M
  const ARR_TARGETS_M = useMemo(
    () => (arrTargetsM?.length ? arrTargetsM : buildDefaultArrTargets(SOM_TARGET_M)),
    [arrTargetsM, SOM_TARGET_M]
  );

  const computedRightMax = Math.max(...ARR_TARGETS_M) * 1.15;
  const RIGHT_MAX = rightMaxM ?? computedRightMax;

  /* === Percentages === */
  const SAM_PCT_OF_TAM = (MARKET.SAM / MARKET.TAM) * 100;
  const SOM_PCT_OF_TAM = (SOM_VALUE / MARKET.TAM) * 100;
  const SOM_PCT_OF_SAM = MARKET.SAM > 0 ? (SOM_VALUE / MARKET.SAM) * 100 : 0;

  /* === Bars model === */
  const bars: Bar[] = useMemo(() => {
    const tamLabel = `${formatMoneyShort(MARKET.TAM)}${MARKET.TAMYear ? ` (${MARKET.TAMYear})` : '+'}`;
    const samLabel = `${formatMoneyShort(MARKET.SAM)}${MARKET.SAMYear ? ` (${MARKET.SAMYear})` : ''}`;
    const somLabel = `${formatMoneyShort(SOM_VALUE)} (Y3)`;
    return [
      { key: 'TAM', label: tamLabel, valPctOfTAM: 100 },
      { key: 'SAM', label: samLabel, valPctOfTAM: SAM_PCT_OF_TAM },
      { key: 'SOM', label: somLabel, valPctOfTAM: SOM_PCT_OF_TAM },
    ];
  }, [MARKET, SOM_VALUE, SAM_PCT_OF_TAM, SOM_PCT_OF_TAM]);

  /* === Geometry === */
  const P_LEFT   = isMobile ? 36 : 48;
  const P_RIGHT  = isMobile ? 42 : 76;
  const P_TOP    = isMobile ? 38 : 48;
  const P_BOTTOM = isMobile ? 44 : 48;

  const chartW = Math.max(1, w - P_LEFT - P_RIGHT);
  const chartH = Math.max(1, h - P_TOP - P_BOTTOM);

  const barWBase = chartW / (bars.length * 2);
  const barW = Math.max(isMobile ? 26 : 34, barWBase);
  const barGap = barW;
  const xBar = (i: number) => P_LEFT + i * (barW + barGap) + barGap * 0.5;

  /* === Axes === */
  const yPct = (vPct: number) => P_TOP + chartH - (vPct / leftMaxPct) * chartH;
  const yM   = (vM: number)   => P_TOP + chartH - (vM / RIGHT_MAX)   * chartH;

  /* === Right line === */
  const years = ['Y0', 'Y1', 'Y2', 'Y3'] as const;
  const xLine = (i: number) => P_LEFT + (chartW / (ARR_TARGETS_M.length - 1)) * i;
  const pathD = ARR_TARGETS_M.map((v, i) => `${i ? 'L' : 'M'} ${xLine(i)} ${yM(v)}`).join(' ');

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  /* === Strings === */
  const somPctTAMStr = `${SOM_PCT_OF_TAM.toFixed(3)}%`;
  const somPctSAMStr = MARKET.SAM > 0 ? `${SOM_PCT_OF_SAM.toFixed(2)}%` : '—';
  const samPctStr    = `${SAM_PCT_OF_TAM.toFixed(1)}%`;

  const somUsersM = callout?.somUsersM;
  const arpuUSD   = callout?.arpuUSD;
  const penetrationPct = callout?.penetrationPct;

  const AXIS_LABEL_Y = isMobile ? P_TOP - 20 : P_TOP - 26;

  const chipYOffset = (key: BarKey) => {
    if (key === 'TAM') return isMobile ? -16 : -22;
    return -12;
  };

  /* ===== Rebuild animation cycle =====
     Any time rebuildKey changes (e.g., horizon switch), we:
     1) flip built=false (immediate “reset”)
     2) next frame, set built=true to animate bars/line from 0 → target
  */
  useEffect(() => {
    setBuilt(false);
    const id = requestAnimationFrame(() => setBuilt(true));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rebuildKey]);

  // Compute actual path length for precise dash animation
  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    try {
      const len = Math.max(1, el.getTotalLength());
      setPathLen(len);
    } catch {
      setPathLen(1);
    }
  }, [pathD, w, h, RIGHT_MAX]);

  // Reveal only when in view; rebuild should still animate if already visible
  const playAnim = inView && !reduceMotion && built;

  const scopePretty =
    marketScope === 'ride-hailing' ? 'Ride-Hailing'
    : marketScope === 'shared-mobility' ? 'Shared Mobility (LATAM)'
    : marketScope === 'smart-mobility' ? 'Smart Mobility (LATAM)'
    : 'Selected Market';

  const samMetricPretty = samMetric === 'GMV' ? 'GMV' : 'Operator Revenue';
  const takeRateNote =
    samMetric === 'OperatorRevenue' && typeof takeRate === 'number'
      ? ` • Take rate ≈ ${(takeRate * 100).toFixed(0)}%`
      : '';

  return (
    <div
      ref={wrapRef}
      className={`mc ${className}`}
      data-tone={tone}
      style={{ marginTop: offsetTop }}
      aria-label="Market chart: TAM/SAM/SOM (left axis %) and right-axis line ($M)"
    >
      {title ? <h2 className="mc__h2">{title}</h2> : null}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="TAM/SAM/SOM bars (% of TAM) with right-axis line ($M)"
        className="mc__svg"
      >
        <defs>
          <linearGradient id="mcBarGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor="var(--mc-accent)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--mc-accent)" stopOpacity="0.22" />
          </linearGradient>

          {!isMobile && !reduceMotion && (
            <filter id="mcGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Left grid (% of TAM) */}
        {[0, 25, 50, 75, 100].map((t) => (
          <g key={`pct-${t}`}>
            <line x1={P_LEFT} y1={yPct(t)} x2={w - P_RIGHT} y2={yPct(t)} className="mc__grid" />
            <text x={P_LEFT - 10} y={yPct(t)} dy=".32em" dominantBaseline="central" className="mc__ytick" fill="currentColor">
              {t}%
            </text>
          </g>
        ))}

        {/* Bars (bottom-anchored scaleY for smooth rebuild) */}
        {bars.map((b, i) => {
          const rawPct = b.valPctOfTAM;
          const visualPct = b.key === 'SOM' && somScale > 1
            ? Math.min(rawPct * somScale, leftMaxPct)
            : rawPct;

          const scale = Math.max(0, Math.min(1, visualPct / leftMaxPct));
          const chipX = xBar(i) + barW / 2;
          const chipY = P_TOP + (chartH - chartH * scale) + chipYOffset(b.key);

          // Where the unscaled rect would top out (for reference line on SOM)
          const somRefY = P_TOP + (chartH - chartH * Math.max(0, Math.min(1, rawPct / leftMaxPct)));

          return (
            <g key={b.key}>
              <g transform={`translate(${xBar(i)}, ${P_TOP})`}>
                <rect
                  width={barW}
                  height={chartH}
                  rx={8}
                  className="mc__bar"
                  style={{
                    transformOrigin: 'bottom',
                    transformBox: 'fill-box' as any,
                    transform: `scaleY(${playAnim ? scale : 0})`,
                    transition: reduceMotion ? 'none' : 'transform 700ms cubic-bezier(.2,.8,.2,1) 80ms',
                  }}
                />
              </g>

              {/* Chip above bar */}
              <g
                className="mc__barlabel"
                transform={`translate(${chipX}, ${chipY})`}
                style={{
                  opacity: playAnim ? 1 : 0,
                  transition: reduceMotion ? 'none' : 'opacity 420ms ease 260ms',
                }}
              >
                {/* dynamic width based on label length */}
                {(() => {
                  const chipW = Math.max(64, Math.min(isMobile ? 120 : 200, Math.round(b.label.length * 7.2) + 20));
                  return (
                    <>
                      <rect className="mc__chip" x={-chipW / 2} y={-12} width={chipW} height={24} rx={10} />
                      <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" className="mc__barlabelText">
                        {b.label}
                      </text>
                    </>
                  );
                })()}
              </g>

              {/* Bar key under bar */}
              <text x={xBar(i) + barW / 2} y={P_TOP + chartH + 18} className="mc__xlabel">{b.key}</text>

              {/* SOM rescale note & reference line */}
              {b.key === 'SOM' && somScale > 1 && showSomScaleNote && (
                <>
                  <text x={xBar(i) + barW / 2} y={P_TOP + chartH + 32} className="mc__scaleNote">scaled ×{somScale}</text>
                  <line
                    x1={xBar(i)} x2={xBar(i) + barW}
                    y1={somRefY}
                    y2={somRefY}
                    stroke="var(--mc-refline)"
                    strokeDasharray="2 3"
                  />
                </>
              )}
            </g>
          );
        })}

        {/* Right axis ($M) */}
        <g aria-hidden="true">
          {Array.from({ length: 6 }).map((_, idx) => {
            const t = Math.round((RIGHT_MAX / 5) * idx);
            return (
              <text
                key={`m-${t}`}
                x={w - (P_RIGHT - 6)}
                y={yM(t)}
                className="mc__ytick right"
                textAnchor="start"
              >
                ${t}M
              </text>
            );
          })}
          <text x={P_LEFT} y={AXIS_LABEL_Y} className="mc__axisLabel mc__axisLabel--left">
            Left: % of TAM ({scopePretty})
          </text>
          <text x={w - P_RIGHT} y={AXIS_LABEL_Y} className="mc__axisLabel" textAnchor="end">
            {rightAxisLabel}
          </text>
        </g>

        {/* Right-side line with precise dash-length */}
        <path
          ref={pathRef}
          d={pathD}
          className="mc__line"
          filter={(!isMobile && !reduceMotion) ? 'url(#mcGlow)' : undefined}
          style={{
            strokeDasharray: pathLen,
            strokeDashoffset: playAnim ? 0 : pathLen,
            transition: reduceMotion ? 'none' : 'stroke-dashoffset 900ms ease 150ms',
          }}
        />

        {/* Points on the line */}
        {ARR_TARGETS_M.map((v, i) => {
          const show = isMobile ? i === ARR_TARGETS_M.length - 1 : true;
          if (!show) return null;
          const px = xLine(i);
          const py = yM(v);
          const CHIP_W = 64;
          const CHIP_H = 22;

          return (
            <g
              key={`pt-${i}`}
              transform={`translate(${px}, ${py})`}
              className="mc__pointGroup"
              style={{
                opacity: playAnim ? 1 : 0,
                transition: reduceMotion ? 'none' : 'opacity 420ms ease 300ms',
              }}
            >
              <circle r={4} className="mc__point" />
              <line x1={0} y1={-2} x2={18} y2={-18} stroke="var(--mc-accent)" strokeWidth="1" opacity="0.7" />
              <g transform={`translate(18, -24)`} className="mc__tag">
                <rect className="mc__chip" x={-CHIP_W / 2} y={-CHIP_H / 2} width={CHIP_W} height={CHIP_H} rx={10} />
                <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" className="mc__tagText">
                  ${v}M
                </text>
              </g>
            </g>
          );
        })}

        {/* Legend (desktop) */}
        {!isMobile && (
          <g className="mc__legend" transform={`translate(${Math.max(P_LEFT, w - P_RIGHT - 240 - 10)}, ${P_TOP + 8})`}>
            <g transform="translate(0,0)">
              <rect width="12" height="12" rx="3" fill="url(#mcBarGrad)" />
              <text x="18" y="10" className="mc__legendText">Bars: % of TAM ({scopePretty})</text>
            </g>
            <g transform="translate(0,22)">
              <rect width="12" height="2" y="5" fill="var(--mc-accent)" />
              <text x="18" y="10" className="mc__legendText">Line: {rightAxisLabel.replace('Right: ', '')}</text>
            </g>
          </g>
        )}

        {/* Years at bottom */}
        <g aria-hidden="true">
          {years.map((y, i) => (
            <text key={y} x={xLine(i)} y={h - P_BOTTOM + 18} className="mc__xhoriz">{y}</text>
          ))}
        </g>
      </svg>

      {/* Mobile legend */}
      {isMobile && (
        <div className="mc__legendInline" role="note" aria-label="Legend">
          <span className="mc__legendDot" aria-hidden /> Bars: % of TAM ({scopePretty})
          <span className="mc__legendSep" />
          <span className="mc__legendLine" aria-hidden /> Line: {rightAxisLabel.replace('Right: ', '')}
        </div>
      )}

      {/* Callout */}
      {showText && textPosition === 'below' && (
        <div className="mc__callout" role="note" aria-label="Market details callout">
          <div className="mc__calloutInner">
            <div className="mc__tile">
              <div className="mc__tileHead">
                <span className="mc__badge">TAM</span>
                <span className="mc__sub">{scopePretty}</span>
              </div>
              <div className="mc__val">
                {formatMoneyShort(MARKET.TAM)}
                {MARKET.TAMYear ? <span className="mc__muted"> ({MARKET.TAMYear})</span> : <span className="mc__muted">+</span>}
              </div>
              <div className="mc__meta">Annual bookings (market scope)</div>
            </div>

            <div className="mc__tile">
              <div className="mc__tileHead">
                <span className="mc__badge">SAM</span>
                <span className="mc__sub">{samMetricPretty}{takeRateNote}</span>
              </div>
              <div className="mc__val">
                {formatMoneyShort(MARKET.SAM)}{MARKET.SAMYear ? <span className="mc__muted"> ({MARKET.SAMYear})</span> : null}
              </div>
              <div className="mc__meta">≈ {samPctStr} of TAM</div>
            </div>

            <div className="mc__tile">
              <div className="mc__tileHead">
                <span className="mc__badge">SOM · Y3</span>
                <span className="mc__sub">
                  {typeof penetrationPct === 'number' ? `Penetration ${penetrationPct}%` : 'Target'}
                  {typeof somUsersM === 'number' ? ` • ${somUsersM}M users` : ''}
                  {typeof arpuUSD === 'number' ? ` • $${arpuUSD} ARPU (incl. non-ride)` : ''}
                </span>
              </div>
              <div className="mc__val">{formatMoneyShort(SOM_VALUE)} ARR</div>
              <div className="mc__meta">
                ≈ {somPctTAMStr} of TAM • {somPctSAMStr} of SAM
                {typeof somShareOfSAM === 'number' && somShareOfSAM > 0 ? ` (input ${(somShareOfSAM * 100).toFixed(2)}%)` : ''}
              </div>
            </div>
          </div>

          {rationale ? (
            <div className="mc__rationale" role="note" aria-label="Rationale">
              {rationale}
            </div>
          ) : null}

          {!!sources.length && (
            <div className="mc__sources" role="note" aria-label="Sources">
              {sources.map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        /* Tokens (dark default) */
        .mc {
          --mc-bg: transparent;
          --mc-fg: hsl(0 0% 96%);
          --mc-muted: hsl(0 0% 70% / 0.65);
          --mc-grid: hsl(0 0% 100% / 0.08);
          --mc-chip-bg: hsl(0 0% 0% / 0.45);
          --mc-accent: var(--accent, #7c74ff);
          --mc-refline: rgba(255, 255, 255, 0.35);
          color: var(--mc-fg);
        }

        .mc text { fill: currentColor; }
        .mc .mc__ytick,
        .mc .mc__legendText,
        .mc .mc__axisLabel,
        .mc .mc__meta { opacity: .75; }

        /* Light overrides */
        :global(html.light) .mc,
        .mc[data-tone="light"] {
          --mc-bg: transparent;
          --mc-fg: #0f1115;
          --mc-muted: #4b5563;
          --mc-grid: #e6e9ee;
          --mc-chip-bg: #ffffff;
          --mc-refline: rgba(0, 0, 0, 0.35);
        }
        :global(html.light) .mc .mc__chip,
        .mc[data-tone="light"] .mc__chip {
          stroke: #e7eaf0;
        }
        :global(html.light) .mc .mc__calloutInner,
        .mc[data-tone="light"] .mc__calloutInner {
          background: #fff;
          backdrop-filter: none;
          border: 1px solid #e7eaf0;
        }

        /* Frame */
        .mc__h2 {
          font-size: clamp(1.05rem, 1.2vw + 1rem, 1.5rem);
          margin: 0 0 16px;
        }
        .mc__svg {
          width: 100%;
          height: auto;
          display: block;
          background: var(--mc-bg);
        }

        /* Grid & axes */
        .mc__grid {
          stroke: var(--mc-grid);
          stroke-width: 1;
          shape-rendering: geometricPrecision;
        }
        .mc__ytick {
          fill: var(--mc-muted);
          font-size: 11px;
          dominant-baseline: middle;
          text-anchor: end;
        }
        .mc__ytick.right { text-anchor: start; }
        .mc__axisLabel {
          fill: var(--mc-muted);
          font-size: 11px;
          font-weight: 600;
        }
        .mc__axisLabel--left { transform: translateY(-12px); }

        /* Labels & bars */
        .mc__xlabel,
        .mc__xhoriz {
          fill: var(--mc-muted);
          font-size: 12px;
          text-anchor: middle;
        }
        .mc__bar { fill: url(#mcBarGrad); }
        .mc__barlabelText {
          fill: var(--mc-fg);
          font-size: 12px;
          font-weight: 600;
        }
        .mc__chip {
          fill: var(--mc-chip-bg);
          stroke: hsl(0 0% 100% / 0.06);
          stroke-width: 1;
        }

        /* Line & points */
        .mc__line { fill: none; stroke: var(--mc-accent); stroke-width: 2; }
        .mc__point { fill: var(--mc-accent); }
        .mc__tagText { fill: var(--mc-fg); font-size: 11px; font-weight: 600; }

        /* Legend */
        .mc__legendText { fill: var(--mc-fg); font-size: 12px; }
        .mc__legendInline {
          display: flex; align-items: center; gap: 10px;
          margin-top: 8px; font-size: 12px; color: var(--mc-muted);
          flex-wrap: wrap;
        }
        .mc__legendDot {
          width: 12px; height: 12px; border-radius: 3px;
          background: linear-gradient(180deg, var(--mc-accent), transparent);
          display: inline-block;
        }
        .mc__legendLine { width: 20px; height: 2px; background: var(--mc-accent); display: inline-block; }
        .mc__legendSep { width: 8px; height: 1px; background: var(--mc-grid); display: inline-block; margin: 0 2px; }

        /* Callout */
        .mc__callout {
          margin-top: 16px; border-radius: 16px; padding: 1px;
          background: linear-gradient(90deg, var(--mc-accent), hsl(0 0% 100% / 0) 35%, var(--mc-accent));
        }
        .mc__calloutInner {
          background: hsl(0 0% 0% / 0.45);
          backdrop-filter: blur(8px);
          border-radius: 16px;
          padding: 14px 16px;
          display: grid;
          gap: 12px;
          grid-template-columns: 1fr;
        }
        .mc__tile { display: grid; gap: 6px; }
        .mc__tileHead { display: flex; gap: 10px; align-items: center; }
        .mc__badge {
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.4px;
          color: white;
          background: linear-gradient(90deg, var(--mc-accent), #9a93ff);
          box-shadow: 0 0 0 1px hsl(0 0% 100% / 0.12) inset;
          white-space: nowrap;
        }
        .mc__sub { color: var(--mc-muted); font-size: 12px; }
        .mc__val { font-size: clamp(1rem, 1.1vw + 1rem, 1.45rem); font-weight: 800; line-height: 1.15; }
        .mc__meta { color: var(--mc-muted); font-size: 12px; }
        .mc__muted { color: var(--mc-muted); font-weight: 600; font-size: 12px; }

        .mc__rationale {
          margin-top: 10px; padding: 8px 10px;
          color: var(--mc-muted); font-size: 11.5px; line-height: 1.35;
          border-top: 1px dashed var(--mc-grid);
          border-bottom: 1px dashed var(--mc-grid);
        }
        .mc__sources {
          display: flex; gap: 12px; flex-wrap: wrap;
          margin-top: 10px; padding: 8px 10px;
          border-top: 1px solid var(--mc-grid);
        }
        .mc__sources a {
          color: var(--mc-muted);
          text-decoration: underline;
          text-underline-offset: 2px;
          font-size: 11px;
        }

        /* Notes */
        .mc__scaleNote { fill: var(--mc-muted); font-size: 11px; text-anchor: middle; }

        /* Responsive */
        @media (min-width: 720px) {
          .mc__calloutInner { grid-template-columns: repeat(3, 1fr); }
          .mc__tile + .mc__tile { border-left: 1px solid var(--mc-grid); padding-left: 18px; }
        }
        @media (max-width: 719.98px) {
          .mc__tile + .mc__tile { border-top: 1px solid var(--mc-grid); padding-top: 12px; }
        }
        @media (max-width: 560px) {
          .mc__barlabelText { font-size: 11px; }
          .mc__xlabel, .mc__xhoriz { font-size: 11px; }
          .mc__ytick { font-size: 10px; }
          .mc__axisLabel--left { transform: translateY(-8px); }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .mc__svg * { transition: none !important; animation: none !important; }
        }
      `}</style>
    </div>
  );
}
