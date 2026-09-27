import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import type { CustomFieldDefinition, CustomFieldSelection } from "../../../../custom-fields/model/custom-field";
export function updateCaseField(revision: TestCaseRevision, field: CustomFieldDefinition, values: readonly CustomFieldSelection[]): Partial<TestCaseRevision> {
  let fields = (revision.customFields ?? []).filter(item => item.fieldId !== field.id);
  fields.push({ fieldId: field.id, name: field.name, type: field.type, systemKey: field.systemKey, values: values.map(value => ({ ...value })) });
  if (field.systemKey === "product_group") {
    const parent = values[0]?.id ?? null;
    fields = fields.map(item => item.systemKey === "product" && item.values.some(value => value.parentValueId !== parent) ? { ...item, values: [] } : item);
  }
  const product = fields.find(item => item.systemKey === "product");
  const group = fields.find(item => item.systemKey === "product_group");
  const regression = fields.find(item => item.systemKey === "regression");
  return { customFields: fields, productId: product?.values[0]?.id ?? null, productGroupId: group?.values[0]?.id ?? null,
    regression: regression?.values[0]?.value === true, ...(product ? { component: product.values[0]?.label ?? "" } : {}) };
}
