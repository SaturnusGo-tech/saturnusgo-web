"use client";

import { Bot, Clock3, SquareUserRound } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { memberRoleLabel } from "../../../../company-administration/presentation/permissions/member-role-label";
import { FalconTooltip } from "../../../../presentation/common/tooltip/FalconTooltip";
import type { TmsLocale } from "../../../../localization/model/locale";
import { MemberAvatar } from "../../avatar/MemberAvatar";
import type { WorkspaceActor } from "../../model/actors/workspace-actor";
import { useWorkspaceActor } from "../../state/actors/useWorkspaceActor";
import styles from "./member-profile-preview.module.css";

export type MemberProfileContentProps = {
  workspaceId: string; identityId: string; name: string; locale: TmsLocale; offline?: boolean; actor?: WorkspaceActor | null;
};

const avatarColors = ["#f98d5a", "#6f79cf", "#548a81", "#b86381", "#7e60ad", "#a6714d"];

function avatarColor(identityId: string) {
  let hash = 0;
  for (const character of identityId) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) | 0;
  return avatarColors[(hash >>> 0) % avatarColors.length];
}

function useMemberLocalTime(locale: TmsLocale, timeZone?: string | null) {
  const formatter = useMemo(() => {
    if (!timeZone) return null;
    try {
      return new Intl.DateTimeFormat(locale, { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    } catch {
      return null;
    }
  }, [locale, timeZone]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!formatter) return;
    const timer = setTimeout(() => setNow(Date.now()), 60_000 - (Date.now() % 60_000));
    return () => clearTimeout(timer);
  }, [formatter, now]);
  return formatter?.format(now);
}

export function MemberProfileContent({ workspaceId, identityId, name, locale, offline, actor }: MemberProfileContentProps) {
  const { actor: resolved } = useWorkspaceActor(workspaceId, identityId, offline,
    actor?.kind === "agent" ? actor : undefined, { includeSignIn: true });
  const member = resolved ?? actor;
  const human = member?.kind === "human" ? member : null;
  const agent = member?.kind === "agent";
  const displayName = member?.name ?? name;
  const presence = human?.presence;
  const localTime = useMemberLocalTime(locale, human?.timeZone);
  const lastSignedInAt = human?.lastSignedInAt;
  const signIn = lastSignedInAt ? new Date(lastSignedInAt) : null;
  const signInText = signIn && Number.isFinite(signIn.getTime())
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(signIn) : null;
  const showSignIn = signInText && !localTime;
  const ru = locale === "ru";
  const signInLabel = ru ? "Последний вход" : "Last sign-in";
  return <>
    <div className={styles.heading}>
      <span className={styles.avatar} data-human={agent ? undefined : true}
        style={{ "--member-avatar-color": avatarColor(identityId) } as CSSProperties}>
        <MemberAvatar workspaceId={workspaceId} actor={member} identityId={identityId} name={displayName} offline={offline} />
      </span>
      <div className={styles.identity}>
        <strong>{displayName}</strong>
        {human?.email && <span>{human.email}</span>}
      </div>
    </div>
    {(presence || localTime || showSignIn || human?.role || human?.workspaceName || agent) && <div className={styles.details}>
      {presence && <div className={styles.row}>
        <span className={styles.presence} data-presence={presence} aria-hidden="true" />
        <span>{presence === "online" ? (ru ? "В сети" : "Online") : (ru ? "Не в сети" : "Offline")}</span>
      </div>}
      {localTime && <div className={styles.row}>
        <Clock3 size={15} aria-hidden="true" />
        <FalconTooltip label={`${signInLabel} · ${signInText ?? ""}`} isDisabled={!signInText || Boolean(showSignIn)} className={styles.signInTooltip}>
          <span data-profile-clock={signInText && !showSignIn ? true : undefined}
            tabIndex={signInText && !showSignIn ? 0 : undefined}>
            <time dateTime={localTime}>{localTime}</time> <span className={styles.muted}>{ru ? "местное время" : "local time"}</span>
          </span>
        </FalconTooltip>
      </div>}
      {showSignIn && <div className={styles.row}>
        <Clock3 size={15} aria-hidden="true" />
        <span><span className={styles.muted}>{signInLabel}</span>{" "}
          <time dateTime={lastSignedInAt ?? undefined}>{signInText}</time></span>
      </div>}
      {human?.role && <div className={styles.row} data-member-role>
        <SquareUserRound size={15} aria-hidden="true" /><span>{memberRoleLabel(human.role, locale)}</span>
      </div>}
      {human?.workspaceName && <div className={styles.row} data-workspace>
        <SquareUserRound size={15} aria-hidden="true" /><span>{human.workspaceName}</span>
      </div>}
      {agent && <div className={styles.row}><Bot size={15} aria-hidden="true" /><span>{ru ? "Агент Codex" : "Codex agent"}</span></div>}
    </div>}
  </>;
}
