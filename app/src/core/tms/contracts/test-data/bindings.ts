export type DataType = "String" | "Integer" | "Decimal" | "Boolean" | "Email" | "URL" | "Date" | "DateTime" | "JSON";
export type StaticDefinition = { readonly name: string; readonly type: DataType; readonly value: string | boolean; readonly description?: string };
type Base = { readonly id: string; readonly alias: string; readonly required: boolean };
export type TestDataBinding =
  | (Base & { readonly sourceType: "STATIC"; readonly staticDefinition: StaticDefinition })
  | (Base & { readonly sourceType: "DATASET"; readonly sourceId: string; readonly sourceVersionId: string })
  | (Base & { readonly sourceType: "CREDENTIAL"; readonly sourceId: string });
