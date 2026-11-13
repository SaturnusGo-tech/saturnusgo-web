"use client";
import { Camera, Link2, Mail, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ProfileMediaKind, SelfProfile, SelfProfileDetails } from "../../domain/profile-model";
import type { PublicActorProfile } from "../../../public/domain/public-profile";
import { CodexMark } from "../../../../codex-employee/presentation/branding/CodexMark";
import { avatarCharacter } from "../../../avatars/content/avatar-characters";
import { AvatarChooser } from "../avatar/AvatarChooser";
import { ProfileEditor } from "../editor/ProfileEditor";
import { profileCopy } from "../copy/profile-copy";
import styles from "./profile-identity.module.css";

type Props = {profile: PublicActorProfile;ru:boolean;readOnly:true} | {
  profile: SelfProfile; ru: boolean; pending: boolean;readOnly?:false;
  onUpload: (kind: ProfileMediaKind, file: File) => Promise<boolean>; onChooseAvatar: (id: string) => Promise<boolean>; onRemove: (kind: ProfileMediaKind) => void;
  onSave: (details: SelfProfileDetails) => Promise<boolean>;
};
export function ProfileIdentity(props:Props) {
  const {profile,ru}=props,edit=props.readOnly?null:props;
  const copy = profileCopy(ru);
  const [failed, setFailed] = useState<readonly string[]>([]), [editing, setEditing] = useState(false);
  const [choosing, setChoosing] = useState(false), character = avatarCharacter(profile.avatarCharacterId);
  const initials = profile.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "QA";
  const contact = edit?.profile.contactUrl && /^(https:\/\/|mailto:)/i.test(edit.profile.contactUrl) ? edit.profile.contactUrl : null;
  const agent=props.readOnly&&props.profile.kind==='agent';
  const imageUrl = [profile.avatar?.url, character?.image].find(url => url && !failed.includes(url));
  const picture=agent?<CodexMark className={styles.agent} />:imageUrl ?
    <img src={imageUrl} alt={profile.name} referrerPolicy="no-referrer" onError={() => setFailed(previous => [...previous, imageUrl])} />:
    <span className={styles.initials}>{initials}</span>;
  return <section className={styles.identity} aria-label={props.readOnly?(ru?"Профиль участника":"Member profile"):copy.title} data-read-only={props.readOnly||undefined}>
    <div className={styles.portrait}>
      {edit?<button type="button" className={styles.photo} disabled={edit.pending} onClick={() => setChoosing(true)} aria-label={copy.avatar}>
        {picture}<span className={styles.camera}><Camera size={16} strokeWidth={1.6} /><span>{copy.avatar}</span></span>
      </button>:<div className={styles.photo}>{picture}</div>}
      {edit?.profile.hasAvatar && <button type="button" className={styles.remove} disabled={edit.pending} onClick={() => edit.onRemove("avatar")} aria-label={copy.removeAvatar} title={copy.removeAvatar}><Trash2 size={15} strokeWidth={1.6} /></button>}
    </div>
    <div className={styles.person}>
      <div className={styles.name}><h2>{profile.name}</h2>{edit&&<button type="button" disabled={edit.pending} onClick={() => setEditing(value => !value)} aria-label={ru ? "Редактировать профиль" : "Edit profile"} aria-expanded={editing}><Pencil size={15} strokeWidth={1.6} /></button>}</div>
      {!editing && <>{profile.introduction && <p>{profile.introduction}</p>}
        {edit&&<address className={styles.contacts}>
          {contact && <a href={contact} target="_blank" rel="noreferrer"><Link2 size={14} /><span>{contact.replace(/^https:\/\//i, "").replace(/^mailto:/i, "")}</span></a>}
          {edit.profile.email && <span><Mail size={14} /><span>{edit.profile.email}</span></span>}
        </address>}</>}
      {editing&&edit&&<div className={styles.editor}><ProfileEditor profile={edit.profile} pending={edit.pending} ru={ru} onCancel={() => setEditing(false)} onSave={async details => { const saved = await edit.onSave(details); if (saved) setEditing(false); return saved; }} /></div>}
    </div>
    {edit && choosing && <AvatarChooser currentCharacterId={edit.profile.avatarCharacterId} hasPhoto={edit.profile.hasAvatar}
      pending={edit.pending} ru={ru} onSave={edit.onChooseAvatar} onUpload={file => edit.onUpload("avatar", file)} onClose={() => setChoosing(false)} />}
  </section>;
}
