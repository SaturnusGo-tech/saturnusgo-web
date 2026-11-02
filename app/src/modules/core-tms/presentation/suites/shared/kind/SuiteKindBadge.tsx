import { PiArrowsClockwise, PiArchive, PiListChecks } from "react-icons/pi";
import css from "./kind.module.css";

export function SuiteKindBadge({ type, archived = false, ru }: { type: "static" | "dynamic"; archived?: boolean; ru: boolean }) {
  const mode = archived ? "archived" : type;
  const label = archived ? (ru ? "В архиве" : "Archived") : type === "dynamic" ? (ru ? "По правилам" : "Automatic") : (ru ? "Вручную" : "Manual");
  const Icon = archived ? PiArchive : type === "dynamic" ? PiArrowsClockwise : PiListChecks;
  return <span className={css.badge} data-suite-kind={mode} title={archived ? (ru ? "Сьют доступен только для просмотра" : "This suite is read-only") : type === "dynamic" ? (ru ? "Состав обновляется автоматически по правилам" : "Membership updates automatically from rules") : (ru ? "Кейсы выбраны вручную" : "Cases selected manually")}><Icon size={13} aria-hidden="true" />{label}</span>;
}
