import { useCallback, useState } from "react";
import { useAdministrationList } from "../../../company-administration/application/list/useAdministrationList";
import { useAdministrationCommand } from "../../../company-administration/application/state/useAdministrationCommand";
import type { CodexEmployee } from "../../domain/model/codex-employee";
import type { CodexConnectionFilter, CompanyCodexAdminPort } from "../../domain/admin/company-codex-admin";

export type CodexAdminAction = { kind: "activate" | "deactivate" } | { kind: "revoke"; id: string; name: string };
export function useCompanyCodexAdmin(api: CompanyCodexAdminPort, employee: CodexEmployee, onChanged: () => void) {
  const [filter, setFilter] = useState<CodexConnectionFilter>("all");
  const [action, setAction] = useState<CodexAdminAction | null>(null);
  const [saved, setSaved] = useState(false);
  const command = useAdministrationCommand();
  const list = useAdministrationList(useCallback((_search, cursor, signal) => api.connections(filter, cursor, signal), [api, filter]));
  const choose = (next: CodexAdminAction | null) => { if (!command.pending) { setAction(next); command.clearError(); setSaved(false); } };
  const confirm = async () => {
    if (!action || command.pending) return;
    const result = await command.execute(`${action.kind}:${action.kind === "revoke" ? action.id : employee.rowVersion}`, async (key, signal) => {
      if (action.kind === "revoke") await api.revoke(action.id, key, signal);
      else await api[action.kind](employee, key, signal);
      return true;
    });
    if (result) { setAction(null); setSaved(true); list.refresh(); onChanged(); }
  };
  return { list, filter, setFilter, action, choose, confirm, saved, pending: command.pending, error: command.error };
}
