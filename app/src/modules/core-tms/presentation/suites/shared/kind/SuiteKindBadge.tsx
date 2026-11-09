import { PiArrowsClockwise, PiArchive, PiListChecks } from "react-icons/pi";
import css from "./kind.module.css";

export function SuiteKindBadge({ type, archived = false, ru, iconOnly = false }: {
  type: "static" | "dynamic";
  archived?: boolean;
  ru: boolean;
  iconOnly?: boolean;
}) {
  const mode = archived ? "archived" : type;
  const label = archived ? (ru ? "В архиве" : "Archived") : type === "dynamic" ? (ru ? "По правилам" : "Automatic") : (ru ? "Вручную" : "Manual");
  const Icon = archived ? PiArchive : type === "dynamic" ? PiArrowsClockwise : PiListChecks;
  if (iconOnly) return <span className={css.icon} data-suite-kind={mode} title={label} role="img" aria-label={label}>
    <Icon size={17} aria-hidden="true" />
  </span>;
  return <span className={css.badge} data-suite-kind={mode} title={archived ? (ru ? "Сьют доступен только для просмотра" : "This suite is read-only") : type === "dynamic" ? (ru ? "Состав обновляется автоматически по правилам" : "Membership updates automatically from rules") : (ru ? "Кейсы выбраны вручную" : "Cases selected manually")}><Icon size={13} aria-hidden="true" />{label}</span>;
}
