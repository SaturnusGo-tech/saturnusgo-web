import type { ImportFile } from "./import-file";

export function groupImportHistory(items: readonly ImportFile[], now: Date, ru: boolean) {
  const key = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const groups = new Map<string, { key: string; label: string; date: string; items: ImportFile[] }>();
  for (const item of items) {
    const date = new Date(item.createdAt); const id = key(date);
    if (!groups.has(id)) groups.set(id, { key: id,
      label: id === key(now) ? (ru ? "Сегодня" : "Today") : id === key(yesterday) ? (ru ? "Вчера" : "Yesterday") : "",
      date: date.toLocaleDateString(ru ? "ru-RU" : "en-GB"), items: [] });
    groups.get(id)!.items.push(item);
  }
  return [...groups.values()];
}
export function importFileSize(bytes: number, ru: boolean) {
  const megabytes = bytes >= 1024 * 1024;
  const value = (bytes / (megabytes ? 1024 * 1024 : 1024)).toLocaleString(ru ? "ru-RU" : "en-GB", { maximumFractionDigits: 1 });
  return `${value} ${megabytes ? (ru ? "МБ" : "MB") : (ru ? "КБ" : "KB")}`;
}
