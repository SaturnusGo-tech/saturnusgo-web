"use client";

import { Monitor } from "lucide-react";
import { useCallback, useEffect } from "react";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { useAdministrationList } from "../../application/list/useAdministrationList";
import { useAdministrationCommand } from "../../application/state/useAdministrationCommand";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { administrationCopy } from "../copy/administration-copy";
import { administrationError } from "../copy/administration-errors";
import { ResourceState } from "../common/ResourceState";
import styles from "../layout/administration.module.css";

export function ProfileSessions({ client, version }: { readonly client: AdministrationPort; readonly version: number }) {
  const { locale, languageTag } = useTmsLocale();
  const copy = administrationCopy(locale);
  const list = useAdministrationList(useCallback((_: string, cursor: string | null, signal: AbortSignal) => client.sessions(cursor, signal), [client]));
  const command = useAdministrationCommand();
  useEffect(() => { if (version) list.refresh(); }, [version, list.refresh]);
  return <section className={styles.section}><h2>{copy.sessions}</h2>
    {list.loading ? <ResourceState loading error={null} retry={list.refresh} /> : <div className={styles.list}>
      {list.items.map((device) => <div className={styles.row} key={device.id} style={{ cursor: "default" }}>
        <span className={styles.rowTitle}><Monitor size={20} strokeWidth={1.3} /><span><strong>{device.current ? copy.currentSession : device.userAgent || "Falcon"}</strong>
          <small>{new Date(device.createdAt).toLocaleString(languageTag)}</small></span></span>
        {!device.current && <button className={styles.button} disabled={command.pending} onClick={() => {
          void command.execute(device.id, async (_, signal) => { await client.revokeSession(device.id, signal); return true; }).then((done) => { if (done) list.refresh(); });
        }}>{copy.endSession}</button>}
      </div>)}
    </div>}
    {(list.error || command.error) && <p className={styles.error} role="alert">{administrationError(command.error ?? list.error!, locale)}</p>}
    {list.cursor && <button className={styles.button} disabled={list.pending} onClick={() => void list.more()}>{copy.more}</button>}
  </section>;
}
