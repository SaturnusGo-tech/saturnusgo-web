import { LayoutDashboard, Plus } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Dashboard } from "../../../../../core/tms/contracts/legacy-contract";
import { createDashboard } from "../../../application/dashboards/createDashboard";
import { FormError } from "../../common/error/FormError";
import { Field } from "../../common/field/Field";
import { Modal } from "../../common/modal/Modal";
import styles from "../../../tms.module.css";

type DashboardDialogProps = {
  workspaceId: string;
  projectId: string | null;
  offline: boolean;
  onClose: () => void;
  onCreated: (dashboard: Dashboard) => void;
};

export function DashboardDialog({
  workspaceId,
  projectId,
  offline,
  onClose,
  onCreated,
}: DashboardDialogProps) {
  const [name, setName] = useState("Release quality");
  const [description, setDescription] = useState(
    "Release readiness and manual test results",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      onCreated(
        await createDashboard({
          workspaceId,
          projectId,
          name,
          description,
          offline,
        }),
      );
    } catch {
      setError("The dashboard was not created. Check the TMS API and retry.");
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Create dashboard"
      subtitle="Start with a useful quality overview."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className={styles.formGrid}>
          <Field label="Name" wide>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label="Description" wide>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
        </div>
        <div className={styles.widgetPreview}>
          <LayoutDashboard size={22} />
          <div>
            <strong>Starter widgets included</strong>
            <p>Run progress, pass rate, open defects, and recent activity.</p>
          </div>
        </div>
        {error && <FormError message={error} />}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.textButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.primaryButton} disabled={submitting}>
            <Plus size={16} /> {submitting ? "Creating…" : "Create dashboard"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
