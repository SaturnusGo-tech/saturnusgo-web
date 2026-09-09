import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import { isPrioritySignalLevel, prioritySignalRank } from "../../../cases/list/priority/PrioritySignal";
import type { DetailSort } from "./DetailToolbar";
const time = (value?: string) => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
export function sortDetailRows(rows: DashboardDrillRow[], sort: DetailSort): DashboardDrillRow[] {
  return [...rows].sort((left, right) => {
    if (sort === "title") return left.title.localeCompare(right.title) || left.key.localeCompare(right.key);
    if (sort === "priority_desc" || sort === "priority_asc") {
      const rank = (row: DashboardDrillRow) => isPrioritySignalLevel(row.priority) ? prioritySignalRank[row.priority] : -1;
      return (rank(left) - rank(right)) * (sort === "priority_asc" ? 1 : -1) || left.key.localeCompare(right.key, undefined, { numeric: true });
    }
    return time(right.occurredAt) - time(left.occurredAt) || left.key.localeCompare(right.key, undefined, { numeric: true });
  });
}
