"use client";

import { ChevronDown, ChevronRight, Inbox } from "lucide-react";
import { useCallback, useState } from "react";
import { workspaceDisplayName } from "../../../localization/format/workspace/display-name";
import { useAdministrationList } from "../../application/list/useAdministrationList";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { planRequestStatuses, type PlanRequestStatus } from "../../domain/plan-requests/plan-request";
import { ResourceState } from "../common/ResourceState";
import shared from "../layout/administration.module.css";
import { PlanRequestRecord } from "./record/PlanRequestRecord";
import { planRequestCopy, planRequestNames } from "./plan-request-copy";
import styles from "./plan-requests.module.css";

export function PlanRequests({ client, id, locale, onOpen, onBack, onOpenCompany }: {
  readonly client: AdministrationPort;
  readonly id: string | null;
  readonly locale: "en" | "ru";
  readonly onOpen: (id: string) => void;
  readonly onBack: () => void;
  readonly onOpenCompany: (id: string) => void;
}) {
  const [status, setStatus] = useState<PlanRequestStatus | "">("");
  if (id) return <PlanRequestRecord key={id} client={client} id={id} locale={locale} onBack={onBack} onOpenCompany={onOpenCompany} />;
  return <PlanRequestList client={client} status={status} setStatus={setStatus} locale={locale} onOpen={onOpen} />;
}

function PlanRequestList({ client, status, setStatus, locale, onOpen }: {
  readonly client: AdministrationPort;
  readonly status: PlanRequestStatus | "";
  readonly setStatus: (status: PlanRequestStatus | "") => void;
  readonly locale: "en" | "ru";
  readonly onOpen: (id: string) => void;
}) {
  const { t, date, status: statusLabel } = planRequestCopy(locale);
  const load = useCallback((_search: string, cursor: string | null, signal: AbortSignal) =>
    client.planRequests(status, cursor, signal), [client, status]);
  const list = useAdministrationList(load);
  return <div className={styles.screen}>
    <header className={shared.heading}><div>
      <h1>{t("Plan requests", "Заявки на планы")}</h1>
      <p>{t("Review requests and manage pilot access.", "Проверяйте заявки и управляйте пилотным доступом.")}</p>
    </div></header>
    <label className={styles.filter}>
      <span className={styles.visuallyHidden}>{t("Filter by status", "Фильтр по статусу")}</span>
      <select value={status} onChange={(event) => setStatus(event.target.value as PlanRequestStatus | "")}>
        <option value="">{t("All statuses", "Все статусы")}</option>
        {planRequestStatuses.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}
      </select>
      <ChevronDown size={14} aria-hidden="true" />
    </label>
    {list.loading || (list.error && !list.items.length)
      ? <ResourceState loading={list.loading} error={list.error} retry={list.refresh} />
      : list.items.length === 0
        ? <div className={styles.empty}>
          <Inbox size={28} strokeWidth={1.5} aria-hidden="true" />
          <h2>{status ? t("No requests with this status", "Заявок с таким статусом нет") : t("No plan requests yet", "Заявок пока нет")}</h2>
          <p>{status ? t("Choose another status to see more requests.", "Выберите другой статус, чтобы посмотреть заявки.") : t("New requests from Falcon will appear here.", "Здесь появятся заявки из Falcon.")}</p>
        </div>
        : <ul className={styles.queue} aria-busy={list.pending}>{list.items.map((request) => <li key={request.id}>
          <a className={styles.row} href={`?page=plan-requests&id=${encodeURIComponent(request.id)}`} onClick={(event) => {
            if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            onOpen(request.id);
          }}>
            <span className={styles.identity}><strong>{request.applicantName || request.applicantEmail}</strong><small>{request.applicantEmail}</small></span>
            <span className={styles.identity}><strong>{planRequestNames[request.planId]}</strong><small>{workspaceDisplayName({ name: request.workspaceName, kind: request.workspaceKind }, locale)}</small></span>
            <span className={shared.badge} data-state={request.status === "activating" ? "pending" : request.status}>{statusLabel(request.status)}</span>
            <time dateTime={request.createdAt}>{date(request.createdAt)}</time>
            <ChevronRight size={15} aria-hidden="true" />
          </a>
        </li>)}</ul>}
    {list.error && list.items.length > 0 && <ResourceState loading={false} error={list.error} retry={list.refresh} />}
    {list.cursor && <div className={shared.actions}><button className={shared.button} disabled={list.pending} onClick={() => void list.more()}>
      {list.pending ? t("Loading…", "Загрузка…") : t("Show more", "Показать ещё")}
    </button></div>}
  </div>;
}
