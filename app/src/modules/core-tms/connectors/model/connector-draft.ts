import type { Connection, ConnectionInput, Provider, Settings } from "./connector-types";
const tracker: Settings["events"] = ["defect.created", "defect.updated", "defect.status_changed", "defect.fix_confirmed"];
export const eventOptions: Readonly<Record<Provider, Settings["events"]>> = {
  jira: tracker, trello: tracker, linear: tracker,
  github: ["pull_request", "push", "release", "workflow_failed", "run.complete", "run.abort"],
  slack: ["run.created", "run.start", "run.complete", "run.abort", "defect.created", "defect.status_changed",
    "defect.fix_confirmed", "github.release", "github.workflow_failed"],
  confluence: ["run.complete"], swagger: [],
};
export const connectionDraft = (provider: Provider, connection: Connection | null): ConnectionInput => ({
  enabled: connection?.enabled ?? provider === "swagger",
  settings: connection ? structuredClone(connection.settings) : {
    baseUrl: "", remoteId: provider === "swagger" ? "openapi" : "",
    ...(provider === "swagger" ? { specAuthMode: "none" as const } : {}), destinationId: "", events: [...eventOptions[provider]],
    inboundReadyStatuses: [], outboundStatuses: {}, rules: [],
  }, secrets: {},
});
