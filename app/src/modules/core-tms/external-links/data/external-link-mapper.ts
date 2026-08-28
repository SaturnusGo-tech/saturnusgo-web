import type { components } from "../../../../core/tms/generated/tms-api";
import type { ExternalLink } from "../../../../core/tms/contracts/legacy-contract";

export function mapExternalLink(dto: components["schemas"]["ExternalLink"]): ExternalLink {
  return {
    id: dto.id,
    projectId: dto.projectId,
    owner: dto.owner.kind === "run"
      ? { kind: "run", runId: dto.owner.runId, runItemId: dto.owner.runItemId ?? null }
      : dto.owner,
    label: dto.label,
    targetUri: dto.targetUri,
    kind: dto.kind,
    status: dto.status,
  };
}
