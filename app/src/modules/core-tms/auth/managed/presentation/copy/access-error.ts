export function accessError(code: string, locale: "ru" | "en"): string {
  const messages: Record<string, readonly [string, string]> = {
    INVALID_CREDENTIALS: ["Проверьте логин и пароль или обратитесь к администратору.", "Check your credentials or contact your administrator."],
    RATE_LIMITED: ["Слишком много попыток. Попробуйте немного позже.", "Too many attempts. Please try again later."],
    INVALID_SECOND_FACTOR: ["Код не подошёл или уже использован. Введите новый код.", "This code is invalid or already used. Enter a new code."],
    INVALID_RECOVERY_CODE: ["Резервный код не подошёл или уже использован.", "This recovery code is invalid or already used."],
    SESSION_REQUIRED: ["Сессия завершена. Войдите снова.", "Your session has ended. Sign in again."],
    PASSWORD_REUSE: ["Новый пароль должен отличаться от предыдущего.", "Choose a password different from your previous password."],
    INVALID_PASSWORD: ["Используйте от 12 до 128 символов для пароля.", "Use between 12 and 128 characters for your password."],
    TENANT_UNAVAILABLE: ["Доступ компании сейчас недоступен. Обратитесь к администратору.", "Company access is unavailable. Contact your administrator."],
    INVALID_RESPONSE: ["Не удалось получить ответ от Falcon. Попробуйте ещё раз.", "Could not read Falcon’s response. Please try again."],
  };
  return (messages[code] ?? ["Не удалось выполнить действие. Попробуйте ещё раз.", "Could not complete the action. Please try again."])[locale === "ru" ? 0 : 1];
}
