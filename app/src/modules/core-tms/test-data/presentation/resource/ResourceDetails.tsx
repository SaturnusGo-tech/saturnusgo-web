import { Button } from "@heroui/react";
import { useState } from "react";
import { DataModal as Modal } from "../shared/DataModal";
import { useTestData } from "../../application/context/TestDataContext";
import { useDataCommand } from "../../application/command/useDataCommand";
import type { Dataset, Credential } from "../../model/resources/resource";
import { formatDataValue } from "../../application/editor/field-input";
import type { SecretTarget } from "../../model/execution/manifest";
import { DatasetEditor } from "../dataset/DatasetEditor";
import { CredentialEditor } from "../credential/CredentialEditor";
import { DatasetVersionPicker } from "../version/DatasetVersionPicker";
import { ResourceUsage } from "../usage/ResourceUsage";
import { RotateCredential } from "../credential/rotate/RotateCredential";
import { SecretRevealDialog } from "../reveal/SecretRevealDialog";
import { DataFeedback } from "../shared/DataFeedback";
import { DatasetReader } from "../resource-reader/dataset/DatasetReader";
import { CredentialReader } from "../resource-reader/credential/CredentialReader";
import reader from "../resource-reader/styles/resource-reader.module.css";
import css from "../shared/data.module.css";
export function ResourceDetails({ resource, ru, onClose, onUpdated, onOpenCase, inline = false }: { resource: Dataset | Credential; ru: boolean; onClose(): void; onUpdated(): void; onOpenCase?(id: string): void; inline?: boolean }) {
  const feature = useTestData(), command = useDataCommand();
  const dataset = "currentVersionId" in resource ? resource : null, credential = "fields" in resource ? resource : null;
  const [editing, setEditing] = useState(false), [rotating, setRotating] = useState(false), [confirm, setConfirm] = useState(false);
  const [version, setVersion] = useState(dataset?.currentVersionId ?? ""), [reveal, setReveal] = useState<SecretTarget | null>(null);
  if (editing) return dataset ? <DatasetEditor current={dataset} inline={inline} ru={ru} onSaved={onUpdated} onClose={() => setEditing(false)} />
    : <CredentialEditor current={credential!} inline={inline} ru={ru} onSaved={onUpdated} onClose={() => setEditing(false)} />;
  if (rotating && credential) return <RotateCredential credential={credential} ru={ru} onSaved={onUpdated} onClose={() => setRotating(false)} />;
  if (reveal) return <SecretRevealDialog target={reveal} ru={ru} onClose={() => setReveal(null)} />;
  const content = <div className={inline ? reader.content : css.form}>
      {resource.description && <p className={inline ? reader.description : css.muted}>{resource.description}</p>}
      {dataset && (inline ? <DatasetReader key={dataset.id} dataset={dataset} ru={ru} /> : <DatasetVersionPicker dataset={dataset} selected={version} onChange={setVersion} ru={ru} />)}
      {credential && (inline ? <CredentialReader credential={credential} ru={ru} onReveal={setReveal} /> : <><p className={css.status}>{credential.disabled ? (ru ? "Отключено" : "Disabled") : (ru ? "Настроено · доступность аккаунта не проверяется" : "Configured · external account availability is not checked")}</p>
        <ul className={css.rows}>{credential.fields.map(field => <li key={field.key} className={css.row}><div className={css.rowMain}><span className={css.name}>{field.key}</span>
          <span className={css.meta}>{field.type} · {field.isSecret ? (ru ? "Защищено" : "Protected") : formatDataValue(field.value)}</span></div>
          {field.isSecret && feature?.permissions.reveal && !credential.disabled && <Button className={`${css.button} ${css.quiet}`} onPress={() => setReveal({ resourceId: credential.id,
            field: field.key, secretVersionId: credential.activeSecretVersionId, environmentId: credential.environmentId })}>{ru ? "Показать" : "Reveal"}</Button>}</li>)}</ul></>)}
      {credential && feature && !feature.configuration.revealVerificationAvailable && <p className={css.notice}>{ru ? "Этот способ входа пока не поддерживает повторную проверку доступа к секретам." : "This sign-in method cannot verify secret access yet."}</p>}
      <ResourceUsage kind={dataset ? "datasets" : "credentials"} id={resource.id} ru={ru} onOpenCase={onOpenCase} />
      <DataFeedback error={command.error} ru={ru} />
      {confirm ? <div className={css.notice}><p>{dataset?.archived ? (ru ? "Восстановить набор?" : "Restore this dataset?") : dataset ? (ru ? "Архивировать набор? Существующие привязки и история сохранятся." : "Archive this dataset? Existing bindings and history are preserved.")
        : (ru ? "Отключить учётные данные? Новые исполнения и раскрытие будут запрещены." : "Disable this credential? New executions and reveal access will be blocked.")}</p>
        <div className={css.actions}><Button className={`${css.button} ${css.quiet}`} isDisabled={command.pending} onPress={() => setConfirm(false)}>{ru ? "Отмена" : "Cancel"}</Button>
          <Button className={`${css.button} ${css.danger}`} isLoading={command.pending} onPress={() => {
            if (!feature) return;
            void command.execute((signal, key) => dataset ? feature.port.archiveDataset(dataset, dataset.archived, key, signal) : feature.port.disableCredential(credential!, key, signal))
              .then(result => { if (result.ok) onUpdated(); });
          }}>{ru ? "Подтвердить" : "Confirm"}</Button></div></div> : <div className={css.footer}>
        {((dataset && !dataset.archived && feature?.permissions.update) || (credential && feature?.permissions.credentialUpdate)) && <Button className={css.button} onPress={() => setEditing(true)}>{dataset ? (ru ? "Новая версия" : "Create new version") : (ru ? "Изменить сведения" : "Edit details")}</Button>}
        {credential && !credential.disabled && feature?.permissions.rotate && <Button className={css.button} onPress={() => setRotating(true)}>{ru ? "Обновить секреты" : "Rotate secrets"}</Button>}
        {((dataset && feature?.permissions.archive) || (credential && !credential.disabled && feature?.permissions.disable)) && <Button className={`${css.button} ${css.quiet}`} onPress={() => setConfirm(true)}>{dataset ? (dataset.archived ? (ru ? "Восстановить" : "Restore") : (ru ? "Архивировать" : "Archive")) : (ru ? "Отключить" : "Disable")}</Button>}
      </div>}
    </div>;
  const kind = dataset ? (ru ? "Общий набор данных" : "Shared Dataset") : (ru ? "Защищённые учётные данные" : "Secure Credentials");
  return inline ? <section className={reader.pane} data-resource-detail={resource.id} aria-label={resource.name}>
    <header className={reader.header}><div><h2 className={reader.heading}>{resource.name}</h2><span className={reader.kind}>{kind}</span></div>
      <Button className={reader.close} isIconOnly aria-label="Close resource" onPress={onClose}>×</Button></header>
    <div className={reader.body}>{content}</div>
  </section> : <Modal title={resource.name} subtitle={kind} wide onClose={onClose}>{content}</Modal>;
}
