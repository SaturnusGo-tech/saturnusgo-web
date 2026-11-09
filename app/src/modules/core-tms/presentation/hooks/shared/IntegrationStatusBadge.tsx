import { LoadingOrb } from "../../../../../shared/components/loading/LoadingOrb";
import { Check, CircleDashed } from "lucide-react";
import { useLoadingFeedback } from "../../common/loading/feedback/useLoadingFeedback";

import surface from "../hooks.module.css";
import type { HooksCopy } from "./hooks-copy";

export type IntegrationUiStatus =
  | "connected"
  | "available"
  | "attention"
  | "checking"
  | "planned";

export function IntegrationStatusBadge({
  status,
  copy,
}: {
  status: IntegrationUiStatus;
  copy: HooksCopy;
}) {
  const showOrb = useLoadingFeedback(status === "checking");
  const visibleStatus = showOrb ? "checking" : status;
  return (
    <span className={surface.statusBadge} data-status={visibleStatus}>
      {visibleStatus === "connected"
        ? <Check size={12} aria-hidden="true" />
        : visibleStatus === "checking"
          ? <span className={surface.checkingIcon} aria-hidden="true">{showOrb && <LoadingOrb size="xs" />}</span>
          : <CircleDashed size={12} aria-hidden="true" />}
      {copy.statuses[visibleStatus]}
    </span>
  );
}
