"use client";
import { Camera, Link2, Mail, MapPin, RotateCcw, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { ProfileMediaKind, SelfProfile, SelfProfileActivity } from "../../domain/profile-model";
import { profileCopy } from "../copy/profile-copy";
import styles from "./profile-identity.module.css";

const DEFAULT_COVER = "https://saturnusgo.com/falcon/profile/banner-default-v1.webp";
export function ProfileIdentity({ profile, totals, days, ru, pending, onUpload, onRemove }: {
  profile: SelfProfile; totals: SelfProfileActivity["totals"] | undefined; days: number; ru: boolean; pending: boolean;
  onUpload: (kind: ProfileMediaKind, file: File) => void; onRemove: (kind: ProfileMediaKind) => void;
}) {
  const copy = profileCopy(ru), avatarInput = useRef<HTMLInputElement>(null), bannerInput = useRef<HTMLInputElement>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const banner = profile.banner?.url && failed !== profile.banner.url ? profile.banner.url : DEFAULT_COVER;
  const initials = profile.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "QA";
  const number = new Intl.NumberFormat(ru ? "ru-RU" : "en-US");
  const contact = profile.contactUrl && /^(https:\/\/|mailto:)/i.test(profile.contactUrl) ? profile.contactUrl : null;
  return <aside className={styles.identity} aria-label={copy.title}>
    <div className={styles.cover}>
      <img src={banner} alt="" referrerPolicy="no-referrer" onError={() => { if (banner !== DEFAULT_COVER) setFailed(banner); }} />
      <div className={styles.coverActions}>
        <button type="button" disabled={pending} onClick={() => bannerInput.current?.click()} aria-label={copy.banner} title={copy.banner}><Camera size={15} /></button>
        {profile.hasBanner && <button type="button" disabled={pending} onClick={() => onRemove("banner")} aria-label={copy.removeBanner} title={copy.removeBanner}><RotateCcw size={15} /></button>}
      </div>
    </div>
    <div className={styles.avatarRow}>
      <button type="button" className={styles.avatar} disabled={pending} onClick={() => avatarInput.current?.click()} aria-label={copy.avatar} title={copy.avatar}>
        {profile.avatar?.url && failed !== profile.avatar.url ? <img src={profile.avatar.url} alt="" referrerPolicy="no-referrer" onError={() => setFailed(profile.avatar!.url)} /> : <span>{initials}</span>}
        <span className={styles.camera}><Camera size={12} /></span>
      </button>
      {profile.hasAvatar && <button type="button" className={styles.remove} disabled={pending} onClick={() => onRemove("avatar")} aria-label={copy.removeAvatar} title={copy.removeAvatar}><Trash2 size={14} /></button>}
    </div>
    <div className={styles.person}><h2>{profile.name}</h2><p>{profile.introduction || (profile.accountKind === "personal" ? copy.personal : copy.company)}</p></div>
    <dl className={styles.counts} aria-label={copy.count(days)}>
      {(["executedCases", "defects", "authoredCases", "runs"] as const).map(key => <div key={key}><dt>{copy.metrics[key]}</dt><dd>{totals ? number.format(totals[key]) : "—"}</dd></div>)}
    </dl>
    <p className={styles.period}>{copy.count(days)}</p>
    {profile.bio && <section className={styles.about}><h3>{copy.bio}</h3><p>{profile.bio}</p></section>}
    <address className={styles.contacts}>
      {profile.location && <span><MapPin size={14} />{profile.location}</span>}
      {contact && <a href={contact} target="_blank" rel="noreferrer"><Link2 size={14} /><span>{contact.replace(/^https:\/\//i, "").replace(/^mailto:/i, "")}</span></a>}
      <span><Mail size={14} /><span>{profile.email}</span></span>
    </address>
    {(["avatar", "banner"] as const).map(kind => <input key={kind} ref={kind === "avatar" ? avatarInput : bannerInput} type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={pending}
      onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) onUpload(kind, file); }} />)}
  </aside>;
}
