import { Input, Select, SelectItem } from "@heroui/react";
import { keepsSourceCredentials, type ApiSource, type ApiSourceDraft } from "../model/api-source";
import { SourceDisclosure } from "../editor/disclosure/SourceDisclosure";
import css from "../editor/editor.module.css";
export function SourceCredentials({ draft, source, ru, disabled = false, onChange }: { draft: ApiSourceDraft; source: ApiSource | null; ru: boolean; disabled?: boolean; onChange: (draft: ApiSourceDraft) => void }) {
  const stored = keepsSourceCredentials(source, draft);
  const secret = (key: "username" | "password" | "apiToken", value: string) => {
    const secrets = { ...draft.secrets }; if (value) secrets[key] = value; else delete secrets[key];
    onChange({ ...draft, secrets });
  };
  const options = [{ key: "none", label: ru ? "Без авторизации" : "No authentication" },
    { key: "basic", label: ru ? "Логин и пароль" : "Username and password" }, { key: "bearer", label: "Bearer token" }];
  const fieldSlots = { base: css.field, label: css.fieldLabel, mainWrapper: css.fieldMain, inputWrapper: css.inputWrapper, innerWrapper: css.inputInner, input: css.input };
  return <SourceDisclosure title={ru ? "Доступ к спецификации" : "Specification access"}
    summary={options.find(option => option.key === draft.authMode)!.label} defaultOpen={draft.authMode !== "none"} disabled={disabled}>
    <div className={css.credentials}>
      <p>{ru ? "Используется Falcon для загрузки спецификации. Токен для выполнения запросов указывается отдельно в API Testing." : "Used by Falcon to load the specification. Request credentials are entered separately in API Testing."}</p>
      <Select aria-label={ru ? "Авторизация спецификации" : "Specification authentication"} size="sm" variant="flat"
        disallowEmptySelection isDisabled={disabled} selectedKeys={[draft.authMode]}
        onSelectionChange={keys => { const mode = Array.from(keys)[0]; if (mode === "none" || mode === "basic" || mode === "bearer") onChange({ ...draft, authMode: mode, secrets: {} }); }}
        classNames={{ base: css.field, trigger: css.selectTrigger, value: css.selectValue }}
        popoverProps={{ classNames: { content: css.selectMenu } }}>
        {options.map(option => <SelectItem key={option.key} textValue={option.label}>{option.label}</SelectItem>)}
      </Select>
      {draft.authMode === "basic" && <div className={css.pair}>
        <Input label={ru ? "Логин" : "Username"} labelPlacement="outside-top" autoComplete="off" size="sm" variant="flat" isDisabled={disabled}
          value={draft.secrets.username ?? ""} placeholder={stored ? (ru ? "Сохранён" : "Saved") : " "} classNames={fieldSlots} onValueChange={value => secret("username", value)}/>
        <Input label={ru ? "Пароль" : "Password"} labelPlacement="outside-top" type="password" autoComplete="new-password" size="sm" variant="flat" isDisabled={disabled}
          value={draft.secrets.password ?? ""} placeholder={stored ? "••••••••" : " "} classNames={fieldSlots} onValueChange={value => secret("password", value)}/>
      </div>}
      {draft.authMode === "bearer" && <Input label="Bearer token" labelPlacement="outside-top" type="password" autoComplete="new-password" size="sm" variant="flat" isDisabled={disabled}
        value={draft.secrets.apiToken ?? ""} placeholder={stored ? "••••••••" : " "} classNames={fieldSlots} onValueChange={value => secret("apiToken", value)}/>}
      {stored && <small>{ru ? "Пустые поля сохранят текущие данные доступа." : "Leave fields empty to keep the saved credentials."}</small>}
    </div>
  </SourceDisclosure>;
}
