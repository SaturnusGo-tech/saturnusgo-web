'use client';
import { ArrowUpRight } from 'lucide-react';
import type { TeamMember } from '../../domain/team';
import { MemberProfileLink } from '../../../profile/presentation/MemberProfileLink';
import { memberRoleLabel } from '../../../company-administration/presentation/permissions/member-role-label';
import { TeamAvatar } from '../avatar/TeamAvatar';
import { TeamAchievements } from '../achievements/TeamAchievements';
import styles from './team-member-card.module.css';
export function TeamMemberCard({member,workspaceId,ru}:{member:TeamMember;workspaceId:string;ru:boolean}) {
  const agent = member.kind === 'agent';
  const role = agent?(ru?'Агент QA':'QA agent'):memberRoleLabel(member.role,ru?'ru':'en');
  return <MemberProfileLink className={styles.card} workspaceId={workspaceId} identityId={member.id}
    aria-label={`${ru?'Открыть профиль':'Open profile'}: ${member.name}`}>
    <div className={styles.identity}><TeamAvatar member={member}/><div className={styles.person}>
      <h2>{member.name}</h2><p>{role}</p><span className={styles.status} data-active={member.status==='active'}>
        <i/>{member.presence==='online'?(ru?'В сети':'Online'):member.status==='active'?(agent?(ru?'Подключён':'Connected'):(ru?'Участник команды':'Team member')):(ru?'Неактивен':'Inactive')}</span>
    </div><ArrowUpRight size={17} className={styles.arrow} aria-hidden="true"/></div>
    <TeamAchievements achievements={member.achievements} ru={ru}/>
  </MemberProfileLink>;
}
