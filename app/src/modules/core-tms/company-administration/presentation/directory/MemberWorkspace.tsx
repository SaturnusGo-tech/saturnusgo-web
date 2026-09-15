"use client";

import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { MemberChange } from "../../domain/administration";
import type { AdministrationPort } from "../../application/ports/administration-port";
import type { SignedInCompanySession } from "../../../auth/managed/domain/managed-access";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { AdministrationPanel } from "../panel/AdministrationPanel";
import { MemberList } from "../members/MemberList";
import { CreateMember } from "../members/CreateMember";
import { MemberDetail } from "../member-detail/MemberDetail";
import styles from "./directory.module.css";

export function MemberWorkspace({ client, session, id, creating, onBack, onOpen, onCreate }: {
  readonly client: AdministrationPort; readonly session: SignedInCompanySession; readonly id: string | null;
  readonly creating: boolean; readonly onBack: () => void; readonly onOpen: (id: string) => void; readonly onCreate: () => void;
}) {
  const { locale } = useTmsLocale();
  const [action, setAction] = useState<{ id: string; change: MemberChange | "edit" } | null>(null);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const refresh = () => setVersion((value) => value + 1);
  const open = creating || !!id;
  return <div className={styles.workspace} data-open={open}>
    <MemberList client={client} session={session} onAction={(identityId, change) => { setAction({ id: identityId, change }); onOpen(identityId); }} onOpen={onOpen} onCreate={onCreate} selectedId={id} creating={creating} version={version} disabled={busy} />
    <div className={styles.detailHost}>
      <div className={styles.placeholder}>{locale === "ru" ? "Выберите сотрудника" : "Select a person"}</div>
      <AnimatePresence mode="wait" initial={false}>
        {open && <AdministrationPanel key={creating ? "create" : id} busy={busy} onClose={onBack}
          label={creating ? (locale === "ru" ? "Новый сотрудник" : "New person") : (locale === "ru" ? "Карточка сотрудника" : "Person details")}>
          {creating ? <CreateMember client={client} owner={session.identity.owner} onBack={onBack} onBusy={setBusy}
            onCreated={(identityId) => { refresh(); onOpen(identityId); }} />
            : id && <MemberDetail requestedAction={action?.id === id ? action.change : null} onActionConsumed={() => setAction(null)} id={id} client={client} session={session} onBack={onBack} onSaved={refresh} onBusy={setBusy} />}
        </AdministrationPanel>}
      </AnimatePresence>
    </div>
  </div>;
}
