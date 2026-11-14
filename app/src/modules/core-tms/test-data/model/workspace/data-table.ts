export type DataCell = string | number | boolean | null;
export type DataColumn = { readonly name: string; readonly type: string };
export type DataTable = { readonly columns: readonly DataColumn[]; readonly rows: readonly Readonly<Record<string, DataCell>>[];
  readonly truncated: boolean; readonly durationMs?: number };
