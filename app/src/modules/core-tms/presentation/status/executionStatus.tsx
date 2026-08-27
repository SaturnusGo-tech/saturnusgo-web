import {
  Ban,
  CheckCircle2,
  Circle,
  CircleDashed,
  SkipForward,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import type { ExecutionStatus } from "../../../../core/tms/contracts/legacy-contract";

export { statusLabel } from "../../helpers/status/statusLabel";

export const statusIcon: Record<ExecutionStatus, ReactNode> = {
  not_run: <Circle size={16} />,
  in_progress: <CircleDashed size={16} />,
  passed: <CheckCircle2 size={16} />,
  failed: <XCircle size={16} />,
  blocked: <Ban size={16} />,
  skipped: <SkipForward size={16} />,
};
