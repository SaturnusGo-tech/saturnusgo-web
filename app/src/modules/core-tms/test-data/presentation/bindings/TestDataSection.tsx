import { BindingSourceDetails } from "../resource/BindingSourceDetails";
import { Button } from "@heroui/react";
import { Copy, Database, KeyRound, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTestData } from "../../application/context/TestDataContext";
import { useCaseData } from "../../application/editor/CaseDataContext";
import { formatDataValue } from "../../application/editor/field-input";
import type { TestDataBinding } from "../../model/bindings/binding";
import { StaticDataEditor } from "../static/StaticDataEditor";
import { SourceSelector } from "../selector/SourceSelector";
import { DataFeedback } from "../shared/DataFeedback";
import { DataValidation } from "../validation/DataValidation";
import { AddDataMenu } from "./menu/AddDataMenu";
import { DataModal as Modal } from "../shared/DataModal";
import css from "../shared/data.module.css";
export function TestDataSection({ ru }: { ru: boolean }) {
  const feature = useTestData(), data = useCaseData();
  const [sourceView, setSourceView] = useState<Exclude<TestDataBinding, { sourceType: "STATIC" }> | null>(null);
  const [editor, setEditor] = useState<"STATIC" | "DATASET" | "CREDENTIAL" | null>(null);
  const [editing, setEditing] = useState<TestDataBinding | undefined>();
  const [removing, setRemoving] = useState<TestDataBinding | null>(null), [copyError, setCopyError] = useState(false);
  if (!data || !feature) return null;
  const canEdit = data.editable && Boolean(feature?.permissions.bind) && Boolean(data.onChange);
  function save(binding: TestDataBinding) {
    data?.onChange?.(editing ? data.bindings.map(item => item.id === editing.id ? binding : item) : [...(data?.bindings ?? []), binding]);
    setEditing(undefined); setEditor(null);
  }
  function remove(binding: TestDataBinding) {
    data?.onChange?.(data.bindings.filter(item => item.id !== binding.id)); setRemoving(null);
  }
  return <section className={css.section} aria-label={ru ? "Тестовые данные" : "Test data"}>
    <header className={css.heading}><h3>{ru ? "Тестовые данные" : "Test Data"}</h3>
      {canEdit && data.bindings.length < feature.configuration.limits.bindings && <AddDataMenu ru={ru} onChoose={kind => { setEditing(undefined); setEditor(kind); }} />}
      {!data.editable && data.onRequestEdit && feature.permissions.bind && <Button className={`${css.button} ${css.quiet}`} onPress={data.onRequestEdit}>{ru ? "Изменить данные" : "Edit test data"}</Button>}</header>
    {!data.bindings.length && <div className={css.empty}><p className={css.muted}>{ru ? "Тестовые данные ещё не добавлены." : "No test data added yet."}</p>
      <p className={css.muted}>{ru ? "Определите данные, необходимые для выполнения этого кейса." : "Define the data required to execute this test case."}</p></div>}
    <DataFeedback denied={!feature?.permissions.read && data.editable} ru={ru} error={data.error || copyError} retry={data.error ? data.retry : undefined} />
    <ul className={css.rows}>{data.bindings.map(binding => {
      const source = data.validation?.referencedResources.find(item => item.alias === binding.alias);
      return <li key={binding.id} className={css.row}>
        {binding.sourceType === "CREDENTIAL" ? <KeyRound size={16} /> : <Database size={16} />}
        <div className={css.rowMain}><span className={css.name}>{binding.alias}</span>
          <div className={css.meta}><span>{binding.sourceType === "STATIC" ? `Static Data · ${binding.staticDefinition.type}` : binding.sourceType === "DATASET" ? "Shared Dataset" : "Secure Credentials"}</span>
            {binding.sourceType === "STATIC" ? <span>{formatDataValue(binding.staticDefinition.value)}</span> : <button type="button" className={css.sourceLink} onClick={() => setSourceView(binding)}>{source?.name ?? (ru ? "Открыть источник" : "View source")}</button>}
            {binding.sourceType === "DATASET" && source?.version !== undefined && <span>{`v${source.version}`}</span>}
            {source?.environmentId && <span>{feature.environments.find(environment => environment.id === source.environmentId)?.name ?? (ru ? "Окружение недоступно" : "Environment unavailable")}</span>}
            {source?.status === "ARCHIVED" && <span>{ru ? "В архиве" : "Archived"}</span>}
            {binding.sourceType === "CREDENTIAL" && source?.status && <span>{source.status === "disabled" ? (ru ? "Отключено" : "Disabled") : (ru ? "Настроено" : "Configured")}</span>}</div>
          {binding.sourceType === "DATASET" && source?.currentVersionId && source.currentVersionId !== binding.sourceVersionId
            && <p className={css.muted}>{ru ? "Доступна новая версия набора." : "New dataset version available."} {canEdit && <button type="button" className={css.sourceLink} onClick={() => { setEditing(binding); setEditor("DATASET"); }}>{ru ? "Сравнить и обновить" : "View changes / update binding"}</button>}</p>}</div>
        <Button type="button" isIconOnly className={`${css.button} ${css.quiet} ${css.icon}`} aria-label={ru ? `Копировать переменную ${binding.alias}` : `Copy variable ${binding.alias}`}
          isDisabled={binding.sourceType !== "STATIC" && !data.validation?.variables.some(item => item.token.startsWith(`${binding.alias}.`))}
          onPress={() => { const variable = data.validation?.variables.find(item => item.token.startsWith(`${binding.alias}.`))?.token ?? `${binding.alias}.value`;
            void navigator.clipboard.writeText(`{{${variable}}}`).catch(() => setCopyError(true)); }}><Copy size={14} /></Button>
        {canEdit && <><Button type="button" isIconOnly className={`${css.button} ${css.quiet} ${css.icon}`} aria-label={ru ? `Изменить ${binding.alias}` : `Edit ${binding.alias}`}
          onPress={() => { setEditing(binding); setEditor(binding.sourceType); }}><Settings2 size={14} /></Button>
          <Button type="button" isIconOnly className={`${css.button} ${css.quiet} ${css.icon}`} aria-label={ru ? `Удалить привязку ${binding.alias}` : `Remove binding ${binding.alias}`}
            onPress={() => setRemoving(binding)}><Trash2 size={14} /></Button></>}
      </li>;
    })}</ul>
    <DataValidation findings={data.validation?.errors ?? []} ru={ru} />
    <DataValidation findings={data.validation?.warnings ?? []} ru={ru} warning />
    {sourceView && <BindingSourceDetails binding={sourceView} ru={ru} onClose={() => setSourceView(null)} />}
    {editor === "STATIC" && <StaticDataEditor initial={editing?.sourceType === "STATIC" ? editing : undefined} ru={ru} onSave={save} onClose={() => setEditor(null)} />}
    {(editor === "DATASET" || editor === "CREDENTIAL") && <SourceSelector kind={editor} initial={editing} ru={ru} onSave={save} onClose={() => setEditor(null)} />}
    {removing && <Modal title={ru ? "Удалить привязку?" : "Remove binding?"} onClose={() => setRemoving(null)}>
      <p className={css.muted}>{ru ? "Источник останется в библиотеке. Переменные этой привязки станут недоступны." : "The source stays in the library. Variables using this binding will become invalid."}</p>
      <div className={css.footer}><Button className={`${css.button} ${css.quiet}`} onPress={() => setRemoving(null)}>{ru ? "Отмена" : "Cancel"}</Button>
        <Button className={`${css.button} ${css.danger}`} onPress={() => remove(removing)}>{ru ? "Удалить привязку" : "Remove binding"}</Button></div></Modal>}
  </section>;
}
