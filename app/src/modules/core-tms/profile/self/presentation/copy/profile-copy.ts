import type { ActivityMetric } from "../../domain/profile-model";

export function profileCopy(ru: boolean) {
  return {
    title: ru ? "Мой профиль" : "My profile", details: ru ? "Данные профиля" : "Profile details",
    name: ru ? "Имя" : "Name", introduction: ru ? "Знакомство" : "Introduction",
    introductionHint: ru ? "Коротко о вашей роли и специализации." : "A short introduction to your role and expertise.",
    bio: ru ? "О себе" : "About", bioHint: ru ? "Поделитесь опытом и тем, над чем любите работать." : "Share your experience and the work you care about.",
    location: ru ? "Город" : "Location", contact: ru ? "Контактная ссылка" : "Contact link",
    contactHint: ru ? "Сайт, профиль или ссылка mailto для связи." : "A website, profile or mailto link where people can reach you.",
    phone: ru ? "Телефон" : "Phone", email: ru ? "Почта аккаунта" : "Account email",
    save: ru ? "Сохранить изменения" : "Save changes", saving: ru ? "Сохраняем…" : "Saving…",
    saved: ru ? "Профиль обновлён" : "Profile updated", retry: ru ? "Повторить" : "Try again",
    loadError: ru ? "Не удалось загрузить профиль." : "Your profile could not be loaded.",
    error: ru ? "Не удалось сохранить изменения. Попробуйте ещё раз." : "Changes could not be saved. Please try again.",
    conflict: ru ? "Профиль изменён в другом окне. Обновите данные перед сохранением." : "Your profile changed in another window. Reload before saving.",
    imageError: ru ? "Выберите изображение JPG, PNG или WebP до 25 МБ." : "Choose a JPG, PNG or WebP image up to 25 MB.",
    avatar: ru ? "Изменить фото" : "Change photo", removeAvatar: ru ? "Удалить фото" : "Remove photo",
    banner: ru ? "Изменить обложку" : "Change cover", removeBanner: ru ? "Вернуть стандартную обложку" : "Restore default cover",
    personal: ru ? "Личное пространство" : "Personal workspace", company: ru ? "Участник команды" : "Team member",
    activity: ru ? "Моя активность" : "My activity", period: ru ? "Период активности" : "Activity period",
    scope: ru ? "Только ваши действия в текущем пространстве · UTC" : "Your own work in this workspace · UTC",
    basis: ru ? "Выполненные попытки учитываются по автору результата. Назначение и запуск теста не считаются выполнением." : "Completed attempts are credited to the result author. Assignment and starting a test do not count as execution.",
    noActivity: ru ? "Здесь появится ваша активность" : "Your activity will appear here",
    noActivityHint: ru ? "Создавайте кейсы, выполняйте проверки и фиксируйте дефекты — график обновится по вашим действиям." : "Create cases, complete checks and report defects to build a picture of your work.",
    activityError: ru ? "Не удалось загрузить активность." : "Activity could not be loaded.",
    noWorkspace: ru ? "Выберите рабочее пространство, чтобы увидеть активность." : "Choose a workspace to view your activity.",
    security: ru ? "Безопасность" : "Security", password: ru ? "Изменить пароль" : "Change password",
    sessions: ru ? "Устройства и сессии" : "Devices and sessions", back: ru ? "К профилю" : "Back to profile",
    count: (days: number) => ru ? `За ${days} дней` : `Last ${days} days`,
    metrics: { executedCases: ru ? "Выполнено попыток" : "Attempts completed", authoredCases: ru ? "Создано кейсов" : "Cases authored",
      defects: ru ? "Дефектов найдено" : "Defects reported", runs: ru ? "Прогонов с участием" : "Runs contributed" } satisfies Record<ActivityMetric, string>,
  };
}
