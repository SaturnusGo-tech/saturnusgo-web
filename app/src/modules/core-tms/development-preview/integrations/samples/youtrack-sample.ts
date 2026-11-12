import type { YouTrackConfiguration, YouTrackProject } from "../../../youtrack/model/youtrack-settings";
export const sampleWorkspace = "sample-integration-workspace";
const statuses = ["Open", "In progress", "Ready for retest", "Verified"].map((name, ordinal) => ({
  id: `state-${ordinal}`, name, localizedName: null, ordinal, isResolved: ordinal === 3, archived: false,
}));
export const sampleProjects: YouTrackProject[] = ["Payments · Platform and infrastructure", "Mobile · Android", "Mobile · iOS"].map((name, i) => ({
  id: `project-${i}`, name, shortName: ["PAY", "ANDROID", "IOS"][i]!,
  stateFields: [{ id: "state-field", name: "State", bundleId: "sample-bundle", statuses }],
}));
export const sampleYouTrack: YouTrackConfiguration = {
  workspaceId: sampleWorkspace, source: "workspace", configurationVersion: 2, enabled: true,
  baseUrl: "https://sample-team.youtrack.cloud/", tokenConfigured: true,
  targets: { android: null, ios: null, backend: null }, readyForTestStatuses: [], acceptedStage: null,
  connection: { status: "connected", checkedAt: "2026-11-12T09:00:00Z", lastErrorCode: null }, connectionRevision: 1, rowVersion: 1,
  routes: sampleProjects.map((project, i) => ({ id: `route-${i}`, name: project.name, enabled: true, isDefault: i === 0,
    match: i === 0 ? null : { field: "tag", value: i === 1 ? "android" : "ios" },
    project: { id: project.id, name: project.name, shortName: project.shortName },
    workflow: { stateField: { id: "state-field", name: "State" }, statuses,
      inbound: { backlog: ["state-0"], inProgress: ["state-1"], readyForRetest: ["state-2"], accepted: ["state-3"] },
      outbound: { open: "state-0", triaged: null, inProgress: "state-1", readyForRetest: "state-2", verified: "state-3", closed: "state-3", reopened: "state-0" } },
  })),
};
