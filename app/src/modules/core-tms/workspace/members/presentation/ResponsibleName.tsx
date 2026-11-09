
import { MemberProfilePreview } from "./profile/MemberProfilePreview";
import { MemberAvatar } from "../avatar/MemberAvatar";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useMemberName } from "../state/useMemberName";

export function ResponsibleName({ workspaceId, identityId, offline = false, profileLabel }: {
  workspaceId: string; identityId: string | null; offline?: boolean; profileLabel?: string;
}) {
  const { locale } = useTmsLocale();
  const member = useMemberName(workspaceId, identityId, offline);
  const label = !identityId ? (locale === "ru" ? "Не назначен" : "Not assigned")
    : member.loading ? (locale === "ru" ? "Загрузка…" : "Loading…")
    : member.name ?? (locale === "ru" ? "Участник недоступен" : "Member unavailable");
  if (member.loading) return <span role="status" aria-label={label} style={{ display: "inline-block", width: 120, height: 24, borderRadius: 8, background: "var(--control-hover)" }} />;
  const profileName = profileLabel && identityId ? member.name : null;
  const display = <span data-case-member-name={profileLabel ? "" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0 }}>
    <MemberAvatar workspaceId={workspaceId} actor={member.actor} identityId={identityId} name={member.name ?? ""} offline={offline} />
    <span title={profileName ? undefined : label}>{label}</span>
  </span>;
  return identityId && profileName
    ? <MemberProfilePreview workspaceId={workspaceId} identityId={identityId} name={profileName} locale={locale}
      actor={member.actor} offline={offline} triggerLabel={`${profileLabel}, ${profileName}`}>{display}</MemberProfilePreview>
    : display;
}
