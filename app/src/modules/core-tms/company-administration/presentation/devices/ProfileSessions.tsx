"use client";

import { Monitor, Smartphone } from "lucide-react";
import { useCallback, useEffect } from "react";
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

export function ProfileSessions({ client, version, showHeading = true }: { readonly client: AdministrationPort; readonly version: number; readonly showHeading?: boolean }) {
  const { locale, languageTag } = useTmsLocale();
  const copy = administrationCopy(locale);
  const list = useAdministrationList(useCallback((_: string, cursor: string | null, signal: AbortSignal) => client.sessions(cursor, signal), [client]));
  const command = useAdministrationCommand();
  useEffect(() => { if (version) list.refresh(); }, [version, list.refresh]);
  return <section className={styles.section} aria-label={copy.sessions}>{showHeading && <h2>{copy.sessions}</h2>}
    {list.loading ? <ResourceState loading error={null} retry={list.refresh} /> : <div className={deviceStyles.list}>
      {!list.items.length && !list.error && <p className={deviceStyles.empty}>{locale === "ru" ? "Нет активных сессий." : "No active sessions."}</p>}
      {list.items.map((device) => {
        const presentation = sessionDevice(device.userAgent), Icon = presentation.mobile ? Smartphone : Monitor;
        return <div className={deviceStyles.row} key={device.id}>
        <span className={deviceStyles.device}><Icon size={18} strokeWidth={1.5} aria-hidden="true" /><span><strong>{device.current ? copy.currentSession : presentation.label}</strong>
          <small>{new Date(device.createdAt).toLocaleString(languageTag)}</small></span></span>
        {!device.current && <button type="button" className={deviceStyles.revoke} disabled={command.pending} onClick={() => {
          void command.execute(device.id, async (_, signal) => { await client.revokeSession(device.id, signal); return true; }).then((done) => { if (done) list.refresh(); });
        }}>{copy.endSession}</button>}
      </div>; })}
    </div>}
    {(list.error || command.error) && <p className={styles.error} role="alert">{administrationError(command.error ?? list.error!, locale)}</p>}
    {list.cursor && <button className={styles.button} disabled={list.pending} onClick={() => void list.more()}>{copy.more}</button>}
  </section>;
}
