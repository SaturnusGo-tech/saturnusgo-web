import type { DataFinding } from "../../model/bindings/binding";
import css from "../shared/data.module.css";
import { bindingFieldMessage } from "./binding-field-message";
export function DataValidation({ findings, ru, stepId, warning = false }: { findings: readonly DataFinding[]; ru: boolean; stepId?: string; warning?: boolean }) {
  const visible = stepId ? findings.filter(item => item.stepId === stepId) : findings;
  if (!visible.length) return null;
  return <div role={warning ? "status" : "alert"} className={warning ? css.notice : css.error}><strong>{ru ? "Проверьте тестовые данные" : "Review test data"}</strong>
    <ul>{visible.map((item, index) => <li key={`${item.code}:${item.alias}:${index}`}>
      {item.alias ? <code>{`{{${item.alias}.${item.field ?? "…"}}}`}</code> : null} {findingLabel(item.code, ru)}
    </li>)}</ul></div>;
}
function findingLabel(code: string, ru: boolean) {
  const input = bindingFieldMessage(code, ru); if (input) return input;
  if (/POTENTIAL_SECRET/.test(code)) return ru ? "Возможно, это чувствительные данные. Для паролей и токенов используйте Secure Credentials." : "This may contain sensitive data. Use Secure Credentials for passwords and tokens.";
  if (/VERSION_CONFLICT/.test(code)) return ru ? "Проверьте зафиксированную версию набора перед выполнением." : "Review the pinned dataset version before execution.";
  if (/ALIAS_CONFLICT/.test(code)) return ru ? "Alias уже используется." : "This alias is already used.";
  if (/FIELD_NOT_FOUND/.test(code)) return ru ? "Поле отсутствует в выбранной версии." : "This field does not exist in the selected version.";
  if (/BINDING_NOT_FOUND|RESOURCE_NOT_FOUND/.test(code)) return ru ? "Источник данных недоступен." : "This data source is unavailable.";
  if (/ENVIRONMENT/.test(code)) return ru ? "Окружение не совпадает." : "The environment does not match.";
  if (/DISABLED/.test(code)) return ru ? "Учётные данные отключены." : "This credential is disabled.";
  if (/ACCESS|FORBIDDEN/.test(code)) return ru ? "Доступ к источнику запрещён." : "Access to this source is denied.";
  return ru ? "Переменная или конфигурация некорректна." : "This variable or configuration is invalid.";
}
