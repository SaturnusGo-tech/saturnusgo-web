const labels: Record<string, [string, string]> = {
  pending: ["Ожидает", "Pending"], processing: ["Анализируем", "Processing"], complete: ["Готов", "Complete"],
  failed: ["Ошибка", "Failed"], success: ["Успешно", "Successful"], cancelled: ["Отменено", "Cancelled"],
  build_pending: ["Сборка выполняется", "Build in progress"], build_success: ["Сборка успешна", "Build successful"],
  build_failed: ["Сборка не прошла", "Build failed"], build_cancelled: ["Сборка отменена", "Build cancelled"],
  unavailable: ["Недоступен", "Unavailable"], disabled: ["Выключен", "Disabled"],
  low: ["Низкий", "Low"], medium: ["Средний", "Medium"], high: ["Высокий", "High"], critical: ["Критический", "Critical"],
  BUILD_NOT_SUCCESSFUL: ["Дождитесь успешной сборки для этого изменения.", "Wait for a successful build for this change."],
  ANALYSIS_NOT_COMPLETE: ["Дождитесь завершения анализа или повторите его после ошибки.", "Wait for analysis to finish or retry after a failure."],
  EMPTY_SCOPE: ["Добавьте хотя бы один готовый тест в состав проверки.", "Add at least one ready test to the verification scope."],
  ALREADY_APPROVED: ["Состав уже подтверждён.", "The scope is already approved."],
  RUN_NOT_DRAFT: ["Состав доступен для изменения только в неархивном черновике прогона.", "Scope can only be edited in an unarchived draft run."],
  "impact.scope_review_requested": ["QA изменил состав", "QA changed the scope"],
  "impact.scope_approval_requested": ["QA подтвердил состав", "QA approved the scope"],
  "impact.analysis_retried": ["Анализ запрошен повторно", "Analysis retried"],
  "impact.gap_acknowledged": ["QA принял пробел покрытия", "QA acknowledged a coverage gap"],
  "impact.gap_generated": ["Создан черновик теста", "Test draft created"],
};
export function impactLabel(value: string, ru: boolean): string { return labels[value]?.[ru ? 0 : 1] ?? value; }
