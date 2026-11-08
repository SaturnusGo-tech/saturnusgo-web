"use client";

import type { TmsLocale } from "../../../localization/model/locale";
import { PriorityIcon, priorityLevels, type PriorityLevel } from "./PriorityIcon";
import { PropertySelect } from "./select/PropertySelect";

type Priority = Exclude<PriorityLevel, "none"> | null;

export function PriorityField({ locale, value, onChange, disabled, compact, autoOpen, onRequestEdit }: {
  locale: TmsLocale;
  value: PriorityLevel | null;
  onChange?(value: Priority): void;
  disabled?: boolean;
  compact?: boolean;
  autoOpen?: boolean;
  onRequestEdit?: () => void;
}) {
  const ru = locale === "ru";
  return <PropertySelect<PriorityLevel> locale={locale} value={value ?? "none"} disabled={disabled} compact={compact} autoOpen={autoOpen}
    label={ru ? "Приоритет" : "Priority"} searchLabel={ru ? "Изменить приоритет…" : "Change priority to…"}
    options={priorityLevels.map(({ key, ...labels }, index) => ({
      value: key, label: labels[locale], icon: <PriorityIcon level={key} />, shortcut: String(index),
    }))}
    onRequestEdit={onRequestEdit} onChange={onChange && ((level) => onChange(level === "none" ? null : level))} />;
}
