import { fieldAliases, normalizeQueryText as normalize, valueAliases } from "../../../model/query/vocabulary/fields";
import type { QueryMember } from "../../../model/query/match";
export type QuerySuggestion = { value: string; label: string; detail?: string; field: boolean };
const fields = [
 ["key", "ID", "ID"], ["title", "Название", "Title"], ["lifecycle", "Статус", "Status"], ["priority", "Приоритет", "Priority"],
 ["folder", "Папка", "Folder"], ["component", "Компонент", "Component"], ["tag", "Тег", "Tag"], ["type", "Тип", "Type"], ["owner", "Ответственный", "Assignee"],
];
const enums: Record<string, string[]> = { lifecycle: ["ready", "draft", "deprecated", "archived"], priority: ["critical", "high", "medium", "low"], type: ["manual", "checklist", "automated"] };
export function querySuggestions(query: string, caret: number, options: { ru: boolean; folders: string[]; components: string[]; tags?: string[]; members?: readonly QueryMember[] }) {
 const before = query.slice(0, caret);
 const qualified = /([\p{L}\w]+)\s*(:|!=|==|=|~)\s*("[^"]*"?|'[^']*'?|«[^»]*»?|[^\s(),]*)$/u.exec(before);
 const list = /([\p{L}\w]+)\s+(?:IN|В)\s*\([^)]*$/iu.exec(before);
 let field = qualified ? fieldAliases[normalize(qualified[1])] : list ? fieldAliases[normalize(list[1])] : undefined;
 let start = qualified ? caret - qualified[3].length : list ? Math.max(before.lastIndexOf("("), before.lastIndexOf(",")) + 1 : (before.match(/[^\s():,!=~]*$/u)?.index ?? caret);
 while (start < caret && /\s/.test(query[start])) start++;
 let end = caret; const quote = query[start]; const close = quote === "«" ? "»" : quote;
 if (["\"", "'", "«"].includes(quote)) {
  end = start + 1;
  while (end < query.length && (query[end] !== close || query[end - 1] === "\\")) end++;
  if (query[end] === close) end++;
 } else while (end < query.length && !/[\s(),:=!~]/u.test(query[end])) end++;
 const needle = normalize(before.slice(start).replace(/^["'«]|["'»]$/g, ""));
 let suggestions: QuerySuggestion[];
 if (!field) suggestions = fields.filter(([key, ru, en]) => normalize(`${key} ${ru} ${en} ${Object.keys(fieldAliases).filter(alias => fieldAliases[alias] === key).join(" ")}`).includes(needle))
   .map(([value, ru, en]) => ({ value, label: options.ru ? ru : en, field: true }));
 else {
  const dynamic = field === "folder" ? options.folders : field === "component" ? options.components : field === "tag" ? options.tags ?? [] : enums[field] ?? [];
  suggestions = field === "owner" ? [{ value: "unassigned", label: options.ru ? "Не назначен" : "Not assigned", field: false },
    ...(options.members ?? []).map(member => ({ value: member.email || member.name, label: member.name, detail: member.email ?? undefined, field: false }))]
    : dynamic.map(value => ({ value, label: options.ru && enums[field!] ? valueAliases[value]?.[1] ?? value : value, field: false }));
  suggestions = suggestions.filter(item => normalize(`${item.value} ${item.label} ${item.detail ?? ""}`).includes(needle));
 }
 return { start, end, field, suggestions: suggestions.slice(0, 12) };
}
export function insertQuerySuggestion(query: string, range: { start: number; end: number }, item: QuerySuggestion) {
 const value = item.field ? `${item.value}:` : JSON.stringify(item.value);
 const suffix = query.slice(range.end); const separator = !item.field && (!suffix || !/^[\s,)]/.test(suffix)) ? " " : "";
 return { query: `${query.slice(0, range.start)}${value}${separator}${suffix}`, caret: range.start + value.length + separator.length };
}
