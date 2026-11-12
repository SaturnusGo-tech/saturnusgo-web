import { IntegrationSelect } from "../../../../../common/integration-controls/select/IntegrationSelect";
import { statusLabel, type YouTrackRouteDraft, type YouTrackStatus } from "../../../../../../youtrack/model/youtrack-settings";

export function OutboundSelect({ label, route, state, statuses, empty, onUpdate }: {
  label: string; route: YouTrackRouteDraft; state: keyof YouTrackRouteDraft["workflow"]["outbound"];
  statuses: readonly YouTrackStatus[]; empty: string; onUpdate: (updater: (route: YouTrackRouteDraft) => YouTrackRouteDraft) => void;
}) {
  const allowed = state === "verified" ? new Set(route.workflow.inbound.accepted) : new Set(Object.values(route.workflow.inbound).flat());
  return <IntegrationSelect label={label} value={route.workflow.outbound[state] ?? ""} placeholder={empty}
    options={[{ value: "", label: empty }, ...statuses.filter(status => allowed.has(status.id)).map(status => ({ value: status.id, label: statusLabel(status) }))]}
    onValueChange={value => onUpdate(current => ({ ...current, workflow: { ...current.workflow, outbound: { ...current.workflow.outbound, [state]: value || null } } }))}/>;
}
