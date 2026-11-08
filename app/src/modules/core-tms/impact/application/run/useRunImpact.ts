import type { TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import type { ImpactScope } from "../../model/impact-types";
import { useImpactList } from "../list/useImpactList";

export function useRunImpact(
  scope: ImpactScope,
  eligible: boolean,
  ru: boolean,
  run: Pick<TestRunSummary, "id" | "configuration"> | null,
) {
  const capabilities = useTmsSession().companyCapabilities;
  const configuration = run?.configuration;
  const hasProposal = Boolean(configuration?.impactAnalysisId);
  const enabled = eligible && hasProposal && (capabilities === undefined || (capabilities.includes("core") && capabilities.includes("automation")));
  const impact = useImpactList(scope, enabled, ru, run?.id);
  const proposalBlocksStart = hasProposal
    && (configuration?.impactApproval !== "approved" || configuration.impactBuildReady === "false");
  const startBlocked = proposalBlocksStart || (enabled && (!impact.ready || Boolean(impact.error) || impact.items.some(item => !item.approved)));
  return { enabled, impact, startBlocked };
}
