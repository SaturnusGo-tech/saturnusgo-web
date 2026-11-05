import type { CompanyLegal,CompanyStoredLegal } from "../../domain/administration";
import type { AdministrationCopy } from "../copy/administration-copy";
import { AccessField } from "../../../auth/managed/presentation/fields/AccessField";
import styles from "../layout/administration.module.css";

type Props={readonly copy:AdministrationCopy;readonly disabled:boolean}&(
  {readonly legal:CompanyLegal;readonly onChange:(legal:CompanyLegal)=>void;readonly optional?:false}|
  {readonly legal:CompanyStoredLegal;readonly onChange:(legal:CompanyStoredLegal)=>void;readonly optional:true});
export function LegalFields(props:Props) {
  const {legal,copy,disabled}=props;
  const fields = ["legalName", "countryCode", "legalForm", "taxId", "registrationId", "taxBranchId", "legalAddress"] as const;
  return <div className={styles.fields}>{fields.map((field) => <AccessField key={field} label={copy[field]} value={legal[field]??""}
    required={!props.optional&&(field === "legalName" || field === "countryCode")} disabled={disabled} maxLength={field === "countryCode" ? 2 : field === "legalAddress" ? 1000 : 300}
    pattern={field === "countryCode" ? "[A-Za-z]{2}" : undefined}
    onChange={(event) => {
      const value=field==="countryCode"?event.target.value.toUpperCase():event.target.value;
      if(props.optional)props.onChange({...props.legal,[field]:(field==="legalName"||field==="countryCode")&&!value?null:value});
      else props.onChange({...props.legal,[field]:value});
    }} />)}</div>;
}
