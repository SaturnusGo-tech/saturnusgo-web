import type { TmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";

export type PageState<T> = Readonly<{
  scope: string;
  items: readonly T[];
  cursor: string | null;
  loading: boolean;
  error: TmsMutationFailure | null;
}>;

export function emptyPage<T>(scope: string, loading = true): PageState<T> {
  return { scope, items: [], cursor: null, loading, error: null };
}

export function appendPage<T extends { id: string }>(previous: readonly T[], next: readonly T[]): readonly T[] {
  const merged = new Map(previous.map((item) => [item.id, item]));
  for (const item of next) merged.set(item.id, item);
  return [...merged.values()];
}
