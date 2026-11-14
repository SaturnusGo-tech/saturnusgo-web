import { SelectItem } from "@heroui/react";
import { WorkspaceTextField } from "../../workspace-fields/WorkspaceTextField";
import css from "../../workspace-layout/workspace.module.css";
import form from "../../shared/data.module.css";
import { DataSelect } from "../../select/DataSelect";
export type SourceConnectionFields = { host: string; port: string; database: string; username: string; password: string; datasetId: string; region: "us" | "eu"; apiKey: string };
export function ConnectionFields({ kind, value, onChange, ru, disabled }: { kind: "POSTGRES" | "MYSQL" | "POSTMAN"; value: SourceConnectionFields;
  onChange(value: SourceConnectionFields): void; ru: boolean; disabled?: boolean }) {
  const update = (field: keyof SourceConnectionFields, next: string) => onChange({ ...value, [field]: next });
  if (kind === "POSTMAN") return <>
    <WorkspaceTextField label={ru ? "ID датасета" : "Dataset ID"} ariaLabel="Dataset ID" value={value.datasetId} onValueChange={next => update("datasetId", next)} required disabled={disabled} autoComplete="off" />
    <div className={css.field}><span className={css.fieldLabel}>{ru ? "Регион" : "Region"}</span><DataSelect aria-label="Region" classNames={{ base: form.fieldControl, trigger: form.inputShell, value: form.input }} selectedKeys={[value.region]} isDisabled={disabled} onSelectionChange={keys => update("region", String(Array.from(keys)[0] ?? "us"))}>
      <SelectItem key="us">United States</SelectItem><SelectItem key="eu">European Union</SelectItem></DataSelect></div>
    <WorkspaceTextField label={ru ? "API-ключ" : "API key"} ariaLabel="API key" value={value.apiKey} type="password" onValueChange={next => update("apiKey", next)} required disabled={disabled} autoComplete="new-password"
      description={ru ? "Ключ хранится в защищённом контуре и не возвращается клиенту." : "The key is encrypted on the server and is never returned to the client."} />
  </>;
  return <>
    <WorkspaceTextField label={ru ? "Хост" : "Host"} ariaLabel="Host" value={value.host} onValueChange={next => update("host", next)} required disabled={disabled} autoComplete="off" />
    <WorkspaceTextField label={ru ? "Порт" : "Port"} ariaLabel="Port" value={value.port} onValueChange={next => update("port", next)} type="number" min={1} max={65535} required disabled={disabled} />
    <WorkspaceTextField label={ru ? "База данных" : "Database"} ariaLabel="Database" value={value.database} onValueChange={next => update("database", next)} required disabled={disabled} autoComplete="off" />
    <WorkspaceTextField label={ru ? "Пользователь" : "Username"} ariaLabel="Username" value={value.username} onValueChange={next => update("username", next)} required disabled={disabled} autoComplete="off" />
    <WorkspaceTextField label={ru ? "Пароль" : "Password"} ariaLabel="Password" value={value.password} type="password" onValueChange={next => update("password", next)} required disabled={disabled} autoComplete="new-password"
      description={ru ? "TLS включён. Используйте учётную запись только для чтения." : "TLS is enabled. Use a read-only database account."} />
  </>;
}
