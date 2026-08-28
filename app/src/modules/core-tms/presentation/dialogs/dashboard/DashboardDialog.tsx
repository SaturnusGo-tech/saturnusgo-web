import { LayoutDashboard, Plus } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Dashboard } from "../../../../../core/tms/contracts/legacy-contract";
import { createDashboard } from "../../../application/dashboards/createDashboard";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { FormError } from "../../common/error/FormError";
import { Field } from "../../common/field/Field";
import { Modal } from "../../common/modal/Modal";
import { getDashboardDialogCopy } from "./copy";
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
  const { locale } = useTmsLocale();
  const copy = getDashboardDialogCopy(locale);
  const [name, setName] = useState<string>(copy.defaultName);
  const [description, setDescription] = useState<string>(copy.defaultDescription);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(false);
    try {
      onCreated(
        await createDashboard({
          workspaceId,
          projectId,
          name,
          description,
          offline,
          locale,
        }),
      );
    } catch {
      setError(true);
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={copy.title}
      subtitle={copy.subtitle}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className={styles.formGrid}>
          <Field label={copy.name} wide>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label={copy.description} wide>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
        </div>
        <div className={styles.widgetPreview}>
          <LayoutDashboard size={22} />
          <div>
            <strong>{copy.widgets}</strong>
            <p>{copy.widgetsHint}</p>
          </div>
        </div>
        {error && <FormError message={copy.error} />}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.textButton} onClick={onClose}>
            {copy.cancel}
          </button>
          <button className={styles.primaryButton} disabled={submitting}>
            <Plus size={16} /> {submitting ? copy.creating : copy.create}
          </button>
        </div>
      </form>
    </Modal>
  );
}
