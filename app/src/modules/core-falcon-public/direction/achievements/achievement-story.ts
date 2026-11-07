import type { LandingLocale } from '../../landing/localization/model/locale';

export const achievementStory = {
  en: {
    title: 'Achievements backed\nby real work.',
    body: 'Forty achievements for thoughtful coverage, completed checks, verified defects and helping your team. Build a collection that tells your story as a QA engineer.',
    action: 'Start your collection',
    compact: {
      title: 'QA achievements',
      body: 'Earn 40 achievements for testing, verifying defects and helping your team.',
      action: 'Start collecting',
    },
    collection: 'A few of Falcon’s 40 QA achievements',
    note: 'Earned through your work. Part of your profile.',
    pause: 'Pause achievement animation',
    resume: 'Resume achievement animation',
    badgeNames: ['Boundary Patrol', 'Common Language', 'One Hundred Checks', 'First Signal', 'Closed Loop', 'Team Support', 'Full QA Cycle'],
  },
  ru: {
    title: 'Достижения, за которыми\nстоит реальная работа.',
    body: 'Сорок достижений за продуманное покрытие, выполненные проверки, подтверждённые дефекты и помощь команде. Соберите коллекцию, которая расскажет о вас как о QA.',
    action: 'Начать свою коллекцию',
    compact: {
      title: 'Достижения QA',
      body: '40 достижений за тесты, подтверждённые дефекты и помощь команде.',
      action: 'Начать',
    },
    collection: 'Несколько из 40 достижений QA в Falcon',
    note: 'За вашу работу. В вашем профиле.',
    pause: 'Приостановить анимацию достижений',
    resume: 'Продолжить анимацию достижений',
    badgeNames: ['Дозор границ', 'Общий язык', 'Сто проверок', 'Первый сигнал', 'Замкнутый цикл', 'Опора команды', 'Полный цикл QA'],
  },
} satisfies Record<LandingLocale, {
  title: string; body: string; action: string; compact: { title: string; body: string; action: string };
  collection: string; note: string; pause: string; resume: string; badgeNames: string[];
}>;

export const featuredAchievementArt = [
  '03-boundary-patrol',
  '08-common-language',
  '12-hundred-checks',
  '21-first-signal',
  '30-closed-loop',
  '35-team-support',
  '40-full-qa-cycle',
] as const;
