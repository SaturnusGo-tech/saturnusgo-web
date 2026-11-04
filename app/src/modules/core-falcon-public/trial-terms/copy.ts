export const TRIAL_TERMS_VERSION = "2026-11-04";
export function trialTermsCopy(locale: "en" | "ru") {
  return locale === "ru" ? {
    title: "Условия личного пробного доступа", updated: `4 ноября 2026 · Версия ${TRIAL_TERMS_VERSION}`, back: "Вернуться в Falcon", language: "Язык", privacy: "Политика конфиденциальности",
    intro: "Эти правила относятся к личному семидневному пробному пространству Falcon. Доступ к компании предоставляется отдельно её администратором.",
    sections: [
      ["Один человек, семь дней", "Личное пространство предназначено для одного человека. Срок начинается, когда Falcon успешно создаёт пространство после необходимого подтверждения email, в том числе после регистрации через Google. Повторный вход, другое устройство, переустановка приложения или добавление способа входа к тому же подтверждённому аккаунту не запускают новую неделю. Не передавайте аккаунт другим людям."],
      ["После окончания срока", "Просмотр и экспорт данных остаются доступны. Создание, изменения и выполнение тестов в личном пространстве блокируются. Окончание семи дней само по себе не запускает автоматическое удаление пространства. Вопросы хранения и запросов о данных описаны в политике конфиденциальности."],
      ["Платежи", "Пробный доступ не запрашивает платёжные реквизиты и не запускает списания. Оплата сейчас недоступна. Автоматического перехода на платную подписку нет."],
      ["Приглашения в компанию", "Приглашение в компанию — отдельное предоставление доступа с её действующими ролями, проектами и проверками входа. Окончание личного пробного доступа не прекращает независимо предоставленный доступ к компании. Пробный доступ сам по себе не создаёт членство в компании и не переносит в неё личные данные."],
      ["Разрешённое использование и связь", "Используйте Falcon только для сайтов, приложений и содержимого, которые вы уполномочены тестировать и обрабатывать. Передавайте только данные, на передачу которых у вас есть право. По вопросам пробного доступа и входа пишите на falcon@saturnusgo.com."],
    ],
  } : {
    title: "Personal trial terms", updated: `4 November 2026 · Version ${TRIAL_TERMS_VERSION}`, back: "Back to Falcon", language: "Language", privacy: "Privacy policy",
    intro: "These rules apply to Falcon's personal seven-day trial workspace. Company access is granted separately by the company administrator.",
    sections: [
      ["One person, seven days", "A personal workspace is for one human. The period starts when Falcon successfully creates the workspace after required email verification, including verification after Google signup. Signing in again, another device, reinstalling the app or adding a sign-in method to the same verified account does not start another week. Do not share the account with other people."],
      ["After the trial", "Viewing and export remain available. Creating, changing data and executing tests in the personal workspace are blocked. The end of seven days does not itself trigger automatic workspace deletion. Storage and data requests are described in the privacy policy."],
      ["Payments", "This trial does not collect payment details or initiate charges. Payments and checkout are currently unavailable. There is no automatic paid subscription renewal."],
      ["Company invitations", "A company invitation is a separate grant of access with that company's existing roles, projects and sign-in checks. Ending the personal trial does not end independently granted company access. The trial itself does not create company membership or move personal data into a company."],
      ["Authorized use and contact", "Use Falcon only for sites, applications and content you are authorized to test and handle. Provide only data you have authority to share. For trial and access questions, contact falcon@saturnusgo.com."],
    ],
  };
}
