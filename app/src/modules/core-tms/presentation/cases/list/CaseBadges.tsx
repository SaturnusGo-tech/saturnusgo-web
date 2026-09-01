import {
  Archive, Ban, Bot, CheckCircle2, ChevronUp, ChevronsDown, ChevronsUp,
  CircleDashed, Clock3, Hand, ListChecks, Minus,
} from "lucide-react";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { localizedLabel } from "../../../localization/format/labels";
import type { TmsLocale } from "../../../localization/model/locale";
import styles from "../detail/metadata/caseMetadata.module.css";

export function LifecycleBadge({ locale, lifecycle, archived }: {
  locale: TmsLocale;
  lifecycle: TestCaseSummary["lifecycle"];
  archived?: boolean;
}) {
  const value = archived ? "archived" : lifecycle;
  const icon = value === "archived" ? <Archive size={11} />
    : value === "ready" ? <CheckCircle2 size={11} />
    : value === "deprecated" ? <Ban size={11} /> : <CircleDashed size={11} />;
  return <span className={`${styles.chip} ${styles[`lifecycle${capital(value)}`]}`}>{icon}{localizedLabel(locale, value)}</span>;
}

export function PriorityBadge({ locale, priority }: {
  locale: TmsLocale;
  priority: TestCaseSummary["priority"];
}) {
  const icon = priority === "critical" ? <ChevronsUp size={12} />
    : priority === "high" ? <ChevronUp size={12} />
    : priority === "medium" ? <Minus size={12} /> : <ChevronsDown size={12} />;
  return <span className={`${styles.chip} ${styles[`priority${capital(priority)}`]}`}>{icon}{localizedLabel(locale, priority)}</span>;
}

export function CaseTypeIcon({ locale, type, size = 13 }: {
  locale: TmsLocale;
  type: TestCaseSummary["type"];
  size?: number;
}) {
  const label = localizedLabel(locale, type);
  if (type === "automated") return <Bot size={size} aria-label={label} />;
  if (type === "checklist") return <ListChecks size={size} aria-label={label} />;
  return <Hand size={size} aria-label={label} />;
}

export function TypeBadge({ locale, type }: {
  locale: TmsLocale;
  type: TestCaseSummary["type"];
}) {
  const icon = <span aria-hidden="true"><CaseTypeIcon locale={locale} type={type} size={11} /></span>;
  return <span className={`${styles.chip} ${styles[`type${capital(type)}`]}`}>{icon}{localizedLabel(locale, type)}</span>;
}

export function EstimateBadge({ locale, minutes }: { locale: TmsLocale; minutes: number | null }) {
  const label = minutes === null
    ? (locale === "ru" ? "Без оценки" : "No estimate")
    : `${minutes} ${locale === "ru" ? "мин" : "min"}`;
  return <span className={`${styles.chip} ${styles.estimate}`}><Clock3 size={11} />{label}</span>;
}

const capital = (value: string) => `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
