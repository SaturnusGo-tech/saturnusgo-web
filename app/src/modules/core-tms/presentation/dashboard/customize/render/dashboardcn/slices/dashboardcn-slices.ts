import type {
  DashboardDrill, DashboardDrillFilter, DashboardSnapshot,
} from "../../../../../../dashboards/model/dashboard-analytics";
import type { TmsMessageKey } from "../../../../../../localization/catalog/messages";
import { DEFECT_COLORS, TYPE_COLORS } from "../../../../charts/model/breakdown-data";

export type SliceKind = "defects" | "types";
export type CaseBasis = "current" | "created";
export type Slice = {
  key: string;
  count?: number;
  drill: DashboardDrill;
  color?: string;
  message?: TmsMessageKey;
};

type SliceFilter = Extract<DashboardDrillFilter, { entity: "defect" | "test_case" }>;

function scope(key: string, count: number, message: TmsMessageKey, filter: SliceFilter): Slice {
  return { key, count, message, drill: { id: `slice:${filter.entity}:${key}:${filter.basis}`, label: key, filter } };
}

export function sliceDistribution(snapshot: DashboardSnapshot, kind: SliceKind, basis: CaseBasis) {
  const { metrics } = snapshot;
  if (kind === "defects") return {
    all: scope("all", metrics.currentDefects, "dashboard.sliceAllDefects", { entity: "defect", basis: "current" }),
    segments: snapshot.defects.map(({ key, value, drill }): Slice => ({ key, count: value, drill,
      color: DEFECT_COLORS[key] ?? "var(--dash-slate)" })),
    related: [
      scope("linked", metrics.linkedDefects, "dashboard.sliceLinked", { entity: "defect", basis: "current", hasLink: true }),
      scope("reported", metrics.reportedDefects, "dashboard.sliceNew", { entity: "defect", basis: "reported" }),
    ],
  };

  const created = basis === "created";
  const total = created ? metrics.casesCreated : metrics.currentCases;
  const types = created ? snapshot.createdCaseTypes : snapshot.caseTypes;
  return {
    all: scope("all", total, created ? "dashboard.sliceNewCases" : "dashboard.sliceAllCases", { entity: "test_case", basis }),
    segments: (types ?? snapshot.caseTypes).map(({ key, value, drill }): Slice => ({
      key, count: types ? value : total === 0 ? 0 : undefined, color: TYPE_COLORS[key],
      drill: types ? drill : { ...drill, id: `cases:created:type:${key}`,
        filter: { entity: "test_case", basis: "created", type: key } },
    })),
    related: [],
  };
}
