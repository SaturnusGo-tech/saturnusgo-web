// components/Stat.tsx
export default function Stat({
    value,
    label
  }: {
    value: string;
    label: string;
  }) {
    return (
      <div className="stat">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    );
  }
  