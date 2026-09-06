import type { components } from "../../../../../core/tms/generated/tms-api";

type Api = components["schemas"];

export type YouTrackLegacyTargetKey = "android" | "ios" | "backend";
export type YouTrackMatcherField = Api["YouTrackRouteMatcher"]["field"];

export type YouTrackStatus = Readonly<Api["YouTrackStatusValue"]>;

export type YouTrackStateField = Readonly<
  Omit<Api["YouTrackStateFieldDiscovery"], "bundleId" | "statuses"> & {
    bundleId?: string;
    statuses: readonly YouTrackStatus[];
  }
>;

export type YouTrackProject = Readonly<
  Omit<Api["YouTrackProjectDiscovery"], "stateFields"> & {
    stateFields?: readonly YouTrackStateField[];
  }
>;

export type YouTrackInboundWorkflow = Readonly<Api["YouTrackInboundWorkflowMapping"]>;

export type YouTrackOutboundWorkflow = Readonly<Api["YouTrackOutboundWorkflowMapping"]>;

export type YouTrackRoute = Readonly<
  Omit<Api["YouTrackRoute"], "workflow"> & {
    workflow: Readonly<
      Omit<Api["YouTrackRouteWorkflow"], "statuses" | "inbound" | "outbound"> & {
        statuses: readonly YouTrackStatus[];
        inbound: YouTrackInboundWorkflow;
        outbound: YouTrackOutboundWorkflow;
      }
    >;
  }
>;
export type YouTrackConfiguration = Readonly<
  Omit<Api["YouTrackConfiguration"], "routes"> & { routes: readonly YouTrackRoute[] }
>;

export type YouTrackRouteDraft = {
  id: string;
  name: string;
  enabled: boolean;
  isDefault: boolean;
  legacyKey?: YouTrackLegacyTargetKey;
  match: { field: YouTrackMatcherField; value: string } | null;
  project: { id: string; name: string; shortName: string };
  workflow: {
    stateField: { id: string; name: string };
    statuses: YouTrackStatus[];
    inbound: { -readonly [Key in keyof YouTrackInboundWorkflow]: string[] };
    outbound: { -readonly [Key in keyof YouTrackOutboundWorkflow]: string | null };
  };
};

export type YouTrackConfigurationDraft = {
  enabled: boolean;
  baseUrl: string;
  apiToken: string;
  routes: YouTrackRouteDraft[];
};

export type YouTrackConfigurationInput = Readonly<Api["YouTrackV2ConfigurationReplaceRequest"]>;

export type YouTrackDiscovery = Readonly<
  Omit<Api["YouTrackDiscoveryResult"], "projects"> & { projects: readonly YouTrackProject[] }
>;

export type YouTrackConnectionTest = Readonly<Api["YouTrackConnectionTestResult"]>;

export type YouTrackDisconnectResult = Readonly<Api["YouTrackDisconnectResult"]>;
export type YouTrackWebhookSetup = Readonly<Api["YouTrackWebhookSetup"]>;

export type YouTrackDraftIssue =
  | "base_url" | "token" | "default_project" | "route_match" | "route_duplicate"
  | "state_field" | "ready_statuses" | "accepted_statuses" | "status_conflict"
  | "status_unavailable" | "outbound_status";
