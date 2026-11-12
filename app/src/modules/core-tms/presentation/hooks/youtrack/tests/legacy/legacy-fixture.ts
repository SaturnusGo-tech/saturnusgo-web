import type { YouTrackConfiguration, YouTrackProject } from "../../../../../youtrack/model/youtrack-settings";
import { configuration } from "../../../../../youtrack/application/plugin-settings/tests/toggle-harness";

const names = ["Backlog", "Develop", "Review", "Test", "Acceptance", "Staging", "Done"];
const targets = [
  { key: "android" as const, projectId: "0-2", fieldId: "189-10", ids: ["166-21", "166-22", "166-23", "166-24", "166-34", "166-25", "166-26"] },
  { key: "ios" as const, projectId: "0-3", fieldId: "189-12", ids: ["166-27", "166-28", "166-29", "166-30", "166-35", "166-31", "166-32"] },
  { key: "backend" as const, projectId: "0-1", fieldId: "189-8", ids: ["166-15", "166-16", "166-17", "166-18", "166-33", "166-19", "166-20"] },
];
export function legacyFixture() {
  const base = configuration();
  const saved: YouTrackConfiguration = { ...base, configurationVersion: 1, routes: targets.map(target => ({
    ...base.routes[0], id: target.key, legacyKey: target.key, isDefault: false, match: { field: "tag", value: target.key },
    project: { id: target.projectId, name: target.key, shortName: target.key }, workflow: {
      stateField: null, statuses: names.map((name, ordinal) => ({ id: name, name, localizedName: null, ordinal, isResolved: false, archived: false })),
      inbound: { backlog: ["Backlog"], inProgress: ["Develop", "Review"], readyForRetest: ["Test", "Acceptance", "Staging"], accepted: ["Done"] },
      outbound: { open: "Backlog", triaged: "Backlog", inProgress: "Develop", readyForRetest: "Test", verified: "Done", closed: "Done", reopened: "Backlog" },
    },
  })) };
  const projects: YouTrackProject[] = targets.map(target => ({ id: target.projectId, name: target.key, shortName: target.key,
    stateFields: [{ id: target.fieldId, name: "Stage", bundleId: "bundle-" + target.key,
      statuses: names.map((name, ordinal) => ({ id: target.ids[ordinal], name, localizedName: null, ordinal, isResolved: name !== "Done", archived: false })) }],
  }));
  return { saved, projects };
}
