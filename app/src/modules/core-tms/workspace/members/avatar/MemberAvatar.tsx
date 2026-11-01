"use client";
import { UserRound } from "lucide-react";
import { useMemberAvatarLoader } from "./useMemberAvatarLoader";
import { useOptionalTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { ManagedAvatarImage } from "../../../auth/managed/presentation/avatar/ManagedAvatarImage";
import { useWorkspacePeople } from "../context/WorkspacePeopleContext";
import { useWorkspaceActor } from "../state/actors/useWorkspaceActor";
import type { WorkspaceActor } from "../model/actors/workspace-actor";
import { CodexMark } from "../../../codex-employee/presentation/branding/CodexMark";
import styles from "./member-avatar.module.css";
export function MemberAvatar({ identityId, name, offline = false, actor, workspaceId }: {
  identityId: string | null; name: string; offline?: boolean; actor?: WorkspaceActor | null; workspaceId?: string;
}) {
  const session = useOptionalTmsSession();
  const people = useWorkspacePeople();
  const resolved = useWorkspaceActor(workspaceId ?? (people.workspaceId || session?.workspaceId || ""), identityId, offline, actor);
  const human = resolved.actor?.kind === "human";
  const load = useMemberAvatarLoader(human ? identityId : null);
  if (!identityId) return <span className={styles.avatar} aria-hidden="true"><UserRound size={15} strokeWidth={1.5} /></span>;
  if (resolved.actor?.kind === "agent" && resolved.actor.provider === "codex") return <CodexMark className={styles.avatar} />;
  return <ManagedAvatarImage className={styles.avatar} name={name} hasAvatar={human && !offline && session?.kind === "managed"} load={load} />;
}
