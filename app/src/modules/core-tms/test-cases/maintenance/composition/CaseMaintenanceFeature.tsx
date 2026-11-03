import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useMaintenanceWorkspace } from "../context/MaintenanceContext";
import { useCaseMaintenance } from "../application/useCaseMaintenance";
import { MaintenanceControl } from "../presentation/MaintenanceControl";
import type { CaseMaintenance, MaintenanceSource } from "../model/case-maintenance";
type Props = { caseId: string; initial?: CaseMaintenance; source?: MaintenanceSource; blocked?: boolean };
export function CaseMaintenanceFeature(props: Props) {
  const { workspaceId } = useMaintenanceWorkspace();
  return <Resource key={`${workspaceId}:${props.caseId}:${JSON.stringify(props.source ?? null)}`} {...props} />;
}
function Resource({ caseId, initial, source, blocked }: Props) {
  const http = useOptionalTmsHttpClient(), workspace = useMaintenanceWorkspace();
  const { locale } = useTmsLocale();
  const state = useCaseMaintenance(http, caseId, workspace.connected, workspace.confirmed, initial);
  return <MaintenanceControl state={state} workspaceId={workspace.workspaceId} ru={locale === "ru"} source={source}
    canManage={workspace.connected && workspace.canManage && !blocked} />;
}
