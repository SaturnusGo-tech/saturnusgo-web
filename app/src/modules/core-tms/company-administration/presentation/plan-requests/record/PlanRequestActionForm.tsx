"use client";

import { useState, type FormEvent } from "react";
import type { PlanRequestAction, PlanRequestChange, PlanRequestDetail } from "../../../domain/plan-requests/plan-request";
import shared from "../../layout/administration.module.css";
import type { planRequestCopy } from "../plan-request-copy";
import styles from "../plan-requests.module.css";

type Copy = ReturnType<typeof planRequestCopy>;

export function PlanRequestActionForm({ action, request, workspaceName, copy, error, canRefresh, pending, submit, onRefresh, onCancel }: {
  readonly action: PlanRequestAction;
  readonly request: PlanRequestDetail;
  readonly workspaceName: string;
  readonly copy: Copy;
  readonly error: string | null;
  readonly canRefresh: boolean;
  readonly pending: boolean;
  readonly submit: (change: PlanRequestChange) => Promise<void>;
  readonly onRefresh: () => void;
  readonly onCancel: () => void;
}) {
  const { t, action: actionLabel } = copy;
  const approval = action === "approve";
  const revoke = action === "revoke";
  const reasonField = revoke || action === "decline";
  const [duration, setDuration] = useState("14");
  const [note, setNote] = useState("");
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = note.trim();
    const days = Number(duration);
    if ((revoke && !value) || (approval && (!Number.isInteger(days) || days < 1 || days > 90))) return;
    void submit({
      expectedVersion: request.version,
      ...(approval ? { durationDays: days } : {}),
      ...(value ? (reasonField ? { reason: value } : { note: value }) : {}),
    });
  }

  return <form className={styles.actionForm} onSubmit={onSubmit}>
    <h2>{actionLabel(action)}</h2>
    {approval && <>
      <p><strong>{request.applicantEmail}</strong> · {workspaceName}</p>
      <p>{t("Pilot access starts at activation. The invitation is valid for seven days.", "Пилотный доступ начинается с активации. Приглашение действует семь дней.")}</p>
      <label>{t("Pilot duration in days", "Длительность пилота в днях")}
        <input type="number" min={1} max={90} step={1} required value={duration} onChange={(event) => setDuration(event.target.value)} disabled={pending} />
      </label>
    </>}
    {revoke && <p>{t("This ends access granted through this request.", "Будет отключён доступ, выданный по этой заявке.")}</p>}
    <label>{revoke ? t("Reason for revoking access", "Причина отзыва доступа") : reasonField ? t("Reason (optional)", "Причина (необязательно)") : t("Internal note (optional)", "Внутренняя заметка (необязательно)")}
      <textarea rows={2} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} required={revoke} disabled={pending} />
    </label>
    {error && <p className={shared.error} role="alert">{error}</p>}
    <div className={styles.actionRow}>
      <button className={shared.primary} type="submit" disabled={pending || canRefresh || (revoke && !note.trim())}>
        {pending ? t("Saving…", "Сохранение…") : actionLabel(action)}
      </button>
      {canRefresh && <button className={shared.button} type="button" onClick={onRefresh} disabled={pending}>{t("Refresh request", "Обновить заявку")}</button>}
      <button className={shared.button} type="button" onClick={onCancel} disabled={pending}>{t("Cancel", "Отмена")}</button>
    </div>
  </form>;
}
