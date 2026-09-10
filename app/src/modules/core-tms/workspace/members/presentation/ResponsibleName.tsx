import { MemberAvatar } from "../avatar/MemberAvatar";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useMemberName } from "../state/useMemberName";

export function ResponsibleName({ workspaceId, identityId, offline = false }: { workspaceId: string; identityId: string | null; offline?: boolean }) {
  const { locale } = useTmsLocale();
  const member = useMemberName(workspaceId, identityId, offline);
  const label = !identityId ? (locale === "ru" ? "Не назначен" : "Not assigned")
    : member.loading ? (locale === "ru" ? "Загрузка…" : "Loading…")
    : member.name ?? (locale === "ru" ? "Участник недоступен" : "Member unavailable");
  if (member.loading) return <span role="status" aria-label={label} style={{ display: "inline-block", width: 120, height: 24, borderRadius: 8, background: "var(--control-hover)" }} />;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0 }}>
    <MemberAvatar identityId={identityId} name={member.name ?? ""} offline={offline} />
    <span title={label}>{label}</span>
  </span>;
}
