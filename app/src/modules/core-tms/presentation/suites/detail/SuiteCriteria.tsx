import type { Suite } from "../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../folders/model/folder";
import { LifecycleBadge } from "../../cases/list/CaseBadges";
import { PrioritySignal } from "../../cases/list/priority/PrioritySignal";
import { SuiteFolderPath } from "../shared/folder-path/SuiteFolderPath";
import css from "./detail.module.css";

export function SuiteCriteria({ suite, folders, ru }: { suite: Suite; folders: readonly RepositoryFolder[]; ru: boolean }) {
  if (suite.type === "static") return <div className={css.membership}>
    <p>{ru ? "Кейсы выбраны вручную. Состав меняется только при настройке сьюта." : "Cases are selected manually. Membership changes when you configure this suite."}</p>
  </div>;
  const rule = suite.filter;
  const priority = ru ? { low: "Низкий", medium: "Средний", high: "Высокий", critical: "Критический" } : { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
  const folder = rule.folderId ? folders.find(item => item.id === rule.folderId && item.projectId === suite.projectId && !item.archivedAt) : undefined;
  const hasRules = Boolean(rule.tags?.length || rule.folderId || rule.folderPathPrefix || rule.priority?.length || rule.lifecycle?.length || rule.text?.trim());
  return <section className={css.membership} aria-label={ru ? "Правила состава" : "Membership rules"}>
    <p>{hasRules ? (ru ? "Активные кейсы, подходящие под все правила." : "Active cases matching every rule.") : (ru ? "Все активные кейсы этого проекта." : "All active cases in this project.")}</p>
    {hasRules && <ul className={css.criteria}>
      {(rule.folderId || rule.folderPathPrefix) && <li className={css.folderRule}>
        <SuiteFolderPath path={folder?.path ?? rule.folderPathPrefix ?? "/"} ru={ru} unavailable={Boolean(rule.folderId && !folder)} />
        <small>{ru ? "Включая вложенные" : "Includes subfolders"}</small>
      </li>}
      {rule.tags?.map(tag => <li className={css.criterion} key={`tag:${tag}`} title={ru ? "Кейс должен содержать этот тег" : "Cases must include this tag"}><span>{`#${tag}`}</span></li>)}
      {rule.priority?.map(value => <li className={css.criterion} key={`priority:${value}`}><PrioritySignal priority={value} label={priority[value]} size={12} /><span>{priority[value]}</span></li>)}
      {rule.lifecycle?.map(value => <li className={css.lifecycleRule} key={`lifecycle:${value}`}><LifecycleBadge locale={ru ? "ru" : "en"} lifecycle={value} /></li>)}
      {rule.text?.trim() && <li className={`${css.criterion} ${css.textRule}`} title={rule.text.trim()}><span>{`${ru ? "Текст" : "Text"}: “${rule.text.trim()}”`}</span></li>}
    </ul>}
  </section>;
}
