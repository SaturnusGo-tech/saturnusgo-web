export const MAX_CASE_BULK_MUTATION_ITEMS = 1000;

export type BulkCaseMutationResult =
  | { ok: true }
  | { ok: false; message: string };
