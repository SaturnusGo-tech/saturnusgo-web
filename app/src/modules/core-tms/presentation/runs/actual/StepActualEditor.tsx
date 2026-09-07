import { useEffect, useRef, useState } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import styles from "../../../tms.module.css";
import css from "./step-actual.module.css";

export function StepActualEditor({ value, order, onChange, onSave, onDirtyChange }: {
  value: string; order: number; onChange: (value: string) => void;
  onSave: (value: string) => Promise<boolean>; onDirtyChange: (dirty: boolean) => void;
}) {
  const { locale, t } = useTmsLocale();
  const [saved, setSaved] = useState(value);
  const [draft, setDraft] = useState(value);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const dirty = saved !== draft;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (!dirty && !pending) { setSaved(value); setDraft(value); } }, [value, dirty, pending]);
  async function save() {
    if (!dirty || inFlight.current) return;
    inFlight.current = true; setPending(true); setFailed(false);
    try {
      const accepted = await onSave(draft);
      if (!mounted.current) return;
      if (!accepted) { setFailed(true); return; }
      setSaved(draft.trim()); setDraft(draft.trim()); onDirtyChange(false);
    } catch { if (mounted.current) setFailed(true); }
    finally { inFlight.current = false; if (mounted.current) setPending(false); }
  }
  return <div className={css.editor}>
    <textarea aria-label={`${t("runs.actual")}: ${order}`} value={draft} readOnly={pending}
      maxLength={20_000} placeholder={t("runs.actualPlaceholder")}
      onChange={(event) => { setDraft(event.target.value); onChange(event.target.value); onDirtyChange(event.target.value !== saved); }}
      onBlur={() => void save()} />
    <div className={css.actions}>
      <button type="button" className={styles.secondaryButton} disabled={!dirty || pending}
        onMouseDown={(event) => event.preventDefault()} onClick={() => void save()}>
        {pending ? (locale === "ru" ? "Сохраняем…" : "Saving…")
          : (locale === "ru" ? "Сохранить результат" : "Save result")}</button>
      <span role="status">{!dirty && !pending ? (locale === "ru" ? "Сохранено" : "Saved") : ""}</span>
    </div>
    {failed && <p role="alert">{locale === "ru" ? "Результат не сохранён. Повторите сохранение перед завершением кейса."
      : "Result was not saved. Retry saving before finishing the case."}</p>}
  </div>;
}
