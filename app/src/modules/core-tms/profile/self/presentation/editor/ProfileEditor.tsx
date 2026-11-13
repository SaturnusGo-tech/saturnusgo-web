"use client";
import { useFormLeave } from "../../../../authoring/leave/state/value/useFormLeave";
import { useEffect, useState } from "react";
import type { SelfProfile, SelfProfileDetails } from "../../domain/profile-model";
import { profileCopy } from "../copy/profile-copy";
import styles from "./profile-editor.module.css";

export function ProfileEditor({ profile, pending, ru, onSave, onCancel }: {
  profile: SelfProfile; pending: boolean; ru: boolean; onSave: (details: SelfProfileDetails) => Promise<boolean>; onCancel?: () => void;
}) {
  const copy = profileCopy(ru);
  const [name, setName] = useState(profile.name), [phone, setPhone] = useState(profile.phone ?? "");
  const [introduction, setIntroduction] = useState(profile.introduction ?? "");
  const [contactUrl, setContactUrl] = useState(profile.contactUrl ?? "");
  const leave = useFormLeave({ name, phone, introduction, contactUrl }, { id: `profile:${profile.id}`, busy: pending });
  useEffect(() => {
    leave.reset({ name: profile.name, phone: profile.phone ?? "", introduction: profile.introduction ?? "", contactUrl: profile.contactUrl ?? "" });
    setName(profile.name); setPhone(profile.phone ?? ""); setIntroduction(profile.introduction ?? "");
    setContactUrl(profile.contactUrl ?? "");
  }, [profile.id, profile.name, profile.phone, profile.introduction, profile.contactUrl]);
  const dirty = name !== profile.name || phone !== (profile.phone ?? "") || introduction !== (profile.introduction ?? "")
    || contactUrl !== (profile.contactUrl ?? "");
  return <form className={styles.form} aria-label={copy.details} onSubmit={async event => {
    event.preventDefault(); if (!dirty || pending) return;
    if (await onSave({ name: name.trim(), phone: phone.trim(), introduction: introduction.trim(), bio: profile.bio ?? "", location: profile.location ?? "", contactUrl: contactUrl.trim() || null })) leave.reset();
  }}>
    <label className={styles.field}><span>{copy.name}</span><input value={name} onChange={event => setName(event.target.value)} required maxLength={200} autoComplete="name" disabled={pending} /></label>
    <label className={styles.field}><span>{copy.introduction}</span><small>{copy.introductionHint}</small>
      <textarea rows={2} value={introduction} onChange={event => setIntroduction(event.target.value)} maxLength={160} disabled={pending} aria-describedby="profile-introduction-count" />
      <span className={styles.counter} id="profile-introduction-count">{copy.remaining(160 - introduction.length)}</span>
    </label>
    <div className={styles.pair}>
      <label className={styles.field}><span>{copy.contact}</span><input value={contactUrl} onChange={event => setContactUrl(event.target.value)} placeholder="https://" pattern="https://.*|mailto:.*|" maxLength={2048} disabled={pending} /></label>
      <label className={styles.field}><span>{copy.phone}</span><input type="tel" value={phone} onChange={event => setPhone(event.target.value)} pattern={String.raw`(?:|\+?[0-9 \(\)\-]{7,32})`} maxLength={32} autoComplete="tel" disabled={pending} /></label>
    </div>
    <footer>{onCancel && <button className={styles.cancel} type="button" disabled={pending} onClick={() => { void leave.close(onCancel); }}>{ru ? "Отмена" : "Cancel"}</button>}<button type="submit" disabled={pending || !dirty || !name.trim()}>{pending ? copy.saving : copy.save}</button></footer>
  </form>;
}
