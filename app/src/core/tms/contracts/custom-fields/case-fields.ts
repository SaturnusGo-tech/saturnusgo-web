import type { components } from "../../generated/tms-api";
export type CaseCustomField = components["schemas"]["CustomFieldSnapshot"];
export type CaseFieldValue = components["schemas"]["CustomFieldValueSnapshot"];
export type CaseFields = {
  customFields?: CaseCustomField[];
  productGroupId?: string | null;
  productId?: string | null;
  regression?: boolean;
};
export function copyCaseFields(value: CaseFields): CaseFields {
  return { customFields: value.customFields?.map(field => ({ ...field, values: field.values.map(item => ({ ...item })) })),
    productGroupId: value.productGroupId ?? null, productId: value.productId ?? null, regression: value.regression ?? false };
}
