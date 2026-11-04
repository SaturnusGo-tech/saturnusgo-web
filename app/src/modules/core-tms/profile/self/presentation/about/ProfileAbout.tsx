"use client";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import type { SelfProfile, SelfProfileDetails } from "../../domain/profile-model";
import { MarkdownField } from "../../../../presentation/cases/inspector/markdown/MarkdownField";
import styles from "./profile-about.module.css";

export function ProfileAbout({ profile, ru, pending, onSave }: {
  profile: SelfProfile; ru: boolean; pending: boolean; onSave: (details: SelfProfileDetails) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false), [draft, setDraft] = useState(profile.bio ?? "");
  useEffect(() => { setDraft(profile.bio ?? ""); setEditing(false); }, [profile.id, profile.bio]);
  const label = ru ? "Обо мне" : "About me";
  return <section className={styles.about} data-editing={editing || undefined} aria-label={label}>
    <header><h2>{label}</h2><button type="button" onClick={() => setEditing(value => !value)} disabled={pending} aria-expanded={editing} aria-label={ru ? "Редактировать описание" : "Edit about me"}><Pencil size={16} strokeWidth={1.6} /></button></header>
    {editing ? <div className={styles.editing}>
      <MarkdownField value={draft} label={label} onChange={setDraft} autoFocus allowAttachments={false} />
      <footer><span data-invalid={draft.length > 2000}>{draft.length} / 2000</span><button type="button" disabled={pending} onClick={() => { setDraft(profile.bio ?? ""); setEditing(false); }}>{ru ? "Отмена" : "Cancel"}</button>
        <button type="button" className={styles.save} disabled={pending || draft.length > 2000 || draft === (profile.bio ?? "")} onClick={() => {
          void onSave({ name: profile.name, introduction: profile.introduction ?? "", bio: draft.trim(), location: profile.location ?? "", phone: profile.phone ?? "", contactUrl: profile.contactUrl }).then(saved => { if (saved) setEditing(false); });
        }}>{pending ? (ru ? "Сохраняем…" : "Saving…") : (ru ? "Сохранить" : "Save")}</button></footer>
    </div> : profile.bio?.trim() ? <div className={styles.prose}><MarkdownField value={profile.bio} label={label} allowAttachments={false} /></div>
      : <div className={styles.empty}><img src="/falcon/achievements/40-full-qa-cycle.webp" alt="" width={88} height={88} /><h3>{ru ? "За качеством стоит человек" : "Quality has a human side"}</h3><p>{ru ? "Расскажите о своей специализации, опыте и том, что вам нравится проверять." : "Share your expertise, experience and the work you love to test."}</p><button type="button" onClick={() => setEditing(true)}>{ru ? "Рассказать о себе" : "Introduce yourself"}</button></div>}
  </section>;
}
