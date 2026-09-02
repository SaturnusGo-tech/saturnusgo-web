type TooltipEntry = {
  color?: string;
  dataKey?: string | number;
  name?: string | number;
  value?: string | number;
};

export function DashboardChartTooltip({
  active,
  label,
  payload,
  formatLabel,
  formatValue,
}: {
  active?: boolean;
  label?: string | number;
  payload?: readonly TooltipEntry[];
  formatLabel?: (value: string | number) => string;
  formatValue?: (value: string | number, entry: TooltipEntry) => string;
}) {
  if (!active || !payload?.length) return null;
  const visible = payload.filter((entry) => entry.value !== undefined && entry.value !== null);
  if (!visible.length) return null;

  return <div className={surface.chartTooltip} role="status">
    {label !== undefined && <strong>{formatLabel ? formatLabel(label) : label}</strong>}
    {visible.map((entry, index) => <span className={surface.chartTooltipRow} key={`${entry.dataKey ?? entry.name ?? "value"}-${index}`}>
      <i style={{ background: entry.color }} aria-hidden="true" />
      <b>{entry.name}</b>
      <em>{formatValue ? formatValue(entry.value!, entry) : entry.value}</em>
    </span>)}
  </div>;
}
import surface from "../dashboard.module.css";
