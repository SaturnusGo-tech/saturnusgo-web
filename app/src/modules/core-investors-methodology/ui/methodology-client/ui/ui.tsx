'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { computeMethodology, fmMoney, Horizon } from '../../../services/methodology-calculator';

/**
 * Ultra-modern investor view, 2025.
 * - Clean grid, glass surfaces, subtle depth.
 * - Smooth, deterministic animations that reset on horizon change.
 * - No hover; keyboard accessible.
 */

export default function MethodologyClient({ initialH = '3' as Horizon }) {
  const [h, setH] = useState<Horizon>(initialH);
  const sp = useSearchParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const tone: 'light' | 'dark' = resolvedTheme === 'light' ? 'light' : 'dark';

  // Sync ?h=
  useEffect(() => {
    const qs = new URLSearchParams(Array.from(sp.entries()));
    qs.set('h', h);
    router.replace(`?${qs.toString()}`, { scroll: false });
  }, [h, router, sp]);

  // Compute all numbers (separate module)
  const data = useMemo(() => computeMethodology(h), [h]);

  // — Segmented control thumb metrics
  const segRef = useRef<HTMLDivElement | null>(null);
  const [thumb, setThumb] = useState({ w: 0, x: 0 });

  useEffect(() => {
    const root = segRef.current;
    if (!root) return;
    const btns = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const idx = ['3','5','10'].indexOf(h);
    const el = btns[idx];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pr = root.getBoundingClientRect();
    setThumb({ w: r.width, x: r.left - pr.left });
  }, [h]);

  // Re-mount key to reset animations on horizon change (for bars & ring)
  const animKey = `h-${h}`;

  // Content blocks
  const inputsBlock = [
    { k: 'Users (active, Y3)', v: '2,500,000' },
    { k: 'ARPU (annual, net, Y3)', v: '$74.8' },
    { k: 'Users cap (max bound)', v: '20,000,000' },
  ];
  const baselineBlock = [
    { k: 'TOTAL revenue (ARR, Y3)', v: '$187M' },
    { k: 'Ride revenue (ARR, Y3)',  v: fmMoney(data.rideUSD) },        // equals $143.4M at 3y
    { k: 'Non-ride revenue (ARR, Y3)', v: '$43.6M' },
  ];
  const targetsBlock = [
    { k: 'TOTAL (h)', v: fmMoney(data.totalUSD) },
    { k: 'Ride (h)',  v: fmMoney(data.rideUSD) },
    { k: 'Non-ride (h)', v: fmMoney(data.nonRideUSD) },
    { k: 'Non-ride share (h)', v: `${data.nonRidePct} of TOTAL` },
  ];

  return (
    <main className="md-root" data-tone={tone}>
      <div className="md-shell">
        {/* HERO */}
        <section className="md-hero">
          <div className="md-hero-top">
            <h1 className="md-h1">Methodology</h1>
            <div
              className="md-toggle"
              role="tablist"
              aria-label="Horizon"
              ref={segRef}
              style={{ ['--thumb-w' as any]: `${thumb.w}px`, ['--thumb-x' as any]: `${thumb.x}px` }}
            >
              <div className="md-toggle-thumb" aria-hidden="true" />
              {(['3','5','10'] as Horizon[]).map(opt => (
                <button
                  key={opt}
                  type="button"
                  role="tab"
                  aria-selected={opt === h}
                  className="md-toggle-btn"
                  onClick={() => setH(opt)}
                >
                  {opt}y
                </button>
              ))}
            </div>
          </div>
          <p className="md-lead">
            Явная математика без чёрных ящиков. <span className="mono">Users × ARPU<sub>net</sub> × TakeRate</span> → TOTAL → Non-ride share → Streams. Всё прозрачно и проверяемо.
          </p>
          <div className="md-divider" />
        </section>

        {/* QUICK STATS */}
        <section className="md-section">
          <div className="md-grid-3">
            <div className="md-card">
              <h3>Targets (by horizon)</h3>
              <ul className="md-kv">
                {targetsBlock.map(r => (
                  <li key={r.k}><span className="k">{r.k}</span><span className="v">{r.v}</span></li>
                ))}
              </ul>
            </div>

            <div className="md-card">
              <h3>Baseline (Y3)</h3>
              <ul className="md-kv">
                {baselineBlock.map(r => (
                  <li key={r.k}><span className="k">{r.k}</span><span className="v">{r.v}</span></li>
                ))}
              </ul>
            </div>

            <div className="md-card">
              <h3>Inputs</h3>
              <ul className="md-kv">
                {inputsBlock.map(r => (
                  <li key={r.k}><span className="k">{r.k}</span><span className="v">{r.v}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* COMPOSITION */}
        <section className="md-section">
          <div className="md-card">
            <div className="md-comp" key={animKey}>
              <div className="md-comp-bar" aria-label="Composition bar">
                <div className="seg ride" style={{ width: data.ridePct }} />
                <div className="seg nonride" style={{ width: data.nonRidePct }} />
              </div>

              <div className="md-ring" aria-label="Non-ride ring chart">
                <svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label={`Non-ride ${data.nonRidePct}`}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--acc-start)" />
                      <stop offset="100%" stopColor="var(--acc-end)" />
                    </linearGradient>
                  </defs>
                  <g transform="translate(42,42)">
                    {/** ring */}
                    <circle r="34" fill="none" stroke="var(--md-fill-2)" strokeWidth="12" />
                    {/* ride track */}
                    <circle
                      r="34"
                      fill="none"
                      stroke="var(--ride)"
                      strokeWidth="12"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={0}
                      opacity="0.35"
                    />
                    {/* non-ride arc */}
                    <circle
                      r="34"
                      fill="none"
                      stroke="url(#g1)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${(data.nonRideShare) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
                      strokeDashoffset="0"
                      transform="rotate(-90)"
                    >
                      <animate
                        attributeName="stroke-dasharray"
                        dur="700ms"
                        fill="freeze"
                        from={`0 ${2 * Math.PI * 34}`}
                        to={`${(data.nonRideShare) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
                      />
                    </circle>
                  </g>
                </svg>

                <div className="meta">
                  <div>Ride {data.ridePct} — <b>{fmMoney(data.rideUSD)}</b></div>
                  <div>Non-ride {data.nonRidePct} — <b>{fmMoney(data.nonRideUSD)}</b></div>
                  <div className="item total" style={{ marginTop: 4 }}>TOTAL — <b>{fmMoney(data.totalUSD)}</b></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FORMULAS */}
        <section className="md-section">
          <div className="md-card">
            <h3>Formulas</h3>
            <div className="md-eq-grid">
              <div className="md-eq">
                <span className="k">E1 — TOTAL SOM(h)</span>
                <code>Users(h) × ARPU_net(h) × TakeRate = TOTAL(h)</code>
                <div className="note">ARPU указана как net ⇒ <b>TakeRate = 1</b>.</div>
              </div>
              <div className="md-eq">
                <span className="k">E2 — Non-ride(h)</span>
                <code>NonRide(h) = share(h) × TOTAL(h)</code>
                <div className="note">share(3y)=23.3%, 5y=35%, 10y=40%.</div>
              </div>
              <div className="md-eq">
                <span className="k">E3 — Ride(h)</span>
                <code>Ride(h) = TOTAL(h) − NonRide(h)</code>
              </div>
              <div className="md-eq">
                <span className="k">E4 — Streams scaling</span>
                <code>k(h) = NonRide(h) / NonRide(3y)</code>
                <div className="note">Каждый Y3-стрим умножаем на k(h).</div>
              </div>
              <div className="md-eq">
                <span className="k">E5 — Baseline lock</span>
                <code>h = 3y ⇒ TOTAL=$187M; NonRide=$43.6M</code>
              </div>
              <div className="md-eq">
                <span className="k">E6 — Users cap</span>
                <code>Users(h) ≤ UsersCap</code>
                <div className="note">Сейф-ограничение (по умолчанию 20M) для реализма.</div>
              </div>
            </div>
          </div>
        </section>

        {/* STREAMS */}
        <section className="md-section">
          <div className="md-card">
            <div style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
              <h3>Non-ride streams (scaled for {h}y)</h3>
              <p className="md-lead" style={{ fontSize: 13, margin: 0 }}>
                Σ(streams) сверяется с Non-ride(h). Y3 — baseline; 5y/10y — масштаб по k(h).
              </p>
            </div>

            <div className="md-grid-4" key={animKey}>
              {data.streamsM.map(s => (
                <div className="md-card md-stream" key={s.id}>
                  <div className="hdr">
                    <span className="t">{s.label}</span>
                    <span className="mono">Y3 anchor × k(h)</span>
                  </div>
                  <div className="val">
                    ${s.vM.toLocaleString('en-US', { maximumFractionDigits: 1 })}M
                  </div>
                  <div className="note">
                    {h === '3' ? 'Y3 baseline' : `Scaled ×${(data.nonRideM / 43.6).toFixed(2)}`}
                  </div>
                </div>
              ))}
            </div>

            <div className="md-audit">
              <div>Σ(streams) = <b>${data.sumStreamsM.toFixed(1)}M</b></div>
              <div>Non-ride(h) = <b>${data.nonRideM.toFixed(1)}M</b></div>
              <div>Δ = <b>{data.deltaStreamsM === 0 ? '0.0M' : `${data.deltaStreamsM.toFixed(1)}M`}</b></div>
            </div>
          </div>
        </section>

        {/* SOURCES */}
        <section className="md-section">
          <div className="md-card">
            <h3>Where numbers come from</h3>
            <ul className="md-kv">
              <li><span className="k">Targets (TOTAL)</span><span className="v">5y: $400M; 10y: $1B (фиксированные цели)</span></li>
              <li><span className="k">Shares</span><span className="v">share(3y)=23.3% (из baseline), 5y=35%, 10y=40%</span></li>
              <li><span className="k">Baseline Y3</span><span className="v">TOTAL $187M = Ride $143.4M + Non-ride $43.6M</span></li>
              <li><span className="k">ARPU</span><span className="v">Annual, <b>net</b> ⇒ TakeRate = 1</span></li>
              <li><span className="k">Users cap</span><span className="v">Предохранитель (по умолчанию 20M). Можно вывести из SAM/ARPU (подключу при необходимости).</span></li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
