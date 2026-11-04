export function spaceChoiceCopy(locale: "ru" | "en") {
  return locale === "ru" ? {
    title: "Выберите пространство", loading: "Загружаем ваши пространства", personal: "Личное пространство", company: "Компания",
    empty: "У этой учётной записи пока нет связанных пространств.", back: "К способам входа", retry: "Повторить",
    expired: "Время подтверждения входа истекло. Войдите ещё раз.", unavailable: "Это пространство больше недоступно. Войдите ещё раз.",
    error: "Не удалось открыть ваши пространства. Повторите попытку.", opening: "Открываем пространство…", returning: "Возвращаемся ко входу…",
  } : {
    title: "Choose your workspace", loading: "Loading your workspaces", personal: "Personal workspace", company: "Company",
    empty: "No workspaces are linked to this account yet.", back: "Back to sign-in methods", retry: "Try again",
    expired: "Your sign-in verification has expired. Please sign in again.", unavailable: "This workspace is no longer available. Please sign in again.",
    error: "Could not load your workspaces. Please try again.", opening: "Opening your workspace…", returning: "Returning to sign-in…",
  };
}
