import type { components } from "../../../../../core/tms/generated/tms-api";
import type { CodexEmployee } from "../model/codex-employee";
import type { ResultPage } from "../../../company-administration/domain/administration";

export type CompanyCodexConnection = Readonly<components["schemas"]["CompanyCodexConnection"]>;
export type CodexConnectionFilter = "all" | CompanyCodexConnection["status"];
export interface CompanyCodexAdminPort {
  connections(status: CodexConnectionFilter, cursor: string | null, signal: AbortSignal): Promise<ResultPage<CompanyCodexConnection>>;
  activate(employee: CodexEmployee, key: string, signal: AbortSignal): Promise<void>;
  deactivate(employee: CodexEmployee, key: string, signal: AbortSignal): Promise<void>;
  revoke(id: string, key: string, signal: AbortSignal): Promise<void>;
}
