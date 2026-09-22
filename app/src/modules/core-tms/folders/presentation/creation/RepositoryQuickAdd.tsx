import { useDndContext } from "@dnd-kit/core";
import { useRef } from "react";
import { PiPlus } from "react-icons/pi";
import type { RepositoryCreation } from "../../model/creation/repository-creation";
import { InlineFolderForm } from "./InlineFolderForm";
import css from "./quick-add.module.css";

type Target = { kind: "folder"; id: string; name: string };
export function RepositoryQuickAdd({ target, creation, disabled, ru }: {
  target: Target; creation: RepositoryCreation; disabled: boolean; ru: boolean;
}) {
  const { active } = useDndContext();
  const trigger = useRef<HTMLButtonElement>(null);
  const editing = creation.activeFolderId === target.id;
  const unavailable = disabled || Boolean(active);
  const restoreFocus = () => requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
  const label = ru ? "Добавить подпапку" : "Add subfolder";
  return <div className={css.reveal} data-open={editing || undefined} data-disabled={!editing && unavailable || undefined}>
    <div className={css.clip}>
      {editing ? <InlineFolderForm parentId={target.id} parentName={target.name} creation={creation}
        disabled={disabled} ru={ru} restoreFocus={restoreFocus} />
        : <button ref={trigger} className={css.action} type="button" disabled={unavailable} onClick={() => {
          if (unavailable) return;
          creation.begin(target.id);
        }}><PiPlus size={14} aria-hidden="true" /><span>{label}</span></button>}
    </div>
  </div>;
}
