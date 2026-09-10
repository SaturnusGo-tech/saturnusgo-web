"use client";
import { UserRound } from "lucide-react";
import { useMemberAvatarLoader } from "./useMemberAvatarLoader";
import { useOptionalTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { ManagedAvatarImage } from "../../../auth/managed/presentation/avatar/ManagedAvatarImage";
import styles from "./member-avatar.module.css";
export function MemberAvatar({ identityId, name, offline = false }: { identityId: string | null; name: string; offline?: boolean }) {
  const session = useOptionalTmsSession();
  const load = useMemberAvatarLoader(identityId);
  if (!identityId) return <span className={styles.avatar} aria-hidden="true"><UserRound size={15} strokeWidth={1.5} /></span>;
  return <ManagedAvatarImage className={styles.avatar} name={name} hasAvatar={!offline && session?.kind === "managed" && Boolean(identityId)} load={load} />;
}
