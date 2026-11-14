import { SelectItem } from "@heroui/react";
import { IntegrationInput } from "../../../../presentation/common/integration-controls/input/IntegrationInput";
import { DataSelect } from "../../select/DataSelect";
import css from "./connection.module.css";
export type SourceConnectionFields = { host: string; port: string; database: string; username: string; password: string; datasetId: string; region: "us" | "eu"; apiKey: string };
export function ConnectionFields({ kind, value, onChange, ru, disabled }: { kind: "POSTGRES" | "MYSQL" | "POSTMAN"; value: SourceConnectionFields;
  onChange(value: SourceConnectionFields): void; ru: boolean; disabled?: boolean }) {
  const update = (field: keyof SourceConnectionFields, next: string) => onChange({ ...value, [field]: next });
  const classes = { base: css.control, label: css.label, inputWrapper: css.shell, input: css.input, description: css.description };
  if (kind === "POSTMAN") return <>
    <div className={`${css.grid} ${css.postman}`}>
      <IntegrationInput label={ru ? "ID датасета" : "Dataset ID"} aria-label="Dataset ID" value={value.datasetId} onValueChange={next => update("datasetId", next)} isRequired isDisabled={disabled} autoComplete="off" classNames={classes} />
      <div className={css.select}><span className={css.label}>{ru ? "Регион" : "Region"}</span><DataSelect aria-label="Region" classNames={{ base: css.selectControl, trigger: css.selectShell, value: css.input }} selectedKeys={[value.region]} isDisabled={disabled} onSelectionChange={keys => update("region", String(Array.from(keys)[0] ?? "us"))}>
        <SelectItem key="us">United States</SelectItem><SelectItem key="eu">European Union</SelectItem></DataSelect></div>
    </div>
    <IntegrationInput label={ru ? "API-ключ" : "API key"} aria-label="API key" value={value.apiKey} type="password" onValueChange={next => update("apiKey", next)} isRequired isDisabled={disabled} autoComplete="new-password" classNames={classes}
      description={ru ? "Ключ хранится в защищённом контуре и не возвращается клиенту." : "The key is encrypted on the server and is never returned to the client."} />
  </>;
  return <>
    <div className={`${css.grid} ${css.address}`}>
      <IntegrationInput label={ru ? "Хост" : "Host"} aria-label="Host" value={value.host} onValueChange={next => update("host", next)} isRequired isDisabled={disabled} autoComplete="off" classNames={classes} />
      <IntegrationInput label={ru ? "Порт" : "Port"} aria-label="Port" value={value.port} onValueChange={next => update("port", next)} type="number" min={1} max={65535} isRequired isDisabled={disabled} classNames={classes} />
    </div>
    <IntegrationInput label={ru ? "База данных" : "Database"} aria-label="Database" value={value.database} onValueChange={next => update("database", next)} isRequired isDisabled={disabled} autoComplete="off" classNames={classes} />
    <div className={css.grid}>
      <IntegrationInput label={ru ? "Пользователь" : "Username"} aria-label="Username" value={value.username} onValueChange={next => update("username", next)} isRequired isDisabled={disabled} autoComplete="off" classNames={classes} />
      <IntegrationInput label={ru ? "Пароль" : "Password"} aria-label="Password" value={value.password} type="password" onValueChange={next => update("password", next)} isRequired isDisabled={disabled} autoComplete="new-password" classNames={classes} />
    </div>
    <p className={css.hint}>{ru ? "TLS включён. Используйте учётную запись только для чтения." : "TLS is enabled. Use a read-only database account."}</p>
  </>;
}
