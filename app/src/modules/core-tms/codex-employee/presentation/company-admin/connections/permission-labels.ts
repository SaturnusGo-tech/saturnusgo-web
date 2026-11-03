const labels: Readonly<Record<string, readonly [string, string]>> = {
  "falcon:read": ["Просмотр данных", "Read project data"],
  "falcon:cases:create": ["Создание кейсов", "Create test cases"],
  "falcon:cases:write": ["Изменение кейсов", "Edit test cases"],
  "falcon:repository:write": ["Папки и репозиторий", "Manage folders"],
  "falcon:suites:write": ["Наборы тестов", "Manage test suites"],
  "falcon:environments:write": ["Окружения", "Manage environments"],
  "falcon:runs:create": ["Создание прогонов", "Create runs"],
  "falcon:runs:manage": ["Управление прогонами", "Manage runs"],
  "falcon:execution:write": ["Результаты проверок", "Record test results"],
  "falcon:defects:write": ["Баг-репорты", "Manage defects"],
  "falcon:attachments:write": ["Вложения", "Upload attachments"],
  "falcon:workflows:write": ["Цикл Web QA", "Manage Web QA"],
  offline_access: ["Сохранение подключения", "Keep connection active"],
};
export function permissionLabel(scope: string, ru: boolean): string {
  return (labels[scope] ?? ["Дополнительное разрешение", "Additional permission"])[ru ? 0 : 1];
}
