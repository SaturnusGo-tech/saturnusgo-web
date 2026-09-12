export type CaseQlField = "text" | "key" | "title" | "lifecycle" | "priority" | "component" | "folder" | "tag" | "type" | "owner";
export const normalizeQueryText = (value: string | null | undefined) => (value ?? "").normalize("NFKC").toLowerCase().replaceAll("ё", "е").trim();
export const fieldAliases: Record<string, CaseQlField> = {
 text: "text", текст: "text", id: "key", key: "key", ид: "key", title: "title", name: "title", название: "title",
 status: "lifecycle", state: "lifecycle", lifecycle: "lifecycle", статус: "lifecycle", состояние: "lifecycle",
 priority: "priority", приоритет: "priority", component: "component", functionality: "component", компонент: "component",
 folder: "folder", path: "folder", папка: "folder", tag: "tag", tags: "tag", тег: "tag", теги: "tag", type: "type", тип: "type",
 owner: "owner", assignee: "owner", responsible: "owner", исполнитель: "owner", владелец: "owner", ответственный: "owner",
};
export const valueAliases: Record<string, readonly string[]> = {
 ready: ["ready", "готов", "готовый", "actual", "актуальный"], draft: ["draft", "черновик"],
 deprecated: ["deprecated", "устарел", "устаревший"], archived: ["archived", "архив", "архивный"],
 critical: ["critical", "критический"], high: ["high", "высокий"], medium: ["medium", "средний"], low: ["low", "низкий"],
 manual: ["manual", "ручной"], checklist: ["checklist", "check-list", "чеклист", "чек-лист"],
 automated: ["automated", "автоматизированный", "автоматический", "автотест"],
 unassigned: ["unassigned", "none", "null", "не назначен", "неназначен", "без ответственного"],
};
