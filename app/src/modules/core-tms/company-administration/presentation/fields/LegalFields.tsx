import type { CompanyLegal } from "../../domain/administration";
import type { AdministrationCopy } from "../copy/administration-copy";
import { AccessField } from "../../../auth/managed/presentation/fields/AccessField";
import styles from "../layout/administration.module.css";

export function LegalFields({ legal, onChange, copy, disabled }: {
  readonly legal: CompanyLegal; readonly onChange: (legal: CompanyLegal) => void; readonly copy: AdministrationCopy; readonly disabled: boolean;
}) {
  const fields = ["legalName", "countryCode", "legalForm", "taxId", "registrationId", "taxBranchId", "legalAddress"] as const;
  return <div className={styles.fields}>{fields.map((field) => <AccessField key={field} label={copy[field]} value={legal[field]}
    required={field === "legalName" || field === "countryCode"} disabled={disabled} maxLength={field === "countryCode" ? 2 : field === "legalAddress" ? 1000 : 300}
    pattern={field === "countryCode" ? "[A-Za-z]{2}" : undefined}
    onChange={(event) => onChange({ ...legal, [field]: field === "countryCode" ? event.target.value.toUpperCase() : event.target.value })} />)}</div>;
}
