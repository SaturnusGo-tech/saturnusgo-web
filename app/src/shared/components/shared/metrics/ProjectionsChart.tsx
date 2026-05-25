// components/shared/metrics/ProjectionsTable.tsx
'use client';

import { useMemo, useState } from 'react';

/** All amounts in USD; shares 0..1 */
type YearKey = string;
type Assumptions = {
  years: YearKey[];          // e.g. ['Y0','Y1','Y2','Y3']
  MAU: number[];
  Rides:  { activeRate: number[]; tripsPerMonth: number[]; avgFare: number[]; takeRate: number[]; };
  Hotels: { bookersConv: number[]; nightsPerBooker: number[]; ADR: number[]; netTake: number[]; };
  Subs:   { payingSubs: number[]; arpu: number[]; }; // $/mo
  B2B:    { merchants: number[]; arpu: number[]; };  // $/mo
};

type Props = {
  assumptions?: Assumptions;           // if omitted → pre-launch (no numbers)
  className?: string;
  /** Force mode if needed; by default it’s derived from presence of assumptions */
  mode?: 'auto' | 'prelaunch' | 'data';
};

export default function ProjectionsTable({ assumptions, className = '', mode = 'auto' }: Props) {
  const hasData = !!assumptions?.years?.length;
  const effective = mode === 'auto' ? (hasData ? 'data' : 'prelaunch') : mode;

  return (
    <section className={`proj ${className}`} aria-label="Revenue model">
      <header className="head">
        <h3>Revenue model</h3>
        <p className="subtitle">
          Clean table for investors. Single accent. No visuals unless numbers exist.
        </p>
      </header>

      {effective === 'prelaunch' ? <PrelaunchLite /> : <DataLite assumptions={assumptions!} />}

      <style jsx>{`
        .proj {
          --fg: var(--fg, hsl(0 0% 95%));
          --muted: var(--muted, hsl(0 0% 75% / .8));
          --stroke: var(--stroke, hsl(0 0% 100% / .10));
          --row: hsl(0 0% 100% / .02);
          --row-odd: hsl(0 0% 100% / .015);
          --row-hover: hsl(0 0% 100% / .045);
          --accent: var(--accent, #7c74ff); /* single accent */
          color: var(--fg);
          display: grid;
          gap: 10px;
        }
        .head { display: grid; gap: 4px; }
        .head h3 { margin: 0; font-size: clamp(16px, 1.2vw + 12px, 18px); font-weight: 800; letter-spacing: -0.01em; }
        .subtitle { margin: 0; font-size: 12.5px; color: var(--muted); }

        /* shared table chrome */
        .wrap {
          border: 1px solid var(--stroke);
          border-radius: 14px;
          overflow: hidden;
          background: linear-gradient(180deg, hsl(0 0% 100% / .03), hsl(0 0% 100% / .015));
        }
        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 13px;
        }
        thead th {
          position: sticky; top: 0; z-index: 1;
          text-transform: uppercase;
          letter-spacing: .06em;
          font-weight: 800;
          text-align: left;
          color: var(--muted);
          padding: 12px 14px;
          background: linear-gradient(180deg, hsl(0 0% 100% / .06), hsl(0 0% 100% / .02));
          border-bottom: 1px solid var(--stroke);
        }
        tbody th, tbody td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--stroke);
          background: var(--row);
          vertical-align: middle;
        }
        tbody tr:nth-child(odd) th,
        tbody tr:nth-child(odd) td { background: var(--row-odd); }
        tbody tr:hover th,
        tbody tr:hover td { background: var(--row-hover); }
      `}</style>
    </section>
  );
}

/* ======================= PRE-LAUNCH (no numbers) ======================= */

