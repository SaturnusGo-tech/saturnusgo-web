export const YOU_TRACK_STAGES = [
  "Backlog",
  "Develop",
  "Review",
  "Test",
  "Acceptance",
  "Staging",
  "Done",
] as const;

export type YouTrackStage = (typeof YOU_TRACK_STAGES)[number];
export type YouTrackAcceptedStage = "Acceptance" | "Staging" | "Done";
export type YouTrackTargetKey = "android" | "ios" | "backend";

export type YouTrackProject = Readonly<{
  id: string;
  shortName: string;
  name: string;
  archived?: boolean;
}>;

export type YouTrackTarget = Readonly<{
  projectId: string;
  shortName: string;
  name?: string;
}>;

export type YouTrackConfiguration = Readonly<{
  workspaceId: string;
  enabled: boolean;
  source: "runtime" | "workspace" | "tenant_default";
  baseUrl: string | null;
  tokenConfigured: boolean;
  targets: Readonly<Record<YouTrackTargetKey, YouTrackTarget | null>>;
  readyForTestStatuses: readonly YouTrackStage[];
  acceptedStage: YouTrackAcceptedStage | null;
  connection: Readonly<{
    status: "unconfigured" | "connected" | "failed";
    checkedAt: string | null;
    lastErrorCode: string | null;
  }>;
  rowVersion: number;
}>;

export type YouTrackConfigurationDraft = {
  enabled: boolean;
  baseUrl: string;
  apiToken: string;
  targets: Record<YouTrackTargetKey, YouTrackTarget>;
  readyForTestStatuses: YouTrackStage[];
  acceptedStage: YouTrackAcceptedStage;
};

export type YouTrackConfigurationInput = Readonly<{
  enabled: boolean;
  baseUrl: string;
  apiToken?: string;
  targets: Readonly<Record<YouTrackTargetKey, Readonly<{
    projectId: string;
    shortName: string;
  }>>>;
  readyForTestStatuses: readonly YouTrackStage[];
  acceptedStage: YouTrackAcceptedStage;
}>;

export type YouTrackConnectionTest = Readonly<{
  baseUrl: string;
  projects: readonly YouTrackProject[];
}>;

export const YOU_TRACK_TARGETS: readonly YouTrackTargetKey[] = [
  "android",
  "ios",
  "backend",
];

export function draftFromConfiguration(
  configuration: YouTrackConfiguration,
): YouTrackConfigurationDraft {
  return {
    enabled: configuration.enabled,
    baseUrl: configuration.baseUrl ?? "",
    apiToken: "",
    targets: {
      android: configuration.targets.android
        ? { ...configuration.targets.android } : { projectId: "", shortName: "" },
      ios: configuration.targets.ios
        ? { ...configuration.targets.ios } : { projectId: "", shortName: "" },
      backend: configuration.targets.backend
        ? { ...configuration.targets.backend } : { projectId: "", shortName: "" },
    },
    readyForTestStatuses: [...configuration.readyForTestStatuses],
    acceptedStage: configuration.acceptedStage ?? "Done",
  };
}

export function validateYouTrackDraft(
  draft: YouTrackConfigurationDraft,
  reusableTokenConfigured: boolean,
): "base_url" | "token" | "targets" | "ready_statuses" | null {
  try {
    normalizeYouTrackBaseUrl(draft.baseUrl);
  } catch {
    return "base_url";
  }
  const apiToken = draft.apiToken.trim();
  if ((!reusableTokenConfigured && apiToken.length === 0) ||
    (apiToken.length > 0 && (apiToken.length < 32 || new TextEncoder().encode(apiToken).length > 2048))) {
    return "token";
  }
  if (YOU_TRACK_TARGETS.some((target) => {
    const value = draft.targets[target];
    return value.projectId.trim().length === 0 || value.shortName.trim().length === 0;
  })) return "targets";
  if (draft.readyForTestStatuses.length === 0) return "ready_statuses";
  return null;
}

export function configurationInput(
  draft: YouTrackConfigurationDraft,
): YouTrackConfigurationInput {
  const apiToken = draft.apiToken.trim();
  return {
    enabled: draft.enabled,
    baseUrl: normalizeYouTrackBaseUrl(draft.baseUrl),
    ...(apiToken ? { apiToken } : {}),
    targets: {
      android: targetInput(draft.targets.android),
      ios: targetInput(draft.targets.ios),
      backend: targetInput(draft.targets.backend),
    },
    readyForTestStatuses: [...new Set(draft.readyForTestStatuses)],
    acceptedStage: draft.acceptedStage,
  };
}

export function normalizeYouTrackBaseUrl(value: string): string {
  const url = new URL(value.trim());
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" ||
    url.search || url.hash || url.toString().length > 2048) {
    throw new TypeError("YouTrack base URL must be an exact HTTPS service root.");
  }
  return url.toString();
}

export function canReuseYouTrackToken(
  configuration: Pick<YouTrackConfiguration, "baseUrl" | "tokenConfigured">,
  draftBaseUrl: string,
): boolean {
  if (!configuration.tokenConfigured || configuration.baseUrl === null) return false;
  try {
    return normalizeYouTrackBaseUrl(draftBaseUrl) === configuration.baseUrl;
  } catch {
    return false;
  }
}

function targetInput(target: YouTrackTarget) {
  return { projectId: target.projectId.trim(), shortName: target.shortName.trim() };
}
