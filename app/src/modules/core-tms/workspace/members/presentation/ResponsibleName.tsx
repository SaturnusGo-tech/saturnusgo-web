import { PiUserCircle } from "react-icons/pi";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useMemberName } from "../state/useMemberName";

export function ResponsibleName({ workspaceId, identityId, offline = false }: { workspaceId: string; identityId: string | null; offline?: boolean }) {
  const { locale } = useTmsLocale();
  const member = useMemberName(workspaceId, identityId, offline);
  const label = !identityId ? (locale === "ru" ? "Не назначен" : "Not assigned")
    : member.loading ? (locale === "ru" ? "Загрузка…" : "Loading…")
    : member.name ?? (locale === "ru" ? "Участник недоступен" : "Member unavailable");
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0 }}>
    <PiUserCircle size={23} aria-hidden="true" style={{ flexShrink: 0, color: "var(--muted)" }} />
    <span title={label}>{label}</span>
  </span>;
}
