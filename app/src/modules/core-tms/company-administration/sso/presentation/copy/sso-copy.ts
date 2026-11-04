export function ssoCopy(locale: "ru" | "en") {
  return locale === "ru" ? {
    title: "Единый вход", intro: "Безопасность компании · SAML SSO", draft: "Черновик", tested: "Проверено", enabled: "Включено", enforced: "Обязательно",
    sp: "Параметры Falcon для провайдера", copy: "Скопировать", copied: "Скопировано", copyFailed: "Не удалось скопировать",
    entity: "SP Entity ID", acs: "ACS URL", metadata: "Metadata URL", edit: "Настроить провайдера", issuer: "IdP Entity ID",
    entry: "HTTPS SSO URL", attribute: "Атрибут стабильного subject", certificate: "Сертификат подписи X.509 (PEM)", rotation: "Второй сертификат для ротации (необязательно)",
    save: "Сохранить черновик", changeHint: "Изменение провайдера отключит SSO и потребует повторной проверки.", test: "Проверить вход", refresh: "Обновить статус",
    enable: "Включить SSO", disable: "Отключить SSO", enforce: "Сделать SSO обязательным", optional: "Сделать SSO дополнительным",
    policy: "Режим входа", testHint: "Свяжите свой subject с вашей учётной записью, затем проверьте вход у провайдера. Включение доступно после успешной проверки этой версии.",
    recovery: "Если обязательный SSO перестанет работать, владелец компании обращается к оператору Falcon. Оператор после проверки обращения может снять обязательность; доступ к данным компании ему не выдаётся.",
    agree: "Я понимаю порядок восстановления и хочу требовать SSO для компании", subjects: "Разрешённые сотрудники", subject: "Subject у провайдера",
    member: "Сотрудник Falcon", search: "Найти сотрудника", choose: "Выберите сотрудника", bind: "Связать сотрудника", more: "Показать ещё",
    empty: "Пока нет связанных сотрудников.", mappingHint: "Только явно связанные активные сотрудники смогут войти. Совпадение email не выдаёт доступ.",
    error: "Не удалось сохранить. Проверьте настройки и повторите попытку.", conflict: "Настройки изменились. Обновите статус и повторите действие.",
  } : {
    title: "Single sign-on", intro: "Company security · SAML SSO", draft: "Draft", tested: "Tested", enabled: "Enabled", enforced: "Required",
    sp: "Falcon details for your provider", copy: "Copy", copied: "Copied", copyFailed: "Could not copy",
    entity: "SP Entity ID", acs: "ACS URL", metadata: "Metadata URL", edit: "Configure provider", issuer: "IdP Entity ID",
    entry: "HTTPS SSO URL", attribute: "Stable subject attribute", certificate: "X.509 signing certificate (PEM)", rotation: "Second certificate for rotation (optional)",
    save: "Save draft", changeHint: "Changing the provider disables SSO and requires a new successful test.", test: "Test sign-in", refresh: "Refresh status",
    enable: "Enable SSO", disable: "Disable SSO", enforce: "Require SSO", optional: "Make SSO optional",
    policy: "Sign-in policy", testHint: "Map your subject to your Falcon account, then test sign-in with your provider. Enabling requires a successful test of this version.",
    recovery: "If required SSO stops working, the company owner contacts a Falcon operator. After verifying the request, the operator can remove the requirement without receiving access to company data.",
    agree: "I understand recovery and want to require SSO for this company", subjects: "Allowed employees", subject: "Provider subject",
    member: "Falcon employee", search: "Find an employee", choose: "Choose an employee", bind: "Map employee", more: "Show more",
    empty: "No employees are mapped yet.", mappingHint: "Only explicitly mapped active employees can sign in. Matching email alone never grants access.",
    error: "Could not save. Check the configuration and try again.", conflict: "The configuration has changed. Refresh the status and try again.",
  };
}
export type SsoCopy = ReturnType<typeof ssoCopy>;
