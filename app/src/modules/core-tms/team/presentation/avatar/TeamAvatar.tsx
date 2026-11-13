'use client';
import { useState } from 'react';
import type { TeamMember } from '../../domain/team';
import { CodexMark } from '../../../codex-employee/presentation/branding/CodexMark';
import { avatarCharacter } from '../../../profile/avatars/content/avatar-characters';
import styles from './team-avatar.module.css';
export function TeamAvatar({member}:{member:TeamMember}) {
  const [failed,setFailed] = useState<readonly string[]>([]);
  const image = [member.avatarUrl,avatarCharacter(member.avatarCharacterId)?.image].find(url=>url&&!failed.includes(url));
  return <span className={styles.avatar} aria-hidden="true">{member.kind==='agent'?<CodexMark className={styles.agent}/>:
    image?<img src={image} alt="" width={80} height={80} loading="lazy" onError={()=>setFailed(value=>[...value,image])}/>:member.name.trim().slice(0,2).toUpperCase()}</span>;
}
