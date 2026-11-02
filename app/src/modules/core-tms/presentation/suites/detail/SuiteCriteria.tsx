import type { Suite } from "../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../folders/model/folder";
import css from "./detail.module.css";

export function SuiteCriteria({ suite, folders, ru }: { suite: Suite; folders: readonly RepositoryFolder[]; ru: boolean }) {
  if (suite.type === "static") return <div className={css.membership}>
    <h2>{ru ? "Состав" : "Membership"}</h2><p>{ru ? "Кейсы выбраны вручную. Состав меняется только при настройке сьюта." : "Cases are selected manually. Membership changes when you configure this suite."}</p>
  </div>;
  const rule = suite.filter;
  const priority = ru ? { low: "Низкий", medium: "Средний", high: "Высокий", critical: "Критический" } : { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
  const lifecycle = ru ? { draft: "Черновик", ready: "Готов", deprecated: "Устарел" } : { draft: "Draft", ready: "Ready", deprecated: "Deprecated" };
  const folder = rule.folderId ? folders.find(item => item.id === rule.folderId && item.projectId === suite.projectId && !item.archivedAt) : undefined;
  const criteria: [string, string][] = [];
  if (rule.tags?.length) criteria.push([ru ? "Все теги" : "All tags", rule.tags.map(tag => `#${tag}`).join(" · ")]);
  if (rule.folderId || rule.folderPathPrefix) criteria.push([ru ? "Папка и вложенные" : "Folder and subfolders", rule.folderId ? folder?.path ?? (ru ? "Папка недоступна" : "Folder unavailable") : rule.folderPathPrefix!]);
  if (rule.priority?.length) criteria.push([ru ? "Приоритет" : "Priority", rule.priority.map(value => priority[value]).join(", ")]);
  if (rule.lifecycle?.length) criteria.push([ru ? "Статус" : "Status", rule.lifecycle.map(value => lifecycle[value]).join(", ")]);
  if (rule.text?.trim()) criteria.push([ru ? "Текст содержит" : "Text contains", rule.text.trim()]);
  return <section className={css.membership} aria-label={ru ? "Правила состава" : "Membership rules"}>
    <h2>{ru ? "Состав по правилам" : "Rule-based membership"}</h2>
    <p>{criteria.length ? (ru ? "Автоматически включает активные кейсы, подходящие под все правила." : "Automatically includes active cases matching every rule.") : (ru ? "Все активные кейсы этого проекта." : "All active cases in this project.")}</p>
    {criteria.length > 0 && <dl className={css.criteria}>{criteria.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
  </section>;
}
