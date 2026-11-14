import { useTestData } from "../../application/context/TestDataContext";
import { Button, SelectItem } from "@heroui/react";
import { IntegrationInput as Input } from "../../../presentation/common/integration-controls/input/IntegrationInput";
import { DataSelect as Select } from "../select/DataSelect";
import { IntegrationSwitch as Switch } from "../../../presentation/common/integration-controls/switch/IntegrationSwitch";
import { Plus, Trash2 } from "lucide-react";
import { dataTypes, type DataType } from "../../model/bindings/binding";
import { TypedValue } from "./TypedValue";
import css from "../shared/data.module.css";
export type EditableField = { readonly localId: string; readonly key: string; readonly type: DataType; readonly text: string; readonly isSecret: boolean; readonly description?: string };
export function ResourceFields({ fields, onChange, credentials, ru, disabled }: {
  fields: readonly EditableField[]; onChange(fields: readonly EditableField[]): void; credentials?: boolean; ru: boolean; disabled?: boolean;
}) {
  const feature = useTestData();
  const patch = (id: string, change: Partial<EditableField>) => onChange(fields.map(field => field.localId === id ? { ...field, ...change } : field));
  const rowClass = `${css.field} ${credentials ? css.credentialField : ""}`;
  const classes = { base: css.fieldControl, label: css.tableLabel, inputWrapper: css.inputShell, input: css.input };
  return <div className={css.fields}>
    <div className={css.fieldHeader}><h3>{ru ? "Поля" : "Fields"}</h3><Button type="button" className={`${css.button} ${css.quiet}`} isDisabled={disabled || fields.length >= (feature?.configuration.limits.datasetFields ?? 50)}
      startContent={<Plus size={14} />} onPress={() => onChange([...fields, { localId: crypto.randomUUID(), key: "", type: "String", text: "", isSecret: false }])}>{ru ? "Добавить поле" : "Add field"}</Button></div>
    <div className={`${rowClass} ${css.fieldColumns}`} aria-hidden="true"><span>{ru ? "Имя поля" : "Field name"}</span><span>{ru ? "Тип" : "Type"}</span><span>{ru ? "Значение" : "Value"}</span>{credentials && <span>{ru ? "Защита" : "Protected"}</span>}<span /></div>
    {fields.map((field, index) => <div className={css.fieldEntry} key={field.localId}>
      <div className={rowClass}>
        <Input label={ru ? "Имя поля" : "Field name"} aria-label={ru ? `Имя поля ${index + 1}` : `Field name ${index + 1}`} labelPlacement="outside" value={field.key} onValueChange={key => patch(field.localId, { key })}
          isRequired isDisabled={disabled} classNames={classes} />
        <Select disableAnimation label={ru ? "Тип" : "Type"} aria-label={ru ? `Тип поля ${index + 1}` : `Field type ${index + 1}`} labelPlacement="outside" selectedKeys={[field.type]}
          onSelectionChange={keys => patch(field.localId, { type: [...keys][0] as DataType, text: [...keys][0] === "Boolean" ? "false" : "" })}
          isDisabled={disabled} classNames={{ base: css.fieldControl, label: css.tableLabel, trigger: css.inputShell, value: css.input }}>
          {(credentials ? (field.isSecret ? ["String"] as const : ["String", "Email"] as const) : dataTypes).map(type => <SelectItem key={type}>{type}</SelectItem>)}
        </Select>
        <TypedValue type={field.type} secret={field.isSecret} value={field.text} onChange={text => patch(field.localId, { text })}
          label={ru ? "Значение" : "Value"} ariaLabel={ru ? `Значение поля ${index + 1}` : `Field value ${index + 1}`} compact disabled={disabled} />
        {credentials && <Switch size="sm" color="default" className={css.fieldProtection} aria-label={ru ? `Защитить поле ${index + 1}` : `Protect field ${index + 1}`} isSelected={field.isSecret} isDisabled={disabled}
          onValueChange={isSecret => patch(field.localId, { isSecret, ...(isSecret ? { type: "String" } : {}) })}><span className={css.mobileLabel}>{ru ? "Защита" : "Protected"}</span></Switch>}
        <Button type="button" isIconOnly className={`${css.button} ${css.quiet} ${css.icon}`} aria-label={ru ? `Удалить поле ${index + 1}` : `Remove field ${index + 1}`}
          isDisabled={disabled || fields.length <= 1} onPress={() => onChange(fields.filter(item => item.localId !== field.localId))}><Trash2 size={14} /></Button>
      </div>
      {!credentials && (field.description === undefined ? <Button type="button" className={`${css.button} ${css.quiet}`} isDisabled={disabled}
        onPress={() => patch(field.localId, { description: "" })}>{ru ? "Добавить описание поля" : "Add field description"}</Button>
        : <Input label={ru ? "Описание поля" : "Field description"} labelPlacement="outside" value={field.description}
          onValueChange={description => patch(field.localId, { description })} maxLength={feature?.configuration.limits.descriptionLength} isDisabled={disabled}
          classNames={{ base: css.fieldControl, label: css.controlLabel, inputWrapper: css.inputShell, input: css.input }} />)}
    </div>)}
  </div>;
}
