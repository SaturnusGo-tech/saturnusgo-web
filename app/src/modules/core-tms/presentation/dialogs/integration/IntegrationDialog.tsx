import { ArrowRightLeft, Network, Plus } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Project, TestCase } from "../../../../../core/tms/contracts/legacy-contract";
import { createIntegrationCase } from "../../../application/integrations/createIntegrationCase";
import { Field } from "../../common/field/Field";
import { FormError } from "../../common/error/FormError";
import { Modal } from "../../common/modal/Modal";
import styles from "../../../tms.module.css";
export function IntegrationDialog({ project, casesCount, offline, onClose, onCreated }: { project: Project; casesCount: number; offline: boolean; onClose: () => void; onCreated: (testCase: TestCase) => void }) {
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [contract, setContract] = useState("REST API");
  const [endpoint, setEndpoint] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try { onCreated(await createIntegrationCase({ project, casesCount, name, source, target, contract, endpoint, description, offline })); }
    catch { setError("The integration case was not saved. Check the system names and API response."); setSubmitting(false); }
  }
  return <Modal title="Create integration test" subtitle="Capture the systems, contract, happy path, and failure handling in one executable case." onClose={onClose} wide>
    <form onSubmit={submit}>
      <div className={styles.integrationFlowFields}>
        <Field label="Source system"><input required autoFocus value={source} onChange={(event) => setSource(event.target.value)} placeholder="Web client" /></Field>
        <span><ArrowRightLeft size={20} /></span>
        <Field label="Target system"><input required value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Account API" /></Field>
      </div>
      <div className={styles.formGrid}>
        <Field label="Test name" wide><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Ride request is synchronized to operations" data-testid="integration-name" /></Field>
        <Field label="Contract"><select value={contract} onChange={(event) => setContract(event.target.value)}><option>REST API</option><option>GraphQL</option><option>Webhook</option><option>Event stream</option><option>Deep link</option><option>Database sync</option></select></Field>
        <Field label="Endpoint / topic"><input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder="/v1/rides or rides.created" /></Field>
        <Field label="Purpose and risk" wide><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What must stay consistent across both systems?" /></Field>
      </div>
      <div className={styles.snapshotNote}><Network size={18} /><span><strong>Four executable steps are generated</strong><small>Valid payload, delivery, target state, and controlled failure handling.</small></span></div>
      {error && <FormError message={error} />}
      <div className={styles.modalFooter}><button type="button" className={styles.textButton} onClick={onClose}>Cancel</button><button className={styles.primaryButton} disabled={submitting || !name.trim() || !source.trim() || !target.trim()}><Plus size={16} /> {submitting ? "Creating…" : "Create integration test"}</button></div>
    </form>
  </Modal>;
}
