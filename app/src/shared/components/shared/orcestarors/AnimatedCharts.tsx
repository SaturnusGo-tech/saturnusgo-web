'use client';

import { useEffect, useRef, useState } from 'react';

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, set] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { set(true); io.disconnect(); } }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

export default function AnimatedCharts() {
  const { ref, inView } = useInView(0.3);

  // Bar chart data (TAM/SAM/SOM)
  const bars = [
    { label: 'TAM', value: 2100, note: 'Global mobility + travel ($B)' },
    { label: 'SAM', value: 185,  note: 'Emerging markets ($B)' },
    { label: 'SOM (Yr3)', value: 110, note: '3 beachheads ($M ARR)' },
  ];

  // Line chart — simple 3-yr plan (ARR in $M)
  const plan = [
    { year: 'Y1', v: 12 },
    { year: 'Y2', v: 48 },
    { year: 'Y3', v: 110 },
  ];

  return (
    <div ref={ref} className="charts">
      {/* Bars */}
      <div className="chart chart--bars">
        <div className="chart__title">Market size</div>
        <div className="bars">
          {bars.map((b, i) => {
            const h = inView ? Math.max(6, Math.log(b.value) * 28) : 0; // лог-шкала для контраста
            return (
              <div className="bar" key={b.label}>
                <div className="bar__col" style={{ height: h }}>
                  <span className="bar__val">{b.label}</span>
                </div>
                <div className="bar__meta">
                  <div className="bar__label">{b.label}</div>
                  <div className="bar__note">{b.note}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Line/projection */}
      <div className="chart chart--line">
        <div className="chart__title">3-year projection (ARR)</div>
        <svg viewBox="0 0 300 160" className={`line ${inView ? 'line--in' : ''}`}>
          {/* grid */}
          <g stroke="currentColor" opacity="0.15" strokeWidth="0.5">
            <line x1="0" y1="140" x2="300" y2="140" />
            <line x1="0" y1="100" x2="300" y2="100" />
            <line x1="0" y1="60" x2="300" y2="60" />
            <line x1="0" y1="20" x2="300" y2="20" />
          </g>
          {/* path */}
          {(() => {
            const max = 110;
            const pts = plan.map((p, i) => {
              const x = 30 + i * 120;
              const y = 140 - (p.v / max) * 120;
              return { x, y };
            });
            const d = `M ${pts[0].x},${pts[0].y} L ${pts[1].x},${pts[1].y} L ${pts[2].x},${pts[2].y}`;
            return (
              <>
                <path d={d} className="line__path" />
                {pts.map((p, i) => (
                  <g key={i} className="line__pt" transform={`translate(${p.x},${p.y})`}>
                    <circle r="3" />
                    <text y="-8" className="line__label">{plan[i].year} • ${plan[i].v}M</text>
                  </g>
                ))}
              </>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
