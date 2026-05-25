"use client";

// core-investors market chart streams
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useMemo, useRef, useState } from 'react';

type BarKey = 'TAM' | 'SAM' | 'SOM';
type Bar = { key: BarKey; label: string; valPctOfTAM: number };
type TextPosition = 'above' | 'below';

type MarketScope = 'ride-hailing' | 'shared-mobility' | 'smart-mobility' | 'custom';
type SamMetric = 'GMV' | 'OperatorRevenue';
type SourceLink = { label: string; href: string };

type LineSeries = {
  id: string;
  label: string;
  valuesM: number[];
  color?: string;
  dashed?: boolean;
};

export type MarketChartStreamsProps = {
  className?: string;
  offsetTop?: number;
  showText?: boolean;
  textPosition?: TextPosition;
  title?: string;

  leftMaxPct?: number;
  rightMaxM?: number;

  somScale?: number;
  showSomScaleNote?: boolean;

  rightAxisLabel?: string;

  lines?: LineSeries[];

  marketUSD?: {
    TAM: number;
    TAMYear?: string;
    SAM: number;
    SAMYear?: string;
    SOM?: number;
  };

  callout?: {
    somUsersM?: number;
    arpuUSD?: number;
    penetrationPct?: number;
  };

  marketScope?: MarketScope;
  samMetric?: SamMetric;
  takeRate?: number;

  sources?: SourceLink[];
  somShareOfSAM?: number;
  rationale?: string;

  /** Управление подписями точек */
  showAllPointTags?: boolean;
  tagSeparationPx?: number;
  tagSeriesXJitterPx?: number;

  /** НОВОЕ: куда ставить финальные метки серий */
  endLabelMode?: 'inline' | 'outside';
  endLabelWidth?: number;     // ширина колонки справа под метки
  endLabelMinGap?: number;    // мин. вертикальный зазор между метками

  liftSamChip?: boolean;
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

function buildDefaultArrTargets(finalM: number): number[] {
  const y0 = Math.max(5, Math.round(finalM * 0.10));
  const y1 = Math.max(y0 + 1, Math.round(finalM * 0.35));
  const y2 = Math.max(y1 + 1, Math.round(finalM * 0.65));
  const y3 = Math.round(finalM);
  return [y0, y1, y2, y3];
}

const DEFAULT_MARKET = {
  TAM: 1.7e12,
  TAMYear: 'Selected',
  SAM: 1.0514e11,
  SAMYear: 'Selected',
  SOM: 4.36e7,
};

const SERIES_COLORS = ['#7C74FF', '#00C2A0', '#FF6B6B', '#F5B400', '#36A2EB'];

/** простой резолвер вертикальных коллизий для меток */
function resolveYPositions(
  desired: number[],
  minGap: number,
  yMin: number,
  yMax: number
) {
  // индексы по возрастанию желаемых y
  const idx = desired.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  const y: number[] = Array(desired.length);
  // вперёд — гарантируем minGap
  let prev = -Infinity;
  for (const it of idx) {
    const target = Math.max(it.y, prev + minGap, yMin);
    y[it.i] = target;
    prev = target;
  }
  // если последний вылез ниже yMax — поднимаем весь пакет
  const overflow = y[idx[idx.length - 1].i] - yMax;
  if (overflow > 0) {
    for (let k = 0; k < y.length; k++) y[k] -= overflow;
  }
  // назад — ещё раз следим за minGap и верхней границей
  for (let p = idx.length - 2; p >= 0; p--) {
    const curI = idx[p].i;
    const nextI = idx[p + 1].i;
    y[curI] = Math.min(y[curI], y[nextI] - minGap);
    if (y[curI] < yMin) {
      const delta = yMin - y[curI];
      for (let k = 0; k <= p; k++) y[idx[k].i] += delta;
      break;
    }
  }
  return y;
}

export default function MarketChartStreams({
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

  lines,

  marketUSD,
  callout,
  marketScope = 'custom',
  samMetric = 'OperatorRevenue',
  takeRate,
  sources = [],
  somShareOfSAM,
  rationale,

  showAllPointTags = false,
  tagSeparationPx = 16,
  tagSeriesXJitterPx = 12,

  endLabelMode = 'outside',
  endLabelWidth = 180,
  endLabelMinGap = 22,
  liftSamChip = true,
}: MarketChartStreamsProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [inView, setInView] = useState(false);
  const [w, setW] = useState(920);
  const [h, setH] = useState(380);
  const { resolvedTheme } = useTheme();
    const tone = resolvedTheme === 'light' ? 'light' : 'dark';
  useEffect(() => {
    const el = wrapRef.current!;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);

    const ro = new ResizeObserver(([entry]) => {
      const cw = Math.max(300, Math.floor(entry.contentRect.width));
      const isMob = cw <= 560;
      const ratio = isMob ? (320 / 920) : (380 / 920);
      setW(cw);
      setH(Math.round(cw * ratio));
    });
    ro.observe(el);

    return () => { io.disconnect(); ro.disconnect(); };
  }, []);

  const isMobile = w <= 560;

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

  const SOM_VALUE = useMemo(() => {
    if (typeof somShareOfSAM === 'number' && isFinite(somShareOfSAM) && somShareOfSAM > 0) {
      return MARKET.SAM * somShareOfSAM;
    }
    return MARKET.SOM;
  }, [somShareOfSAM, MARKET.SAM, MARKET.SOM]);

  const SERIES = useMemo<LineSeries[]>(() => {
    if (lines?.length) return lines.map((s, i) => ({ ...s, color: s.color ?? SERIES_COLORS[i % SERIES_COLORS.length] }));
    const finalM = Math.max(1, Math.round((SOM_VALUE || 1) / 1e6));
    return [{ id: 'total', label: rightAxisLabel.replace('Right: ', ''), valuesM: buildDefaultArrTargets(finalM), color: SERIES_COLORS[0] }];
  }, [lines, SOM_VALUE, rightAxisLabel]);

  // сортируем «снизу-вверх» по последней точке, чтобы верхние рисовались поверх
  const SERIES_DRAWN = useMemo(() => {
    const lastIdx = Math.max(0, Math.min(...SERIES.map(s => s.valuesM.length)) - 1);
    return [...SERIES].sort((a, b) => (a.valuesM[lastIdx] ?? 0) - (b.valuesM[lastIdx] ?? 0));
  }, [SERIES]);

  const numPoints = useMemo(() => {
    const lens = SERIES.map(s => s.valuesM.length).filter(n => n > 0);
    return lens.length ? Math.min(...lens) : 0;
  }, [SERIES]);

  const computedRightMax = useMemo(() => {
    const maxVal = SERIES.reduce((mx, s) => Math.max(mx, Math.max(...s.valuesM.slice(0, numPoints))), 0);
    return maxVal * 1.15 || 1;
  }, [SERIES, numPoints]);
  const RIGHT_MAX = rightMaxM ?? computedRightMax;

  const SAM_PCT_OF_TAM = (MARKET.SAM / MARKET.TAM) * 100;
  const SOM_PCT_OF_TAM = (SOM_VALUE / MARKET.TAM) * 100;
  const SOM_PCT_OF_SAM = MARKET.SAM > 0 ? (SOM_VALUE / MARKET.SAM) * 100 : 0;

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

  /* ---- геометрия ---- */
  const P_LEFT   = isMobile ? 36 : 48;
  const baseRight = isMobile ? 42 : 76;
  const rightLabelPad = endLabelMode === 'outside' ? (endLabelWidth + 12) : 0;
  const P_RIGHT  = baseRight + rightLabelPad;
  const P_TOP    = isMobile ? 38 : 48;
  const P_BOTTOM = isMobile ? 44 : 48;

  const chartW = Math.max(1, w - P_LEFT - P_RIGHT);
  const chartH = Math.max(1, h - P_TOP - P_BOTTOM);

  const barWBase = chartW / (bars.length * 2);
  const barW = Math.max(isMobile ? 26 : 34, barWBase);
  const barGap = barW;
  const xBar = (i: number) => P_LEFT + i * (barW + barGap) + barGap * 0.5;

  const yPct = (vPct: number) => P_TOP + chartH - (vPct / leftMaxPct) * chartH;
  const yM   = (vM: number)   => P_TOP + chartH - (vM / RIGHT_MAX)   * chartH;

  const years = useMemo(() => {
    const base = ['Y0', 'Y1', 'Y2', 'Y3'];
    if (numPoints === 0) return [];
    if (numPoints <= base.length) return base.slice(0, numPoints);
    return Array.from({ length: numPoints }, (_, i) => `Y${i}`);
  }, [numPoints]);

  const xLine = (i: number) => P_LEFT + (chartW / Math.max(1, numPoints - 1)) * i;
  const buildPath = (valsM: number[]) => valsM.slice(0, numPoints).map((v, i) => `${i ? 'L' : 'M'} ${xLine(i)} ${yM(v)}`).join(' ');

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const somPctTAMStr = `${SOM_PCT_OF_TAM.toFixed(3)}%`;
  const somPctSAMStr = MARKET.SAM > 0 ? `${SOM_PCT_OF_SAM.toFixed(2)}%` : '—';
  const samPctStr    = `${SAM_PCT_OF_TAM.toFixed(1)}%`;

  const somUsersM = callout?.somUsersM;
  const arpuUSD   = callout?.arpuUSD;
  const penetrationPct = callout?.penetrationPct;

  const AXIS_LABEL_Y = isMobile ? P_TOP - 20 : P_TOP - 26;
  const chipYOffset = (key: BarKey) => (key === 'TAM' ? (isMobile ? -16 : -22) : -12);

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

  // ранги по X для inline-меток (если понадобятся)
  const perIndexRankBySeries = useMemo(() => {
    const ranks: Array<Record<number, number>> = [];
    for (let i = 0; i < numPoints; i++) {
      const pairs = SERIES.map((s, si) => ({ si, y: yM(s.valuesM[i]) }));
      pairs.sort((a, b) => a.y - b.y);
      const map: Record<number, number> = {};
      pairs.forEach((p, rank) => { map[p.si] = rank; });
      ranks.push(map);
    }
    return ranks;
  }, [SERIES, numPoints, RIGHT_MAX, chartH]);

  /* ===== render ===== */
  return (
    <div
      ref={wrapRef}
      className={`mc ${className}`}
      data-tone={tone}
      style={{ marginTop: offsetTop }}
      aria-label="Multi-stream market chart (% of TAM on left, $M lines on right)"
    >
      {title ? <h2 className="mc__h2">{title}</h2> : null}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Bars: % of TAM/SAM/SOM; Lines: $M trajectories"
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

        {/* Сетка слева */}
        {[0, 25, 50, 75, 100].map((t) => (
          <g key={`pct-${t}`}>
            <line x1={P_LEFT} y1={yPct(t)} x2={w - P_RIGHT} y2={yPct(t)} className="mc__grid" />
            <text x={P_LEFT - 10} y={yPct(t)} className="mc__ytick">{t}%</text>
          </g>
        ))}

        {/* Бары */}
        {bars.map((b, i) => {
          const rawPct = b.valPctOfTAM;
          const visualPct = b.key === 'SOM' && somScale > 1
            ? Math.min(rawPct * somScale, leftMaxPct)
            : rawPct;

          const hBar = (visualPct / leftMaxPct) * chartH;
          const barY = P_TOP + chartH - hBar;

          const chipW = Math.max(64, Math.min(isMobile ? 120 : 220, Math.round(b.label.length * 7.2) + 20));

          return (
            <g key={b.key} transform={`translate(${xBar(i)}, ${barY})`}>
              <rect
                width={barW}
                height={inView ? hBar : 0}
                className="mc__bar"
                rx={8}
                style={{ transition: reduceMotion ? 'none' : 'height 700ms cubic-bezier(.2,.8,.2,1) 80ms' }}
              />

{!(liftSamChip && b.key === 'SAM') && (
  <g className="mc__barlabel" transform={`translate(${barW / 2}, ${chipYOffset(b.key)})`}>
    <rect className="mc__chip" x={-chipW / 2} y={-12} width={chipW} height={24} rx={10} />
    <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" className="mc__barlabelText">
      {b.label}
    </text>
  </g>
)}

              <text x={barW / 2} y={hBar + 18} className="mc__xlabel">{b.key}</text>

              {b.key === 'SOM' && somScale > 1 && showSomScaleNote && (
                <text x={barW / 2} y={hBar + 32} className="mc__scaleNote">scaled ×{somScale}</text>
              )}
              {b.key === 'SOM' && somScale > 1 && (
                <line
                  x1={0} x2={barW}
                  y1={chartH - (rawPct / leftMaxPct) * chartH}
                  y2={chartH - (rawPct / leftMaxPct) * chartH}
                  stroke="hsl(0 0% 100% / 0.35)"
                  strokeDasharray="2 3"
                />
              )}
            </g>
          );
        })}

        {/* Правая ось ($M) */}
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
          <text x={P_LEFT} y={AXIS_LABEL_Y} className="mc__axisLabel mc__axisLabel--left">Left: % of TAM ({scopePretty})</text>
          <text x={w - P_RIGHT} y={AXIS_LABEL_Y} className="mc__axisLabel" textAnchor="end">{rightAxisLabel}</text>
        </g>

        {/* ЛИНИИ */}
        {SERIES_DRAWN.map((s, si) => {
          const d = buildPath(s.valuesM);
          const stroke = s.color ?? SERIES_COLORS[si % SERIES_COLORS.length];
          return (
            <g key={s.id}>
              <path
                d={d}
                className="mc__line"
                stroke={stroke}
                filter={(!isMobile && !reduceMotion) ? 'url(#mcGlow)' : undefined}
                style={{
                  strokeDasharray: 1200,
                  strokeDashoffset: inView && !reduceMotion ? 0 : 1200,
                  transition: reduceMotion ? 'none' : `stroke-dashoffset 900ms ease ${150 + si * 90}ms`,
                  strokeWidth: 2,
                  fill: 'none',
                  opacity: 0.95
                }}
                strokeDasharray={s.dashed ? '6 4' : undefined}
              />
            </g>
          );
        })}

        {/* МЕТКИ К ТОЧКАМ */}
        {endLabelMode === 'inline' && SERIES.map((s, si) => {
          const stroke = s.color ?? SERIES_COLORS[si % SERIES_COLORS.length];
          return s.valuesM.slice(0, numPoints).map((v, i) => {
            const isLast = i === numPoints - 1;
            const show = isMobile ? isLast : (showAllPointTags ? true : isLast);
            if (!show) return null;
            const px = xLine(i);
            const py = yM(v);
            const rank = perIndexRankBySeries[i]?.[SERIES.indexOf(s)] ?? 0;
            const TAG_DY = -24 - rank * tagSeparationPx;
            const centerShift = (SERIES.length - 1) / 2;
            const seriesIndex = SERIES.indexOf(s);
            const TAG_DX = (seriesIndex - centerShift) * (tagSeriesXJitterPx ?? 0);
            const CHIP_W = Math.max(96, 12 * (s.label.length + String(v).length) / 2);
            const CHIP_H = 22;
            return (
              <g key={`${s.id}-inline-${i}`} transform={`translate(${px + TAG_DX}, ${py})`} className="mc__pointGroup">
                <circle r={inView && !reduceMotion ? 4 : 0} className="mc__point" fill={stroke} />
                <line x1={0} y1={-2} x2={18} y2={TAG_DY + 6} stroke={stroke} strokeWidth="1" opacity="0.75" />
                <g transform={`translate(18, ${TAG_DY})`} className="mc__tag">
                  <rect className="mc__chip" x={-CHIP_W / 2} y={-CHIP_H / 2} width={CHIP_W} height={CHIP_H} rx={10}
                        style={{ stroke: stroke, strokeOpacity: 0.5 }} />
                  <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" className="mc__tagText">
                    ${v}M • {s.label}
                  </text>
                </g>
              </g>
            );
          });
        })}

        {/* НОВОЕ: ВНЕШНЯЯ КОЛОНКА МЕТОК (без пересечений) */}
        {endLabelMode === 'outside' && (() => {
          const lastIdx = numPoints - 1;
          if (lastIdx < 0) return null;

          // желаемые y (из финальных точек)
          const desiredY = SERIES.map(s => yM(s.valuesM[lastIdx]));
          const yMin = P_TOP + 6;
          const yMax = P_TOP + chartH - 6;
          const placedY = resolveYPositions(desiredY, endLabelMinGap, yMin, yMax);

          const labelX = w - (endLabelWidth / 2) - 8; // центр колонки
          const leaderX0 = (i: number) => xLine(lastIdx); // точка на линии

          return (
            <g key="outside-labels">
              {SERIES.map((s, si) => {
                const stroke = s.color ?? SERIES_COLORS[si % SERIES_COLORS.length];
                const v = s.valuesM[lastIdx];
                const px = leaderX0(si);
                const py = desiredY[si];
                const ly = placedY[si];
                const CHIP_W = endLabelWidth;
                const CHIP_H = 22;

                return (
                  <g key={`out-${s.id}`}>
                    {/* точка и лидер */}
                    <circle cx={px} cy={py} r={inView && !reduceMotion ? 4 : 0} className="mc__point" fill={stroke} />
                    {/* небольшая ломаная: вправо и чуть вверх/вниз к метке */}
                    <path
                      d={`M ${px} ${py} L ${labelX - CHIP_W / 2 - 10} ${ly}`}
                      stroke={stroke}
                      strokeWidth="1.2"
                      fill="none"
                      opacity="0.85"
                    />
                    {/* метка */}
                    <g transform={`translate(${labelX}, ${ly})`} className="mc__tag">
                      <rect className="mc__chip" x={-CHIP_W / 2} y={-CHIP_H / 2} width={CHIP_W} height={CHIP_H} rx={10}
                            style={{ stroke: stroke, strokeOpacity: 0.55 }} />
                      <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" className="mc__tagText">
                        ${v}M • {s.label}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          );
        })()}

{/* SAM chip overlay — поверх линий, но с мягким подъёмом и ограничением */}
{liftSamChip && (() => {
  const samIdx = bars.findIndex(b => b.key === 'SAM');
  if (samIdx < 0 || numPoints === 0) return null;

  // Геометрия SAM бара
  const samRawPct = bars[samIdx].valPctOfTAM;
  const samH = (samRawPct / leftMaxPct) * chartH;
  const samBarTopY = P_TOP + chartH - samH;
  const samCenterX = xBar(samIdx) + barW / 2;

  // Интерполяция высоты линий в X позиции SAM
  const tRaw = (samCenterX - P_LEFT) / Math.max(1, chartW) * (numPoints - 1);
  const t = Math.max(0, Math.min(numPoints - 1, tRaw));
  const i0 = Math.floor(t);
  const i1 = Math.min(numPoints - 1, i0 + 1);
  const frac = t - i0;

  let maxLineM = 0;
  SERIES.forEach(s => {
    const v0 = s.valuesM[i0] ?? 0;
    const v1 = s.valuesM[i1] ?? v0;
    const vm = v0 + (v1 - v0) * frac;
    if (vm > maxLineM) maxLineM = vm;
  });

  const yHighestLine = yM(maxLineM);

  // ⚙️ Подстройки (сделал помягче)
  const SAFE_GAP = 6;                          // минимальный зазор над линией
  const LIFT_UP = isMobile ? -10 : -12;        // базовый подъём над баром
  const MAX_LIFT_UP = isMobile ? -18 : -20;    // максимум подъёма (чип не уйдёт выше этой отметки)

  const defaultChipY = samBarTopY + LIFT_UP;
  const needAboveLineY = yHighestLine - SAFE_GAP;
  // сначала поднимем ровно настолько, чтобы не задевать линию…
  const yAfterGap = Math.min(defaultChipY, needAboveLineY);
  // …но не выше «потолка» подъёма относительно верха бара
  const minYCap = samBarTopY + MAX_LIFT_UP;
  const chipY = Math.max(yAfterGap, minYCap);

  const samLabel = `${formatMoneyShort(MARKET.SAM)}${MARKET.SAMYear ? ` (${MARKET.SAMYear})` : ''}`;
  const chipW = Math.max(64, Math.min(isMobile ? 120 : 220, Math.round(samLabel.length * 7.2) + 20));

  return (
    <g key="sam-chip-overlay" className="mc__barlabel" transform={`translate(${samCenterX}, ${chipY})`}>
      <rect className="mc__chip" x={-chipW / 2} y={-12} width={chipW} height={24} rx={10} />
      <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" className="mc__barlabelText">
        {samLabel}
      </text>
    </g>
  );
})()}


        {/* Легенда (desktop) */}
        {!isMobile && (
          <g className="mc__legend" transform={`translate(${Math.max(P_LEFT, w - P_RIGHT - 300 - 10)}, ${P_TOP + 8})`}>
            <g transform="translate(0,0)">
              <rect width="12" height="12" rx="3" fill="url(#mcBarGrad)" />
              <text x="18" y="10" className="mc__legendText">Bars: % of TAM ({scopePretty})</text>
            </g>
            {SERIES.map((s, i) => (
              <g key={`lg-${s.id}`} transform={`translate(0, ${22 + i * 16})`}>
                <rect width="12" height="2" y="5" fill={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]} />
                <text x="18" y="10" className="mc__legendText">{s.label}</text>
              </g>
            ))}
          </g>
        )}

        {/* Подписи лет снизу */}
        <g aria-hidden="true">
          {years.map((y, i) => (
            <text key={y} x={xLine(i)} y={h - P_BOTTOM + 18} className="mc__xhoriz">{y}</text>
          ))}
        </g>
      </svg>

      {/* Легенда для мобилки */}
      {isMobile && (
        <div className="mc__legendInline" role="note" aria-label="Legend">
          <span className="mc__legendDot" aria-hidden /> Bars: % of TAM ({scopePretty})
          <span className="mc__legendSep" />
          {SERIES.map((s, i) => (
            <span key={`mbl-${s.id}`} className="mc__legendLineWrap">
              <span className="mc__legendLine" style={{ background: s.color ?? SERIES_COLORS[i % SERIES_COLORS.length] }} aria-hidden />
              <span className="mc__legendLbl">{s.label}</span>
            </span>
          ))}
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
                  {typeof arpuUSD === 'number' ? ` • $${arpuUSD} ARPU` : ''}
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
  /* === Tokens (dark default) === */
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

  /* === LIGHT overrides === */
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

  /* === Frame === */
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

  /* === Grid & axes === */
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

  /* === Labels & bars === */
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

  /* === Lines & points === */
  .mc__line { fill: none; }
  .mc__point { }
  .mc__tagText { fill: var(--mc-fg); font-size: 11px; font-weight: 700; }

  /* === Legend === */
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
  .mc__legendLineWrap { display: inline-flex; align-items: center; gap: 6px; margin-right: 10px; }
  .mc__legendLbl { color: var(--mc-muted); }
  .mc__legendSep { width: 8px; height: 1px; background: var(--mc-grid); display: inline-block; margin: 0 2px; }

  /* === Callout === */
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

  /* === Responsive === */
  @media (min-width: 720px) {
    .mc__calloutInner { grid-template-columns: repeat(3, 1fr); }
    .mc__tile + .mc__tile { border-left: 1px solid var(--mc-grid); padding-left: 18px; }
  }
  @media (max-width: 719.98px) {
    .mc__tile + .mc__tile { border-top: 1px solid var(--mc-grid); padding-top: 12px; }
  }
  @media (max-width: 560px) {
    .mc__axisLabel--left { transform: translateY(-8px); }
    .mc__barlabelText { font-size: 11px; }
    .mc__xlabel, .mc__xhoriz { font-size: 11px; }
    .mc__ytick { font-size: 10px; }
  }

  /* === Reduced motion === */
  @media (prefers-reduced-motion: reduce) {
    .mc__svg * { transition: none !important; animation: none !important; }
  }
`}</style>

    </div>
  );
}
