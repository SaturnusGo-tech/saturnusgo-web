"use client";

import { Button, Drawer, DrawerBody, DrawerContent, DrawerHeader } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { ErrorToast } from "../../../presentation/common/error/ErrorToast";
import { useRef } from "react";
import { ListChecks, Plus, X } from "lucide-react";
import type { ProductDocCase, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocRelatedCaseSelection } from "../../domain/related-cases/product-doc-related-cases";
import { RelatedCasePicker } from "./picker/RelatedCasePicker";
import styles from "./related-cases.module.css";

type Props = {
  open: boolean; selecting: boolean; cases: ProductDocCase[]; scope: ProductDocScope; projectName: string;
  ru: boolean; editable: boolean; busy: boolean; saveFailed: boolean; loading: boolean; loadFailed?: boolean;
  onSelect(value: boolean): void; onClose(): void; onSave(value: ProductDocRelatedCaseSelection): Promise<boolean>;
  onOpenCase?(caseId: string): void;
};

export function ProductDocRelatedCasesDrawer(props: Props) {
  const { open, selecting, cases, scope, projectName, ru, editable, busy, loading, loadFailed, saveFailed, onSelect, onClose, onSave, onOpenCase } = props;
  const reduced = useReducedMotion();
  const pendingCase = useRef<string | undefined>(undefined);
  function openCase(id: string) {
    if (busy || !onOpenCase) return;
    pendingCase.current = id;
    onClose();
    if (reduced) releaseCase();
  }
  function releaseCase() {
    const id = pendingCase.current;
    pendingCase.current = undefined;
    if (id) requestAnimationFrame(() => onOpenCase?.(id));
  }
  const title = ru ? "Связанные кейсы" : "Related Cases";
  return <Drawer isOpen={open} onClose={busy ? () => {} : onClose} placement="right" scrollBehavior="inside"
    size={selecting ? "4xl" : "lg"} hideCloseButton disableAnimation={Boolean(reduced)}
    classNames={{ wrapper: styles.wrapper, backdrop: styles.backdrop, base: `${styles.drawer} ${selecting ? styles.pickerDrawer : ""}` }} aria-label={title}
    motionProps={{ onAnimationComplete: definition => { if (definition === "exit") releaseCase(); } }}>
    <DrawerContent>
      <header className={styles.header}>
        <DrawerHeader as="h2">{selecting ? (ru ? "Добавить кейсы или папки" : "Add cases or folders") : title}
          {!selecting && <span className={styles.total}>{cases.length}</span>}</DrawerHeader>
        <Button isIconOnly variant="light" size="sm" isDisabled={busy} aria-label={ru ? "Закрыть" : "Close"} onPress={onClose}>
          <X size={17} aria-hidden="true" />
        </Button>
      </header>
      {open && selecting && editable ? <RelatedCasePicker scope={scope} baseline={cases} projectName={projectName} ru={ru}
        busy={busy} failed={saveFailed} canApply={!loading && !loadFailed} onCancel={() => onSelect(false)} onApply={async selection => {
          if (await onSave(selection)) onSelect(false);
        }} /> : <DrawerBody className={styles.body}>
        {loadFailed ? <ErrorToast message={ru ? "Не удалось загрузить связанные кейсы." : "Could not load related cases."} />
          : loading ? <p role="status">{ru ? "Загрузка…" : "Loading…"}</p> : cases.length ? <ul className={styles.list}>
          {cases.map(item => <li key={item.caseId}>
            <button type="button" className={styles.caseLink} disabled={!onOpenCase || busy} onClick={() => openCase(item.caseId)}>
              <ListChecks size={15} aria-hidden="true" /><span>{item.title}</span>
            </button>
            {editable && <Button isIconOnly variant="light" size="sm" isDisabled={busy}
              aria-label={`${ru ? "Убрать связь" : "Remove link"}: ${item.title}`}
              onPress={() => void onSave({ baseline: [item], cases: [] })}><X size={14} aria-hidden="true" /></Button>}
          </li>)}
        </ul> : <p>{ru ? "Нет связанных кейсов" : "No related cases"}</p>}
        {saveFailed && <p className={styles.error} role="alert">{ru ? "Не удалось изменить связи. Повторите попытку." : "Could not update links. Try again."}</p>}
        {editable && <Button variant="light" size="sm" className={styles.textAction} isDisabled={busy || loading || loadFailed} onPress={() => onSelect(true)}>
          <Plus size={14} aria-hidden="true" />{ru ? "Добавить кейсы или папки" : "Add cases or folders"}</Button>}
      </DrawerBody>}
    </DrawerContent>
  </Drawer>;
}
