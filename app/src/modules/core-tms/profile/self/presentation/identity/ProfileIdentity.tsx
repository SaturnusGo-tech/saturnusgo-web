"use client";
import { Camera, Link2, Mail, Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { ProfileMediaKind, SelfProfile, SelfProfileDetails } from "../../domain/profile-model";
import { ProfileEditor } from "../editor/ProfileEditor";
import { profileCopy } from "../copy/profile-copy";
import styles from "./profile-identity.module.css";

export function ProfileIdentity({ profile, ru, pending, onUpload, onRemove, onSave }: {
  profile: SelfProfile; ru: boolean; pending: boolean;
  onUpload: (kind: ProfileMediaKind, file: File) => void; onRemove: (kind: ProfileMediaKind) => void;
  onSave: (details: SelfProfileDetails) => Promise<boolean>;
}) {
  const copy = profileCopy(ru), avatarInput = useRef<HTMLInputElement>(null);
  const [failed, setFailed] = useState<string | null>(null), [editing, setEditing] = useState(false);
  const initials = profile.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "QA";
  const contact = profile.contactUrl && /^(https:\/\/|mailto:)/i.test(profile.contactUrl) ? profile.contactUrl : null;
  return <section className={styles.identity} aria-label={copy.title}>
    <div className={styles.portrait}>
      <button type="button" className={styles.photo} disabled={pending} onClick={() => avatarInput.current?.click()} aria-label={copy.avatar}>
        {profile.avatar?.url && failed !== profile.avatar.url ? <img src={profile.avatar.url} alt={profile.name} referrerPolicy="no-referrer" onError={() => setFailed(profile.avatar!.url)} /> : <span className={styles.initials}>{initials}</span>}
        <span className={styles.camera}><Camera size={16} strokeWidth={1.6} /><span>{copy.avatar}</span></span>
      </button>
      {profile.hasAvatar && <button type="button" className={styles.remove} disabled={pending} onClick={() => onRemove("avatar")} aria-label={copy.removeAvatar} title={copy.removeAvatar}><Trash2 size={15} strokeWidth={1.6} /></button>}
    </div>
    <div className={styles.person}>
      <div className={styles.name}><h2>{profile.name}</h2><button type="button" disabled={pending} onClick={() => setEditing(value => !value)} aria-label={ru ? "Редактировать профиль" : "Edit profile"} aria-expanded={editing}><Pencil size={15} strokeWidth={1.6} /></button></div>
      {!editing && <>{profile.introduction && <p>{profile.introduction}</p>}
        <address className={styles.contacts}>
          {contact && <a href={contact} target="_blank" rel="noreferrer"><Link2 size={14} /><span>{contact.replace(/^https:\/\//i, "").replace(/^mailto:/i, "")}</span></a>}
          {profile.email && <span><Mail size={14} /><span>{profile.email}</span></span>}
        </address></>}
      {editing && <div className={styles.editor}><ProfileEditor profile={profile} pending={pending} ru={ru} onCancel={() => setEditing(false)} onSave={async details => { const saved = await onSave(details); if (saved) setEditing(false); return saved; }} /></div>}
    </div>
    <input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={pending}
      onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) onUpload("avatar", file); }} />
  </section>;
}
