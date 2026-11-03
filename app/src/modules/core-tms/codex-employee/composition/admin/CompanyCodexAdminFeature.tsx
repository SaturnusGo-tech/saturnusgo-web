import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { useCodexEmployee } from "../../application/state/useCodexEmployee";
import { CodexResourceState } from "../../presentation/shared/CodexResourceState";

import { ConnectedCompanyCodexAdmin } from "./ConnectedCompanyCodexAdmin";

export type CompanyCodexAdminProps = { http: TmsHttpClient; status: ReturnType<typeof useCodexEmployee>; locale: "ru" | "en"; allowed: boolean; onChanged: () => void };
export function CompanyCodexAdminFeature(props: CompanyCodexAdminProps) {
  if (!props.allowed) return <p>{props.locale === "ru" ? "Этот раздел доступен администратору компании." : "This section is available to company administrators."}</p>;
  if (!props.status.employee) return <CodexResourceState loading={props.status.loading} error={props.status.error} retry={props.status.refresh} locale={props.locale} />;
  if (!props.status.employee.canManage) return <p>{props.locale === "ru" ? "Недостаточно прав для управления Codex." : "You do not have permission to manage Codex."}</p>;
  return <ConnectedCompanyCodexAdmin {...props} />;
}