function PrelaunchLite() {
  const rows = [
    {
      stream: 'Rides',
      formula: 'ARR = MAU × Active × Trips/mo × 12 × Avg fare × Take',
      inputs: 'MAU; Active %; Trips per month; Avg fare ($); Take rate',
    },
    {
      stream: 'Hotels',
      formula: 'ARR = MAU × Bookers × Nights × ADR × Net take',
      inputs: 'MAU; Bookers %; Nights per year; ADR ($); Net take',
    },
    {
      stream: 'Subs',
      formula: 'ARR = Paying subs × ARPU × 12',
      inputs: 'Paying subs; ARPU ($/mo)',
    },
    {
      stream: 'B2B',
      formula: 'ARR = Merchants × ARPU × 12',
      inputs: 'Active merchants; ARPU ($/mo)',
    },
  ];

  return (
    <div className="wrap" role="region" aria-label="Pre-launch assumptions required">
      <table>
        <colgroup>
          <col style={{ width: '14ch' }} />
          <col />
          <col />
          <col style={{ width: '16ch' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Stream</th>
            <th>Formula</th>
            <th>Inputs to collect</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.stream}>
              <th scope="row" style={{ fontWeight: 800 }}>{r.stream}</th>
              <td>{r.formula}</td>
              <td style={{ color: 'var(--muted)' }}>{r.inputs}</td>
              <td><span className="status">Pre-launch</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="note">
        When inputs are ready (actual Y0 + Y1–Y3 assumptions), this block automatically renders the numeric table.
      </p>

      <style jsx>{`
        .note { margin: 8px 12px 12px; font-size: 11.5px; color: var(--muted); text-align: right; }
        .status {
          display: inline-block;
          font-weight: 800;
          letter-spacing: .06em;
          font-size: 11px;
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}

/* ======================= DATA (numbers, minimal) ======================= */

function DataLite({ assumptions }: { assumptions: Assumptions }) {
  const A = assumptions;

  const rows = useMemo(() => {
    return A.years.map((year, i) => {
      const rides  = A.MAU[i] * A.Rides.activeRate[i] * A.Rides.tripsPerMonth[i] * 12 * A.Rides.avgFare[i] * A.Rides.takeRate[i] / 1e6;
      const hotels = A.MAU[i] * A.Hotels.bookersConv[i] * A.Hotels.nightsPerBooker[i] * A.Hotels.ADR[i] * A.Hotels.netTake[i] / 1e6;
      const subs   = A.Subs.payingSubs[i] * A.Subs.arpu[i] * 12 / 1e6;
      const b2b    = A.B2B.merchants[i] * A.B2B.arpu[i] * 12 / 1e6;
      const total  = rides + hotels + subs + b2b;
      const prev   = i === 0 ? null :
        (A.MAU[i-1] * A.Rides.activeRate[i-1] * A.Rides.tripsPerMonth[i-1] * 12 * A.Rides.avgFare[i-1] * A.Rides.takeRate[i-1] / 1e6) +
        (A.MAU[i-1] * A.Hotels.bookersConv[i-1] * A.Hotels.nightsPerBooker[i-1] * A.Hotels.ADR[i-1] * A.Hotels.netTake[i-1] / 1e6) +
        (A.Subs.payingSubs[i-1] * A.Subs.arpu[i-1] * 12 / 1e6) +
        (A.B2B.merchants[i-1] * A.B2B.arpu[i-1] * 12 / 1e6);
      const yoy = prev ? (total - prev) / prev : null;
      return { year, rides, hotels, subs, b2b, total, yoy, i };
    });
  }, [A]);

  const colMax = useMemo(() => ({
    rides:  Math.max(...rows.map(r => r.rides))  || 1,
    hotels: Math.max(...rows.map(r => r.hotels)) || 1,
    subs:   Math.max(...rows.map(r => r.subs))   || 1,
    b2b:    Math.max(...rows.map(r => r.b2b))    || 1,
    total:  Math.max(...rows.map(r => r.total))  || 1,
  }), [rows]);

  return (
    <div className="wrap" role="region" aria-label="Revenue projections">
      <table>
        <colgroup>
          <col style={{ width: '10ch' }} />
          <col style={{ width: '16ch' }} />
          <col style={{ width: '16ch' }} />
          <col style={{ width: '16ch' }} />
          <col style={{ width: '16ch' }} />
          <col style={{ width: '18ch' }} />
          <col style={{ width: '10ch' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Year</th>
            <th>Rides</th>
            <th>Hotels</th>
            <th>Subs</th>
            <th>B2B</th>
            <th>Total</th>
            <th>YoY</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.year}>
              <th scope="row">{r.year}</th>
              <NumCell label="Rides"  value={r.rides}  max={colMax.rides}  formula="ARR = MAU × Active × Trips/mo × 12 × Avg fare × Take" />
              <NumCell label="Hotels" value={r.hotels} max={colMax.hotels} formula="ARR = MAU × Bookers × Nights × ADR × Net take" />
              <NumCell label="Subs"   value={r.subs}   max={colMax.subs}   formula="ARR = Paying subs × ARPU × 12" />
              <NumCell label="B2B"    value={r.b2b}    max={colMax.b2b}    formula="ARR = Merchants × ARPU × 12" />
              <NumCell label="Total"  value={r.total}  max={colMax.total}  total />
              <td className="yoy">{r.yoy == null ? '—' : `${Math.round(r.yoy*100)}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .yoy { text-align: right; font-weight: 700; }
      `}</style>
    </div>
  );
}

/* ====== minimal numeric cell with subtle in-cell bar and tiny tooltip ====== */

function NumCell({
  label, value, max, total, formula,
}: {
  label: string;
  value: number;
  max: number;
  total?: boolean;
  formula?: string;
}) {
  const [open, setOpen] = useState(false);
  const w = `${(value / (max || 1)) * 100}%`;
  const fmt = (n: number) => `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(n)}M`;

  return (
    <td className={`num ${total ? 'total' : ''}`}>
      <span className="bar" style={{ ['--w' as any]: w }} aria-hidden />
      <button
        type="button"
        className="val"
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        aria-label={`${label} ${fmt(value)}`}
      >
        {fmt(value)}
      </button>

      {open && formula && (
        <div className="tip" role="tooltip">
          {formula}
        </div>
      )}

      <style jsx>{`
        .num { position: relative; text-align: right; font-variant-numeric: tabular-nums; }
        .val {
          position: relative; z-index: 1;
          font-weight: 700; letter-spacing: -0.01em;
          background: none; border: 0; color: inherit; cursor: help;
          padding: 0;
        }
        .bar {
          position: absolute; inset: 6px 6px 6px 6px;
          width: var(--w); max-width: calc(100% - 12px);
          border-radius: 8px;
          background: linear-gradient(90deg, color-mix(in oklab, var(--accent) 18%, transparent), transparent 85%);
          pointer-events: none;
        }
        .num.total .bar {
          background: linear-gradient(90deg, color-mix(in oklab, var(--accent) 26%, transparent), transparent 85%);
        }
        .tip {
          position: absolute;
          right: 8px; top: 6px;
          transform: translateY(-100%);
          background: rgba(20,20,26,.96);
          color: var(--fg);
          border: 1px solid var(--stroke);
          border-radius: 8px;
          padding: 6px 8px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 2;
        }
      `}</style>
    </td>
  );
}
