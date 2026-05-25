// app/partners/components/SummaryComponent.tsx

import { Partner } from "../_data/schema";

type Props = { data: Partner[] };

export function SummaryComponent({ data }: Props) {
  const total = data.length;
  const byCategory = data.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section
      aria-label="Summary"
      className="sg-card grid grid-cols-1 gap-4 md:grid-cols-3"
    >
      <div className="sg-stat">
        <div className="sg-stat-title">Total partners</div>
        <div className="sg-stat-value">{total}</div>
      </div>

      <div className="sg-stat md:col-span-2">
        <div className="sg-stat-title">By category</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(byCategory).map(([cat, n]) => (
            <span
              key={cat}
              className="sg-chip"
              aria-label={`${cat}: ${n}`}
              title={`${cat}: ${n}`}
            >
              {cat} · {n}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
