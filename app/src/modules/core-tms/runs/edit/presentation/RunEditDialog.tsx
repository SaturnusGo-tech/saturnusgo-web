import { LoadingOrb } from "../../../../../shared/components/loading/LoadingOrb";
import { Button, Drawer, DrawerContent, DrawerHeader, Input, Textarea } from "@heroui/react";
import { X } from "lucide-react";
import { useState } from "react";
import type { TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useDrawerDismiss } from "../../../presentation/common/drawer/useDrawerDismiss";
import { PropertyAssigneeField } from "../../../presentation/common/properties/metadata/PropertyAssigneeField";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useMemberName } from "../../../workspace/members/state/useMemberName";
import { RunPlatformBuildFields } from "../../builds/presentation/fields/RunPlatformBuildFields";
import { useRunEditor } from "../state/useRunEditor";
import css from "./runEdit.module.css";

const fieldClasses = { base: css.field, label: css.label, inputWrapper: css.fieldControl, innerWrapper: css.inner, input: css.input };

export function RunEditDialog({ run, workspaceId, onClose, onSaved }: {
  run: TestRunSummary; workspaceId: string; onClose: () => void; onSaved: (run: TestRunSummary) => void;
}) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const { closing, dismiss, panelRef } = useDrawerDismiss();
  const state = useRunEditor(run.id, run.projectId, ru);
  const [confirm, setConfirm] = useState<"close" | "reload" | null>(null);
  const [chosenOwner, setChosenOwner] = useState<{ identityId: string; displayName: string } | null>(null);
  const ownerId = state.draft.ownerIdentityId;
  const owner = useMemberName(workspaceId, ownerId, false);
  const ownerValue = ownerId ? {
    identityId: ownerId,
    displayName: (chosenOwner?.identityId === ownerId && chosenOwner.displayName) || owner.name
      || (owner.loading ? (ru ? "Загрузка…" : "Loading…") : (ru ? "Назначенный участник" : "Assigned member")),
  } : null;
  const close = () => dismiss(onClose);
  const ask = (action: "close" | "reload") => {
    if (state.busy || closing) return;
    if (state.draftDirty || state.uncertain) setConfirm(action);
    else if (action === "close") close();
    else void state.reload();
  };
  const canSave = state.phase === "ready" && state.editable && !state.busy && !state.conflict
    && !state.platformBuilds.uploading && (state.draftDirty || state.uncertain) && !closing;

  return <Drawer ref={panelRef} isOpen placement="right" onClose={() => ask("close")} scrollBehavior="inside"
    hideCloseButton backdrop="transparent" disableAnimation isDismissable={!state.busy && !closing}
    isKeyboardDismissDisabled={state.busy || closing}
    classNames={{ wrapper: css.wrapper, base: css.panel }}>
    <DrawerContent>
      <header className={css.header}>
        <div>
          <DrawerHeader as="h2">{ru ? "Настройки прогона" : "Run settings"}</DrawerHeader>
          <p>{run.key}</p>
        </div>
        <Button type="button" variant="light" size="sm" disableRipple isIconOnly className={css.close}
          aria-label={ru ? "Закрыть" : "Close"} isDisabled={state.busy || closing}
          onPress={() => ask("close")}><X size={17} aria-hidden="true" /></Button>
      </header>
      <form className={css.form} onSubmit={async event => {
        event.preventDefault();
        if (!canSave) return;
        const updated = await state.save();
        if (updated) dismiss(() => onSaved(updated));
      }}>
        <div className={css.content} aria-busy={state.phase === "loading" || state.busy}>
          {state.phase === "loading" && <div className={css.loading} role="status"><LoadingOrb />{ru ? "Загружаем настройки…" : "Loading settings…"}</div>}
          {state.phase === "ready" && <>
            {!state.editable && <p role="status" className={css.hint}>{ru ? "Этот прогон завершён или находится в архиве. Его настройки нельзя изменить." : "This run is finished or archived. Its settings cannot be edited."}</p>}
            <Input label={ru ? "Название" : "Name"} labelPlacement="outside-top" size="sm" variant="flat" classNames={fieldClasses}
              value={state.draft.name} maxLength={240} isDisabled={!state.fieldsEnabled} isRequired onValueChange={name => state.patch({ name })} />
            <Textarea label={ru ? "Описание" : "Description"} labelPlacement="outside-top" size="sm" variant="flat"
              classNames={fieldClasses} value={state.draft.description} maxLength={20000} minRows={2} maxRows={7}
              isDisabled={!state.fieldsEnabled} onValueChange={description => state.patch({ description })} />
            <div className={css.field}>
              <span className={css.label}>{ru ? "Ответственный за прогон" : "Run owner"}</span>
              <PropertyAssigneeField workspaceId={workspaceId} locale={locale} includeAgents value={ownerValue}
                disabled={!state.fieldsEnabled} portalContainer={panelRef.current ?? undefined}
                onChange={value => { setChosenOwner(value); state.patch({ ownerIdentityId: value?.identityId ?? null }); }} />
              <p className={css.hint}>{ru ? "Исполнители отдельных кейсов сохранятся." : "Individual case assignees stay as assigned."}</p>
            </div>
            <Input label={ru ? "Теги" : "Tags"} labelPlacement="outside-top" size="sm" variant="flat" classNames={fieldClasses}
              value={state.draft.tags} maxLength={1320} isDisabled={!state.fieldsEnabled}
              placeholder={ru ? "Через запятую" : "Separated by commas"} onValueChange={tags => state.patch({ tags })} />
            <div className={css.builds}><RunPlatformBuildFields controller={state.platformBuilds} projects={[{ id: run.projectId, name: "" }]}
              disabled={!state.fieldsEnabled} ru={ru} /></div>
          </>}
          {state.error && <p role="alert" className={css.error}>{state.error}</p>}
          {(state.phase === "error" || state.conflict) && <Button type="button" size="sm" variant="light" disableRipple className={css.textButton}
            isDisabled={state.busy} onPress={() => ask("reload")}>{ru ? "Загрузить актуальные данные" : "Reload current data"}</Button>}
          {confirm && <div className={css.confirm} role="alertdialog" aria-label={ru ? "Несохранённые изменения" : "Unsaved changes"}>
            <p>{state.uncertain ? (ru ? "Результат сохранения пока неизвестен. Загруженный файл останется доступен; проверьте прогон после обновления."
              : "The save result is still unknown. The uploaded file will be retained; check the run after reloading.")
              : (ru ? "Несохранённые изменения будут отменены." : "Unsaved changes will be discarded.")}</p>
            <div>
              <Button type="button" size="sm" variant="light" disableRipple autoFocus onPress={() => setConfirm(null)}>{ru ? "Продолжить редактирование" : "Keep editing"}</Button>
              <Button type="button" size="sm" variant="light" disableRipple onPress={() => {
                const action = confirm;
                setConfirm(null);
                if (action === "close") close(); else void state.reload();
              }}>{confirm === "close" ? (ru ? "Закрыть" : "Close") : (ru ? "Загрузить и заменить мои правки" : "Reload and discard my edits")}</Button>
            </div>
          </div>}
        </div>
        <footer className={css.footer}>
          <Button type="button" size="sm" variant="light" disableRipple className={css.cancel} isDisabled={state.busy || closing}
            onPress={() => ask("close")}>{ru ? "Отмена" : "Cancel"}</Button>
          <Button type="submit" size="sm" disableRipple className={css.save} isDisabled={!canSave}>
            {state.busy ? (ru ? "Сохраняем…" : "Saving…") : state.uncertain ? (ru ? "Повторить сохранение" : "Retry saving") : (ru ? "Сохранить" : "Save")}
          </Button>
        </footer>
      </form>
    </DrawerContent>
  </Drawer>;
}
