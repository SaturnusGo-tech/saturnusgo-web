import { ArrowRightLeft, Network, Plus } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Project, TestCase } from "../../../../../core/tms/contracts/legacy-contract";
import { createIntegrationCase } from "../../../application/integrations/createIntegrationCase";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { Field } from "../../common/field/Field";
import { FormError } from "../../common/error/FormError";
import { Modal } from "../../common/modal/Modal";
import { getIntegrationDialogCopy } from "./copy";
import styles from "../../../tms.module.css";
export function IntegrationDialog({ project, casesCount, offline, onClose, onCreated }: { project: Project; casesCount: number; offline: boolean; onClose: () => void; onCreated: (testCase: TestCase) => void }) {
  const http = useTmsHttpClient();
  const { locale } = useTmsLocale();
  const copy = getIntegrationDialogCopy(locale);
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [contract, setContract] = useState("REST API");
  const [endpoint, setEndpoint] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(false);
    try { onCreated(await createIntegrationCase({ http, project, casesCount, name, source, target, contract, endpoint, description, offline, locale })); }
    catch { setError(true); setSubmitting(false); }
  }
  return <Modal title={copy.title} subtitle={copy.subtitle} onClose={onClose} wide>
    <form onSubmit={submit}>
      <div className={styles.integrationFlowFields}>
        <Field label={copy.source}><input required autoFocus value={source} onChange={(event) => setSource(event.target.value)} placeholder={copy.sourcePlaceholder} /></Field>
        <span><ArrowRightLeft size={20} /></span>
        <Field label={copy.target}><input required value={target} onChange={(event) => setTarget(event.target.value)} placeholder={copy.targetPlaceholder} /></Field>
      </div>
      <div className={styles.formGrid}>
        <Field label={copy.name} wide><input required value={name} onChange={(event) => setName(event.target.value)} placeholder={copy.namePlaceholder} data-testid="integration-name" /></Field>
        <Field label={copy.contract}><select value={contract} onChange={(event) => setContract(event.target.value)}><option value="REST API">REST API</option><option value="GraphQL">GraphQL</option><option value="Webhook">Webhook</option><option value="Event stream">{copy.eventStream}</option><option value="Deep link">{copy.deepLink}</option><option value="Database sync">{copy.databaseSync}</option></select></Field>
        <Field label={copy.endpoint}><input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder="/v1/rides or rides.created" /></Field>
        <Field label={copy.purpose} wide><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={copy.purposePlaceholder} /></Field>
      </div>
      <div className={styles.snapshotNote}><Network size={18} /><span><strong>{copy.generated}</strong><small>{copy.generatedHint}</small></span></div>
      {error && <FormError message={copy.error} />}
      <div className={styles.modalFooter}><button type="button" className={styles.textButton} onClick={onClose}>{copy.cancel}</button><button className={styles.primaryButton} disabled={submitting || !name.trim() || !source.trim() || !target.trim()}><Plus size={16} /> {submitting ? copy.creating : copy.create}</button></div>
    </form>
  </Modal>;
}
