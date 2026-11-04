export function signInCopy(locale: "ru" | "en") {
  return locale === "ru" ? {
    login: "Войти в Falcon", signup: "Создать личное пространство", google: "Продолжить с Google",
    email: "Продолжить с email", saml: "Продолжить с SAML SSO", signupLink: "Создать личное пространство",
    loginLink: "Уже есть аккаунт? Войти", emailTitle: "Войти с email", signupEmail: "Ваш email",
    emailLabel: "Email", send: "Отправить код", codeTitle: "Проверьте почту", codeLabel: "Код из письма",
    codeBody: "Введите одноразовый код, отправленный на", verify: "Продолжить", resend: "Отправить ещё раз",
    wait: "Повторная отправка через", seconds: "с", back: "Назад", company: "Адрес компании", ssoTitle: "Войти через SSO",
    organizationHint: "Короткое имя или адрес вашей компании в Falcon", continue: "Продолжить", loading: "Загрузка способов входа",
    unavailable: "Этот способ входа пока недоступен. Выберите другой.", error: "Не удалось продолжить. Повторите попытку.",
    expired: "Код истёк или не подходит. Проверьте код или запросите новый.", cancel: "Отменить вход",
    trial: "Ваши 7 дней с Falcon начались", ends: "Пробный период до", team: "Для команды", close: "Закрыть уведомление",
    payment: "Оплата пока недоступна", readonly: "Пробный период завершён. Просмотр и экспорт доступны.",
    retry: "Повторить", signupOff: "Создание личного пространства пока недоступно.",
  } : {
    login: "Log in to Falcon", signup: "Create your personal workspace", google: "Continue with Google",
    email: "Continue with email", saml: "Continue with SAML SSO", signupLink: "Create a personal workspace",
    loginLink: "Already have an account? Log in", emailTitle: "Log in with email", signupEmail: "Your email",
    emailLabel: "Email", send: "Send code", codeTitle: "Check your email", codeLabel: "Email verification code",
    codeBody: "Enter the one-time code sent to", verify: "Continue", resend: "Send again",
    wait: "Send again in", seconds: "s", back: "Back", company: "Company address", ssoTitle: "Log in with SSO",
    organizationHint: "Your company's short name or Falcon address", continue: "Continue", loading: "Loading sign-in methods",
    unavailable: "This sign-in method is unavailable. Choose another method.", error: "Could not continue. Please try again.",
    expired: "The code has expired or is incorrect. Check it or request a new code.", cancel: "Cancel sign-in",
    trial: "Your 7 days with Falcon have started", ends: "Trial ends", team: "For your team", close: "Dismiss notification",
    payment: "Payments are not available yet", readonly: "Your trial has ended. Viewing and export remain available.",
    retry: "Try again", signupOff: "Personal workspace signup is not available yet.",
  };
}
export type SignInCopy = ReturnType<typeof signInCopy>;
