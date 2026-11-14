import { Button } from "@heroui/react";
import { useTestData } from "../../../application/context/TestDataContext";
import { formatDataValue } from "../../../application/editor/field-input";
import type { Credential } from "../../../model/resources/resource";
import type { SecretTarget } from "../../../model/execution/manifest";
import shared from "../../shared/data.module.css";
import css from "../styles/resource-reader.module.css";

export function CredentialReader({ credential, ru, onReveal }: { credential: Credential; ru: boolean; onReveal(target: SecretTarget): void }) {
  const feature = useTestData(), environment = feature?.environments.find(item => item.id === credential.environmentId)?.name;
  return <section className={css.dataset} aria-label={ru ? "Поля учётных данных" : "Credential fields"}>
    <div className={css.credentialMeta}><span>{ru ? "Окружение" : "Environment"}</span><strong>{environment ?? (ru ? "Окружение недоступно" : "Environment unavailable")}</strong>
      <span>{ru ? "Статус" : "Status"}</span><strong>{credential.disabled ? (ru ? "Отключено" : "Disabled") : (ru ? "Настроено" : "Configured")}</strong></div>
    <div className={css.tableScroll}><table className={css.table}><thead><tr><th>{ru ? "Поле" : "Field"}</th><th>{ru ? "Тип" : "Type"}</th><th>{ru ? "Значение" : "Value"}</th></tr></thead>
      <tbody>{credential.fields.map(field => <tr key={field.key}><td>{field.key}</td><td className={css.type}>{field.type}</td><td><div className={css.secretValue}>
        <span className={field.isSecret ? css.mask : css.value}>{field.isSecret ? "••••••••" : formatDataValue(field.value)}</span>
        {field.isSecret && <span className={css.muted}>{ru ? "Защищено" : "Protected"}</span>}
        {field.isSecret && feature?.permissions.reveal && !credential.disabled && <Button className={`${shared.button} ${shared.quiet}`} onPress={() => onReveal({ resourceId: credential.id,
          field: field.key, secretVersionId: credential.activeSecretVersionId, environmentId: credential.environmentId })}>{ru ? "Показать" : "Reveal"}</Button>}
      </div></td></tr>)}</tbody></table></div>
    <p className={css.muted}>{ru ? "Доступность внешнего аккаунта не проверяется." : "External account availability is not checked."}</p>
  </section>;
}
