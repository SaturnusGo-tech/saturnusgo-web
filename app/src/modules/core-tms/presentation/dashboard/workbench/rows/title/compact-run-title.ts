import { localizedLabel } from "../../../../../localization/format/labels";

const kinds = new Set(["ad_hoc", "regression", "smoke", "acceptance"].flatMap(kind =>
  [localizedLabel("ru", kind), localizedLabel("en", kind)]));

// Shorten only Falcon-generated names. The stored name and custom titles stay intact.
export function compactRunTitle(name: string, project: string, build: string | null): string {
  const title = name.trim();
  const parts = title.split(" · ");
  if (parts.length === 2 && ["Проверка исправлений", "Fix verification"].includes(parts[0]) && parts[1] === build)
    return parts[0];
  const typeIndex = parts.length - 3;
  if ((parts.length === 4 || parts.length === 5) && parts[0] === project &&
    kinds.has(parts[typeIndex]) && parts[typeIndex + 1] === (build || "—") &&
    /\d{1,2}:\d{2}/.test(parts[typeIndex + 2]))
    return parts.length === 5 ? parts[1] : parts[typeIndex];
  return title;
}
