import { Button } from "@heroui/react";
import { useEffect, useState } from "react";
import type { NotificationsState } from "../../application/useNotifications";
import type { NotificationEventType } from "../../domain/notifications";
import { notificationCategories } from "../events/category-copy";
import { PreferenceSwitch } from "../controls/PreferenceSwitch";
import styles from "./advanced-filters.module.css";
export function AdvancedEventFilters({ model: m, ru, onSaved, onDirtyChange }: {
  model: NotificationsState; ru: boolean; onSaved?: () => void; onDirtyChange?: (dirty: boolean) => void;
}) {
  const s = m.settings;
  const version = s?.version;
  const [draft, setDraft] = useState<{ version: number | undefined; excluded: NotificationEventType[] }>({ version, excluded: s?.excludedEventTypes ?? [] });
  const excluded = draft.excluded;
  useEffect(() => { setDraft(current => current.version === version ? current
    : { version, excluded: s?.excludedEventTypes ?? [] }); }, [version, s?.excludedEventTypes]);
  const dirty = Boolean(s && (excluded.length !== s.excludedEventTypes.length || excluded.some(value => !s.excludedEventTypes.includes(value))));
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);
  if (!s) return null;
  return <form className={styles.form} onSubmit={event => { event.preventDefault(); void m.changeExcludedEvents(excluded, draft.version).then(saved => { if (saved) onSaved?.(); }); }}>
    <p className={styles.description}>{ru ? "Уточните, какие события доставлять в Telegram и подключённые браузеры. Отключённая категория блокирует все её события. Эти фильтры не меняют список входящих Falcon." : "Fine-tune what reaches Telegram and connected browsers. Turning off a category pauses all its events. These filters do not change your Falcon inbox."}</p>
    <div className={styles.groups}>
      {notificationCategories.map(category => {
        const events = s.availableEvents.filter(event => event.category === category.id);
        const active = s.categories.includes(category.id);
        if (!events.length) return null;
        return <fieldset className={styles.group} key={category.id} disabled={m.busy}>
          <legend>{ru ? category.ru : category.en}{!active && <span>{ru ? "Категория выключена" : "Category off"}</span>}</legend>
          {events.map(event => <PreferenceSwitch key={event.type} label={ru ? event.labelRu : event.labelEn}
            selected={!excluded.includes(event.type)} disabled={m.busy}
            onChange={selected => setDraft(current => ({ ...current, excluded: selected ? current.excluded.filter(value => value !== event.type) : [...current.excluded, event.type] }))}/>)}
        </fieldset>;
      })}
    </div>
    <footer className={styles.footer}>
      <span role="status">{m.busy ? (ru ? "Сохраняем…" : "Saving…") : !dirty ? (ru ? "Все изменения сохранены" : "All changes saved") : (ru ? "Есть несохранённые изменения" : "Unsaved changes")}</span>
      {dirty && <Button size="sm" radius="full" variant="light" isDisabled={m.busy} onPress={() => setDraft({ version, excluded: s.excludedEventTypes })} className={styles.cancel}>{ru ? "Отменить изменения" : "Discard changes"}</Button>}
      <Button type="submit" size="sm" radius="full" isDisabled={m.busy || !dirty} className={styles.save}>{ru ? "Сохранить" : "Save changes"}</Button>
    </footer>
  </form>;
}
