import { Check, CircleDashed } from "lucide-react";

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
  return (
    <span className={surface.statusBadge} data-status={status}>
      {status === "connected"
        ? <Check size={12} aria-hidden="true" />
        : <CircleDashed size={12} aria-hidden="true" />}
      {copy.statuses[status]}
    </span>
  );
}
