import type { SelfProfileActivity } from "../profile-model";

type Point = SelfProfileActivity["series"][number];
export function profileCalendar(year: number, series: readonly Point[], today: string) {
  const start = new Date(Date.UTC(year, 0, 1));
  const count = (Date.UTC(year + 1, 0, 1) - start.getTime()) / 86_400_000;
  const points = new Map(series.map(point => [point.date, point]));
  const days = Array.from({ length: count }, (_, index) => {
    const date = new Date(start.getTime() + index * 86_400_000).toISOString().slice(0, 10);
    const point = points.get(date) ?? { date, authoredCases: 0, executedCases: 0, defects: 0, runs: 0 };
    const total = point.authoredCases + point.executedCases + point.defects;
    return { ...point, count: total, future: date > today };
  });
  const peak = Math.max(1, ...days.map(day => day.count));
  const colored = days.map(day => ({ ...day, level: day.count ? Math.min(4, Math.max(1, Math.ceil(day.count / peak * 4))) : 0 }));
  const cells = [...Array.from({ length: start.getUTCDay() }, () => null), ...colored];
  const months = Array.from({ length: 12 }, (_, month) => {
    const offset = (Date.UTC(year, month, 1) - start.getTime()) / 86_400_000 + start.getUTCDay();
    return { month, column: Math.floor(offset / 7) + 1 };
  });
  return { days: colored, cells, months, total: days.reduce((sum, day) => sum + day.count, 0), columns: Math.ceil(cells.length / 7) };
}
