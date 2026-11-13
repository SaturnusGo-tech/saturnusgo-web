'use client';
import { Search, UsersRound } from 'lucide-react';
import type { TeamMember } from '../../domain/team';
import { TeamMemberCard } from '../card/TeamMemberCard';
import { ErrorToast } from '../../../presentation/common/error/ErrorToast';
import { TessiqLoader } from '../../../presentation/common/loading/TessiqLoader';
import styles from './team-page.module.css';
export function TeamPage({workspaceId,workspaceName,ru,items,search,onSearch,loading,loadingMore,error,nextCursor,onMore}: {
  workspaceId:string;workspaceName:string;ru:boolean;items:readonly TeamMember[];search:string;onSearch(value:string):void;
  loading:boolean;loadingMore:boolean;error:unknown;nextCursor:string|null;onMore():void;
}) {
  return <section className={styles.page} aria-label={ru?'Моя команда':'My team'}>
    <header className={styles.header}><div><h1>{ru?'Моя команда':'My team'}</h1><p>{workspaceName}</p></div>
      <label className={styles.search} data-input-shell><Search size={17} aria-hidden="true" />
        <input type="search" maxLength={120} value={search} onChange={event=>onSearch(event.target.value)}
          aria-label={ru?'Найти участника':'Find a teammate'} placeholder={ru?'Найти участника':'Find a teammate'} /></label>
    </header>
    <ErrorToast message={error?(ru?'Не удалось загрузить команду.':'Could not load the team.'):null} />
    {loading?<div className={styles.loading}><TessiqLoader label={ru?'Загружаем команду':'Loading your team'} branded /></div>:
      items.length?<><div className={styles.grid}>{items.map(member=><TeamMemberCard key={member.id} member={member} workspaceId={workspaceId} ru={ru}/>)}</div>
        {nextCursor&&<div className={styles.more}><button type="button" disabled={loadingMore} onClick={onMore} aria-busy={loadingMore}>
          {loadingMore?(ru?'Загружаем…':'Loading…'):(ru?'Ещё участники':'More teammates')}</button></div>}</>:
      !error&&<div className={styles.empty}><UsersRound size={32} strokeWidth={1.3}/><h2>{search?(ru?'Никого не нашли':'No teammates found'):(ru?'Здесь появится ваша команда':'Your team will appear here')}</h2>
        {search&&<p>{ru?'Попробуйте другое имя.':'Try another name.'}</p>}</div>}
  </section>;
}
