"use client";

import { ErrorToast } from "../../../presentation/common/error/ErrorToast";
import { Button } from "@heroui/react";
import { Monitor, Smartphone } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationList } from "../../application/list/useAdministrationList";
import { useAdministrationCommand } from "../../application/state/useAdministrationCommand";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import { administrationError } from "../copy/administration-errors";
import { ResourceState } from "../common/ResourceState";
import styles from "../layout/administration.module.css";
import deviceStyles from "./profile-sessions.module.css";
import { sessionDevice } from "./session-device";
import { SessionRevokeConfirmation } from "./confirmation/SessionRevokeConfirmation";

export function ProfileSessions({ client, version, showHeading = true, onPendingChange }: {
  readonly client: AdministrationPort; readonly version: number; readonly showHeading?: boolean; readonly onPendingChange?: (pending: boolean) => void;
}) {
  const { locale, languageTag } = useTmsLocale();
  const copy = administrationCopy(locale);
  const list = useAdministrationList(useCallback((_: string, cursor: string | null, signal: AbortSignal) => client.sessions(cursor, signal), [client]));
  const command = useAdministrationCommand();
  const pendingNotice = useRef<(() => void) | null>(null);
  const releasePending = useCallback(() => { const release = pendingNotice.current; pendingNotice.current = null; release?.(); }, []);
  useEffect(() => releasePending, [releasePending]);
  const [confirmation, setConfirmation] = useState<{ client: AdministrationPort; id: string } | null>(null);
  const owner = useRef(client), focusRow = useRef<string | null>(null);
  owner.current = client;
  useEffect(() => { setConfirmation(null); focusRow.current = null; if (version) list.refresh(); }, [client, version, list.refresh]);
  const cancel = (id: string) => { if (!command.pending) { focusRow.current = id; setConfirmation(null); command.clearError(); } };
  return <section className={`${styles.section} ${deviceStyles.section}`} aria-label={copy.sessions}>{showHeading && <h2>{copy.sessions}</h2>}
    {list.loading ? <ResourceState loading error={null} retry={list.refresh} /> : <div className={deviceStyles.list}>
      {!list.items.length && !list.error && <p className={deviceStyles.empty}>{locale === "ru" ? "Нет активных сессий." : "No active sessions."}</p>}
      {list.items.map((device) => {
        const presentation = sessionDevice(device.userAgent), Icon = presentation.mobile ? Smartphone : Monitor;
        const confirming = confirmation?.client === client && confirmation.id === device.id && !device.current;
        return <div className={deviceStyles.row} key={device.id}>
          <div className={deviceStyles.summary}>
            <span className={deviceStyles.device}><Icon size={18} strokeWidth={1.5} aria-hidden="true" /><span><strong>{presentation.label}</strong>
              <small>{device.current && <span className={deviceStyles.current}>{copy.currentSession} · </span>}<time dateTime={device.createdAt}>{new Date(device.createdAt).toLocaleString(languageTag)}</time></small></span></span>
            {!device.current && !confirming && <Button size="sm" radius="full" variant="light" className={deviceStyles.revoke} isDisabled={command.pending}
              ref={element => { if (element && focusRow.current === device.id) { element.focus(); focusRow.current = null; } }}
              onPress={() => { command.clearError(); setConfirmation({ client, id: device.id }); }}>{copy.endSession}</Button>}
          </div>
          {confirming && <SessionRevokeConfirmation label={presentation.label} pending={command.pending} onCancel={() => cancel(device.id)} onConfirm={() => {
            if (device.current || confirmation?.client !== client || !list.items.some(item => item.id === device.id && !item.current)) return;
            void command.execute(device.id, async (_, signal) => {
              pendingNotice.current = () => onPendingChange?.(false);
              try { onPendingChange?.(true); await client.revokeSession(device.id, signal); return true; }
              finally { releasePending(); }
            }).then(done => {
              if (done && owner.current === client) { setConfirmation(null); list.refresh(); }
            });
          }} />}
      </div>; })}
    </div>}
    <ErrorToast message={list.error || command.error ? administrationError(command.error ?? list.error!, locale) : null}
      retryLabel={list.error ? copy.retry : undefined} onRetry={list.error ? list.refresh : undefined} />
    {list.cursor && <Button size="sm" radius="full" variant="light" className={deviceStyles.more} isDisabled={list.pending || command.pending} onPress={() => void list.more()}>{copy.more}</Button>}
  </section>;
}
