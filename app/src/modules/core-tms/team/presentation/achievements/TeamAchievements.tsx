import { LockKeyhole } from 'lucide-react';
import type { TeamMember } from '../../domain/team';
import { achievementCatalog } from '../../../profile/self/content/achievement-catalog';
import styles from './team-achievements.module.css';
export function TeamAchievements({achievements,ru}:{achievements:TeamMember['achievements'];ru:boolean}) {
  const earned = new Set(achievements.items.map(item=>item.slug));
  const unlocked = achievements.items.flatMap(item=>achievementCatalog.filter(story=>story.slug===item.slug));
  const locked = achievementCatalog.filter(story=>story.slug===achievements.lockedPreview?.slug);
  const visible = [...unlocked,...locked].slice(0,4);
  return <div className={styles.collection}>
    <div className={styles.badges} aria-label={ru?'Достижения':'Achievements'}>{visible.map(story=>
      <span key={story.slug} className={styles.badge} data-locked={!earned.has(story.slug)||undefined} data-preview={!earned.has(story.slug)||undefined}
        title={`${ru?story.nameRu:story.nameEn}${earned.has(story.slug)?'':ru?' · Не получено':' · Locked'}`}>
        <img src={story.image} alt={ru?story.nameRu:story.nameEn} width={62} height={62} loading="lazy"/>
        {!earned.has(story.slug)&&<LockKeyhole size={13} aria-label={ru?'Не получено':'Locked'}/>}</span>)}</div>
    <p>{ru?`Получено ${achievements.earned} из ${achievements.total}`:`${achievements.earned} of ${achievements.total} earned`}
      <span> · {ru?`Осталось ${achievements.remaining}`:`${achievements.remaining} to unlock`}</span></p>
  </div>;
}
