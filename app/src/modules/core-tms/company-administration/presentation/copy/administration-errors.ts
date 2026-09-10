export function administrationError(code: string, locale: "ru" | "en"): string {
  const messages: Record<string, readonly [string, string]> = {
    VERSION_CONFLICT: ["Данные уже изменились. Обновите страницу и повторите действие.", "These details have changed. Refresh and try again."],
    IDEMPOTENCY_CONFLICT: ["Запрос уже обработан с другими данными. Обновите страницу.", "This request was processed with different details. Refresh the page."],
    QUOTA_EXCEEDED: ["Лимит участников достигнут или меньше занятых мест.", "The member limit is reached or is below the occupied seats."],
    OWNER_REQUIRED: ["У компании должен оставаться активный главный администратор с настроенным двухэтапным входом.", "The company needs an active primary administrator with two-step sign-in."],
    DOMAIN_CONFLICT: ["Этот адрес уже занят. Выберите другой.", "This address is already in use. Choose another one."],
    ACCOUNT_CONFLICT: ["Логин или email уже используется в этой компании.", "The username or email is already used in this company."],
    INVALID_CREDENTIALS: ["Текущий пароль не подошёл.", "The current password is incorrect."],
    INVALID_SECOND_FACTOR: ["Код не подошёл или уже использован.", "The code is invalid or already used."],
    MFA_REQUIRED: ["Введите код из приложения или резервный код.", "Enter an authenticator or recovery code."],
    REAUTHENTICATION_REQUIRED: ["Подтвердите вход и повторите действие.", "Confirm your identity and retry this action."],
    ACCESS_DENIED: ["Недостаточно прав для этого действия.", "You do not have permission for this action."],
    SESSION_REQUIRED: ["Сессия завершена. Войдите снова.", "Your session has ended. Sign in again."],
    TENANT_UNAVAILABLE: ["Доступ компании приостановлен.", "Company access is unavailable."],
    NOT_FOUND: ["Запись не найдена или недоступна.", "This record was not found or is unavailable."],
    INVALID_INPUT: ["Проверьте заполненные поля.", "Please check the form fields."],
    VALIDATION_ERROR: ["Проверьте заполненные поля.", "Please check the form fields."],
    RATE_LIMITED: ["Слишком много попыток. Попробуйте позже.", "Too many attempts. Try again later."],
  };
  return (messages[code] ?? ["Не удалось выполнить действие. Попробуйте ещё раз.", "Could not complete the action. Please try again."])[locale === "ru" ? 0 : 1];
}
