"use client";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import type { PublicActorProfile } from "../../../public/domain/public-profile";
import type { SelfProfile, SelfProfileDetails } from "../../domain/profile-model";
import { MarkdownField } from "../../../../presentation/cases/inspector/markdown/MarkdownField";
import styles from "./profile-about.module.css";

type Props={profile:PublicActorProfile;ru:boolean;readOnly:true}|{
 profile:SelfProfile;ru:boolean;pending:boolean;readOnly?:false;onSave:(details:SelfProfileDetails)=>Promise<boolean>;
};
export function ProfileAbout(props:Props) {
  const {profile,ru}=props,edit=props.readOnly?null:props;
  const [editing, setEditing] = useState(false), [draft, setDraft] = useState(profile.bio ?? "");
  useEffect(() => { setDraft(profile.bio ?? ""); setEditing(false); }, [profile.id, profile.bio]);
  const label = props.readOnly ? (ru ? "Описание" : "About") : (ru ? "Обо мне" : "About me");
  return <section className={styles.about} data-editing={editing || undefined} aria-label={label}>
    <header><h2>{label}</h2>{edit&&<button type="button" onClick={() => setEditing(value => !value)} disabled={edit.pending} aria-expanded={editing} aria-label={ru ? "Редактировать описание" : "Edit about me"}><Pencil size={16} strokeWidth={1.6} /></button>}</header>
    {editing&&edit ? <div className={styles.editing}>
      <MarkdownField value={draft} label={label} onChange={setDraft} autoFocus allowAttachments={false} />
      <footer><span data-invalid={draft.length > 2000}>{draft.length} / 2000</span><button type="button" disabled={edit.pending} onClick={() => { setDraft(profile.bio ?? ""); setEditing(false); }}>{ru ? "Отмена" : "Cancel"}</button>
        <button type="button" className={styles.save} disabled={edit.pending || draft.length > 2000 || draft === (profile.bio ?? "")} onClick={() => {
          void edit.onSave({ name: profile.name, introduction: profile.introduction ?? "", bio: draft.trim(), location: edit.profile.location ?? "", phone: edit.profile.phone ?? "", contactUrl: edit.profile.contactUrl }).then(saved => { if (saved) setEditing(false); });
        }}>{edit.pending ? (ru ? "Сохраняем…" : "Saving…") : (ru ? "Сохранить" : "Save")}</button></footer>
    </div> : profile.bio?.trim() ? <div className={styles.prose}><MarkdownField value={profile.bio} label={label} allowAttachments={false} /></div>
      : props.readOnly ? <p className={styles.empty}>{ru ? "Описание пока не добавлено." : "No description has been added."}</p> : <div className={styles.empty}><img src="/falcon/achievements/40-full-qa-cycle.webp" alt="" width={88} height={88} /><h3>{ru ? "За качеством стоит человек" : "Quality has a human side"}</h3><p>{ru ? "Расскажите о своей специализации, опыте и том, что вам нравится проверять." : "Share your expertise, experience and the work you love to test."}</p><button type="button" onClick={() => setEditing(true)}>{ru ? "Рассказать о себе" : "Introduce yourself"}</button></div>}
  </section>;
}
