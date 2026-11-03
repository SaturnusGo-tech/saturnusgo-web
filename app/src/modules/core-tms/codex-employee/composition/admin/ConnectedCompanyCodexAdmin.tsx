import { useMemo } from "react";
import { useCompanyCodexAdmin } from "../../application/admin/useCompanyCodexAdmin";
import { createCompanyCodexAdminApi } from "../../data/admin/company-codex-admin-api";
import { CompanyCodexAdmin } from "../../presentation/company-admin/CompanyCodexAdmin";
import type { CompanyCodexAdminProps } from "./CompanyCodexAdminFeature";

export function ConnectedCompanyCodexAdmin({ http, status, locale, onChanged }: CompanyCodexAdminProps) {
  const api = useMemo(() => createCompanyCodexAdminApi(http), [http]);
  const state = useCompanyCodexAdmin(api, status.employee!, () => { status.refresh(); onChanged(); });
  return <CompanyCodexAdmin employee={status.employee!} state={state} ru={locale === "ru"} refresh={() => { status.refresh(); state.list.refresh(); }} />;
}
