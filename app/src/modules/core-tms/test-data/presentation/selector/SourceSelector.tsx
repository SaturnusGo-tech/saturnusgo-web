import { DatasetChanges } from "../comparison/DatasetChanges";
import { Button } from "@heroui/react";
import { IntegrationInput as Input } from "../../../presentation/common/integration-controls/input/IntegrationInput";
import { IntegrationSwitch as Switch } from "../../../presentation/common/integration-controls/switch/IntegrationSwitch";
import { useCallback, useEffect, useState } from "react";
import { Database, KeyRound, Plus } from "lucide-react";
import { DataModal as Modal } from "../shared/DataModal";
import { useFormLeave } from "../../../authoring/leave/state/value/useFormLeave";
import { useTestData } from "../../application/context/TestDataContext";
import { useCaseData } from "../../application/editor/CaseDataContext";
import { useDataCommand } from "../../application/command/useDataCommand";
import { useDataCatalog } from "../../application/catalog/useDataCatalog";
import type { DataFinding, TestDataBinding } from "../../model/bindings/binding";
import type { Credential, Dataset } from "../../model/resources/resource";
import { DatasetEditor } from "../dataset/DatasetEditor";
import { CredentialEditor } from "../credential/CredentialEditor";
import { DatasetVersionPicker } from "../version/DatasetVersionPicker";
import { DataFeedback } from "../shared/DataFeedback";
import { DataValidation } from "../validation/DataValidation";
import { bindingFieldMessage } from "../validation/binding-field-message";
import css from "../shared/data.module.css";
export function SourceSelector({ kind, initial, ru, onSave, onClose }: { kind: "DATASET" | "CREDENTIAL"; initial?: TestDataBinding;
  ru: boolean; onSave(binding: TestDataBinding): void; onClose(): void }) {
  const feature = useTestData(), data = useCaseData(), command = useDataCommand();
  const [findings, setFindings] = useState<readonly DataFinding[]>([]);
  const load = useCallback((search: string, cursor: string | null, signal: AbortSignal) => kind === "DATASET"
    ? feature!.port.datasets(search, cursor, signal) : feature!.port.credentials(search, cursor, signal), [feature, kind]);
  const catalog = useDataCatalog<Dataset | Credential>(feature?.permissions.read ? load : null);
  const [alias, setAlias] = useState(initial?.alias ?? ""), [selected, setSelected] = useState<Dataset | Credential | null>(null);
  const [version, setVersion] = useState(initial?.sourceType === "DATASET" ? initial.sourceVersionId : "");
  const [required, setRequired] = useState(initial?.required ?? true);
  const [sourceError, setSourceError] = useState(false), [sourceRetry, setSourceRetry] = useState(0);
  const [creating, setCreating] = useState(false);
  const leave = useFormLeave({ alias, selected: selected?.id ?? (initial?.sourceType !== "STATIC" ? initial?.sourceId : undefined), version, required }, { busy: command.pending });
  useEffect(() => {
    if (!feature || !initial || initial.sourceType === "STATIC") return;
    const controller = new AbortController();
    setSourceError(false);
    const request = initial.sourceType === "DATASET" ? feature.port.dataset(initial.sourceId, controller.signal) : feature.port.credential(initial.sourceId, controller.signal);
    void request.then(value => { if (!controller.signal.aborted) setSelected(value); }).catch(() => { if (!controller.signal.aborted) setSourceError(true); });
    return () => controller.abort();
  }, [feature, initial, sourceRetry]);
  function choose(resource: Dataset | Credential) {
    if (command.pending) return;
    setSelected(resource); setFindings([]);
    if ("currentVersionId" in resource) setVersion(resource.currentVersionId);
  }
  const canCreate = kind === "DATASET" ? feature?.permissions.create : feature?.permissions.credentialCreate;
  if (creating) return kind === "DATASET" ? <DatasetEditor ru={ru} onSaved={value => { choose(value); setCreating(false); }} onClose={() => setCreating(false)} />
    : <CredentialEditor ru={ru} onSaved={value => { choose(value); setCreating(false); }} onClose={() => setCreating(false)} />;
  return <Modal title={kind === "DATASET" ? (ru ? "Подключить набор данных" : "Link dataset") : (ru ? "Подключить учётные данные" : "Link credential")} wide onClose={() => void leave.close(onClose)}>
    <form className={css.form} onSubmit={event => {
      event.preventDefault(); if (!selected || !feature?.permissions.bind || command.pending) return;
      const base = { id: initial?.id ?? crypto.randomUUID(), alias, required };
      if (kind === "DATASET" && !version) return;
      const binding: TestDataBinding = kind === "DATASET" ? { ...base, sourceType: "DATASET", sourceId: selected.id, sourceVersionId: version }
        : { ...base, sourceType: "CREDENTIAL", sourceId: selected.id };
      const bindings = [...(data?.bindings ?? []).filter(item => item.id !== initial?.id), binding];
      setFindings([]);
      void command.execute(signal => feature.port.validate(bindings, [], signal, data?.savedCase), JSON.stringify(binding)).then(result => {
        if (!result.ok) return;
        if (!result.value.valid) { setFindings(result.value.errors); return; }
        leave.release(); onSave(binding);
      });
    }}>
      <div className={css.toolbar}><Input aria-label={ru ? "Найти источник" : "Find source"} placeholder={ru ? "Найти по названию" : "Search by name"} value={catalog.search}
        onValueChange={catalog.setSearch} isDisabled={command.pending} classNames={{ inputWrapper: css.inputShell, input: css.input }} />
        {canCreate && <Button type="button" isDisabled={command.pending} className={css.button} startContent={<Plus size={14} />} onPress={() => setCreating(true)}>{ru ? "Создать" : "Create"}</Button>}</div>
      <DataFeedback loading={catalog.loading} error={catalog.error} denied={!feature?.permissions.read} ru={ru} retry={catalog.refresh} />
      <div className={css.scroll} style={{ maxHeight: 300 }}><ul className={css.rows}>{catalog.items.map(item => {
        const unavailable = "disabled" in item ? item.disabled : item.archived;
        return <li key={item.id} className={css.row}><Button type="button" variant="light" className={`${css.button} ${css.quiet}`} style={{ flex: 1, justifyContent: "flex-start" }}
          aria-pressed={selected?.id === item.id} isDisabled={unavailable || command.pending} onPress={() => choose(item)} startContent={kind === "DATASET" ? <Database size={16} /> : <KeyRound size={16} />}>
          <span className={css.rowMain}><span className={css.name}>{item.name}</span><span className={css.meta}>{"currentVersion" in item ? `v${item.currentVersion} · ${item.fieldCount} ${ru ? "полей" : "fields"}` : `${item.fields.length} ${ru ? "полей" : "fields"}`}</span></span>
          {selected?.id === item.id && <span aria-hidden>✓</span>}</Button></li>;
      })}</ul></div>
      {!catalog.loading && !catalog.error && catalog.items.length === 0 && <p className={css.muted}>{ru ? "Подходящих источников нет." : "No matching sources."}</p>}
      {catalog.cursor && <Button type="button" className={`${css.button} ${css.quiet}`} isLoading={catalog.pending} onPress={() => void catalog.more()}>{ru ? "Показать ещё" : "Load more"}</Button>}
      {selected && <><Input isRequired label="Alias" labelPlacement="outside" value={alias} onValueChange={next => { setAlias(next); setFindings([]); }} isDisabled={command.pending}
        isInvalid={findings.some(item => item.alias === alias && item.code === "TEST_DATA_ALIAS_INVALID")} description={bindingFieldMessage("TEST_DATA_ALIAS_INVALID", ru)}
        maxLength={feature?.configuration.limits.aliasLength} classNames={{ inputWrapper: css.inputShell, input: css.input }} />
        {"currentVersionId" in selected ? <DatasetVersionPicker dataset={selected} selected={version} onChange={setVersion} ru={ru} disabled={command.pending} />
          : <p className={css.notice}>{ru ? "Пароли и токены останутся защищёнными. В сценарии используются только переменные." : "Passwords and tokens stay protected. Scenarios contain variable references only."}</p>}</>}
      {selected && "currentVersionId" in selected && initial?.sourceType === "DATASET" && initial.sourceId === selected.id && <DatasetChanges dataset={selected} pinnedId={initial.sourceVersionId} ru={ru} disabled={command.pending} onChooseLatest={() => { if (!command.pending) setVersion(selected.currentVersionId); }} />}
      <DataFeedback error={sourceError} ru={ru} retry={() => setSourceRetry(value => value + 1)} />
      <DataValidation findings={findings} ru={ru} /><DataFeedback error={command.error} ru={ru} />
      <Switch isDisabled={command.pending} size="sm" color="default" isSelected={required} onValueChange={setRequired}>{ru ? "Обязательно для выполнения" : "Required for execution"}</Switch>
      <div className={css.footer}><Button type="button" className={`${css.button} ${css.quiet}`} onPress={() => void leave.close(onClose)}>{ru ? "Отмена" : "Cancel"}</Button>
        <Button type="submit" isLoading={command.pending} className={`${css.button} ${css.primary}`} isDisabled={command.pending || !selected || !feature?.permissions.bind || (kind === "DATASET" && !version)}>{initial ? (ru ? "Обновить привязку" : "Update binding") : (ru ? "Подключить" : "Link source")}</Button></div>
    </form>
  </Modal>;
}
