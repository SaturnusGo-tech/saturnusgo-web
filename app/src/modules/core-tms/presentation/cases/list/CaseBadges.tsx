import { Archive } from "lucide-react";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { localizedLabel } from "../../../localization/format/labels";
import type { TmsLocale } from "../../../localization/model/locale";
import styles from "../listing/caseListing.module.css";

export function LifecycleBadge({
  locale,
  lifecycle,
  archived,
}: {
  locale: TmsLocale;
  lifecycle: TestCaseSummary["lifecycle"];
  archived?: boolean;
}) {
  const value = archived ? "archived" : lifecycle;
  return (
    <span className={`${styles.statusBadge} ${styles[`status_${value}`]}`}>
      {archived && <Archive size={12} aria-hidden="true" />}
      {localizedLabel(locale, value)}
    </span>
  );
}

export function PriorityBadge({
  locale,
  priority,
}: {
  locale: TmsLocale;
  priority: TestCaseSummary["priority"];
}) {
  return (
    <span className={`${styles.priorityBadge} ${styles[`priority_${priority}`]}`}>
      <i aria-hidden="true" />
      {localizedLabel(locale, priority)}
    </span>
  );
}
