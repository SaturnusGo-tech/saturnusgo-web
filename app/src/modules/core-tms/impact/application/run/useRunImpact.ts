import { useTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import type { ImpactScope } from "../../model/impact-types";
import { useImpactList } from "../list/useImpactList";

export function useRunImpact(scope: ImpactScope, eligible: boolean, ru: boolean, runId?: string) {
  const capabilities = useTmsSession().companyCapabilities;
  const enabled = eligible && (capabilities === undefined || (capabilities.includes("core") && capabilities.includes("automation")));
  const impact = useImpactList(scope, enabled, ru, runId);
  const startBlocked = enabled && (!impact.ready || Boolean(impact.error) || impact.items.some(item => !item.approved));
  return { enabled, impact, startBlocked };
}
