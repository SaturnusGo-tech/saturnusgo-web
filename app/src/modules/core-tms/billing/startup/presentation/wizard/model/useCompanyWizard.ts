import { useEffect, useRef, useState } from "react";
import type { useStartupSetup } from "../../../application/useStartupSetup";
import { companySlug, companyValues, sameCompanyValues, type CompanyStage, type CompanyValues } from "./wizard-values";
export function useCompanyWizard(model: ReturnType<typeof useStartupSetup>, initialStage: CompanyStage = "name") {
  const [stage, go] = useState<CompanyStage>(initialStage);
  const [edit, setEdit] = useState<CompanyValues | null>(null);
  const [manualSlug, setManualSlug] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const snapshot = useRef(model.setup);
  if (model.setup) snapshot.current = model.setup;
  const values = edit ?? companyValues(model.setup ?? snapshot.current);
  const context = model.setup ? `${model.setup.id}:${model.setup.version}` : "";
  const changed = !sameCompanyValues(values, companyValues(model.setup));
  const consented = !!context && confirmed === context && !changed;
  const locked = model.busy || model.loading || model.canRetryCommand;
  const pending = model.setup?.status === "reserved" || model.setup?.status === "provisioning";
  useEffect(() => {
    if (!pending || locked || model.error) return;
    const timer = setTimeout(model.reload, 2500);
    return () => clearTimeout(timer);
  }, [pending, locked, model.error, model.setup, model.reload]);
  function change(field: keyof CompanyValues, value: string) {
    setEdit({ ...values, [field]: value, ...(field === "displayName" && !manualSlug ? { slug: companySlug(value) } : {}) });
    if (field === "slug") setManualSlug(true);
    setConfirmed(null);
  }
  async function reserve() {
    if (locked || values.displayName.trim().length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) return;
    if (!changed && model.setup && !["expired", "failed"].includes(model.setup.status)) { go("consent"); return; }
    const input = { displayName: values.displayName.trim(), slug: values.slug,
      ...Object.fromEntries((["legalName", "countryCode", "taxId", "address"] as const).filter(key => values[key].trim()).map(key => [key, values[key].trim()])) };
    if (!await model.save(input)) return false;
    setEdit(null);
    setConfirmed(null);
    go("consent");
    return true;
  }
  return { stage, go, values, change, changed, locked, consented, confirm: (checked: boolean) => setConfirmed(checked ? context : null), reserve, snapshot: snapshot.current };
}
