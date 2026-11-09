import { useState } from "react";
import type { TmsLocale } from "../../../../../localization/model/locale";
import { useMemberName } from "../../../../../workspace/members/state/useMemberName";
import { PropertyAssigneeField } from "../PropertyAssigneeField";

export function PropertyIdentityField({ workspaceId, locale, value, onChange, disabled, offline = false }: {
  workspaceId: string;
  locale: TmsLocale;
  value: string | null;
  onChange(value: string | null): void;
  disabled?: boolean;
  offline?: boolean;
}) {
  const member = useMemberName(workspaceId, value, offline);
  const [chosen, setChosen] = useState<{ workspaceId: string; identityId: string; displayName: string } | null>(null);
  const chosenName = chosen?.workspaceId === workspaceId && chosen.identityId === value ? chosen.displayName : null;
  const displayName = member.name ?? chosenName ?? (locale === "ru" ? "Назначенный участник" : "Assigned member");
  return <PropertyAssigneeField workspaceId={workspaceId} locale={locale} disabled={disabled} offline={offline} includeAgents
    value={value ? { identityId: value, displayName } : null} onChange={person => {
      setChosen(person ? { ...person, workspaceId } : null);
      onChange(person?.identityId ?? null);
    }} />;
}
